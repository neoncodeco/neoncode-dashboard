import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";

const getCreditCost = (assetType) => {
  return String(assetType || "").toLowerCase() === "video" ? 2 : 1;
};

const safeType = (assetType) => {
  return String(assetType || "").toLowerCase() === "video" ? "video" : "image";
};

const extractResourceIdFromText = (value) => {
  const text = String(value || "");
  const patterns = [
    /_(\d+)(?:\.htm|[/?#]|$)/i,
    /-(\d+)(?:\.htm|[/?#]|$)/i,
    /\/(\d+)(?:[/?#]|$)/i,
    /"id"\s*:\s*(\d+)/i,
    /"resource_id"\s*:\s*(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
};

const extractResourceIdFromUrl = async (assetUrl) => {
  const directId = extractResourceIdFromText(assetUrl);
  if (directId) return directId;

  let parsedUrl;
  try {
    parsedUrl = new URL(assetUrl);
  } catch {
    return null;
  }

  const path = parsedUrl.pathname.toLowerCase();
  if (path.includes("/pikaso/explore/")) {
    throw new Error(
      "This is a Pikaso explore link. Please use a Freepik asset page link with numeric ID (example: ..._39178780.htm)."
    );
  }

  try {
    const pageRes = await fetch(assetUrl, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    const finalUrl = pageRes.url || assetUrl;
    const fromFinalUrl = extractResourceIdFromText(finalUrl);
    if (fromFinalUrl) return fromFinalUrl;

    const html = await pageRes.text();
    const fromHtml = extractResourceIdFromText(html);
    if (fromHtml) return fromHtml;
  } catch {
    return null;
  }

  return null;
};

const resolveDownloadLink = async ({ assetUrl, assetType }) => {
  const apiKey = process.env.FREEPIK_API_KEY?.trim();
  const apiBase = process.env.FREEPIK_API_BASE_URL?.trim() || "https://api.freepik.com";

  if (!apiKey) {
    throw new Error("Missing FREEPIK_API_KEY in environment");
  }

  const resourceId = await extractResourceIdFromUrl(assetUrl);
  if (!resourceId) {
    throw new Error("Could not detect Freepik resource id from link");
  }

  const endpoint =
    assetType === "video"
      ? `${apiBase}/v1/videos/${resourceId}/download`
      : `${apiBase}/v1/resources/${resourceId}/download`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      "x-freepik-api-key": apiKey,
      Accept: "application/json",
    },
  });

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  const downloadUrl =
    payload?.data?.url ||
    payload?.data?.download_url ||
    payload?.downloadUrl ||
    payload?.url;

  if (!response.ok || !downloadUrl) {
    const reason = payload?.error || payload?.message || "Freepik download API failed";
    throw new Error(reason);
  }

  return { downloadUrl, source: "freepik-api", resourceId };
};

export async function POST(req) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const assetUrl = String(body?.assetUrl || "").trim();
    const assetType = safeType(body?.assetType);
    const creditCost = getCreditCost(assetType);

    if (!assetUrl) {
      return NextResponse.json({ ok: false, error: "Asset link is required" }, { status: 400 });
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(assetUrl);
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid URL format" }, { status: 400 });
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return NextResponse.json({ ok: false, error: "Unsupported URL protocol" }, { status: 400 });
    }

    const { db } = await getDB();
    const now = new Date();

    const user = await db
      .collection("users")
      .findOne({ userId: decoded.uid }, { projection: { freepikCredits: 1, email: 1 } });

    if (!user || Number(user.freepikCredits || 0) < creditCost) {
      return NextResponse.json(
        { ok: false, error: `Not enough credits. ${assetType} download needs ${creditCost} credits.` },
        { status: 400 }
      );
    }

    const { downloadUrl, source, resourceId } = await resolveDownloadLink({ assetUrl, assetType });

    const updatedUserResult = await db.collection("users").findOneAndUpdate(
      { userId: decoded.uid, freepikCredits: { $gte: creditCost } },
      {
        $inc: { freepikCredits: -creditCost },
        $set: { updatedAt: now },
      },
      {
        returnDocument: "after",
        projection: { freepikCredits: 1, email: 1 },
      }
    );

    const updatedUser = updatedUserResult?.value || updatedUserResult;
    if (!updatedUser) {
      return NextResponse.json(
        { ok: false, error: `Not enough credits. ${assetType} download needs ${creditCost} credits.` },
        { status: 400 }
      );
    }

    await db.collection("freepik_downloads").insertOne({
      userUid: decoded.uid,
      email: updatedUser.email || decoded.email || "",
      assetUrl,
      resourceId,
      assetType,
      creditCost,
      source,
      createdAt: now,
    });

    await db.collection("otherCollection").insertOne({
      userUid: decoded.uid,
      type: "freepik_download",
      title: `Freepik ${assetType} download`,
      description: `${creditCost} credits deducted for download.`,
      status: "approved",
      createdAt: now,
    });

    return NextResponse.json({
      ok: true,
      message: `${creditCost} credits deducted`,
      data: {
        downloadUrl,
        remainingCredits: Number(updatedUser.freepikCredits || 0),
      },
    });
  } catch (error) {
    console.error("FREEPIK DOWNLOAD ERROR:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
