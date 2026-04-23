import getDB from "@/lib/mongodb";
import {
  hashEmailVerificationToken,
  isEmailVerificationExpired,
} from "@/lib/emailVerification";

function successRedirectUrl(req) {
  const base = process.env.NEXT_PUBLIC_BASE_URL?.trim() || process.env.APP_BASE_URL?.trim() || new URL(req.url).origin;
  return `${base.replace(/\/+$/, "")}/login?email_verified=1`;
}

function failedRedirectUrl(req) {
  const base = process.env.NEXT_PUBLIC_BASE_URL?.trim() || process.env.APP_BASE_URL?.trim() || new URL(req.url).origin;
  return `${base.replace(/\/+$/, "")}/login?email_verified=0`;
}

async function verifyTokenAndUpdate(token) {
  const tokenHash = hashEmailVerificationToken(token);
  const { db } = await getDB();
  const user = await db.collection("users").findOne({ "emailVerification.tokenHash": tokenHash });

  if (!user) {
    return { ok: false, reason: "invalid" };
  }

  if (user?.emailVerification?.verified === true) {
    return { ok: true, alreadyVerified: true };
  }

  if (isEmailVerificationExpired(user?.emailVerification?.expiresAt)) {
    return { ok: false, reason: "expired" };
  }

  await db.collection("users").updateOne(
    { userId: user.userId },
    {
      $set: {
        "emailVerification.verified": true,
        "emailVerification.verifiedAt": new Date(),
        "emailVerification.tokenHash": null,
        "emailVerification.expiresAt": null,
        updatedAt: new Date(),
      },
    }
  );

  return { ok: true };
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const token = String(searchParams.get("token") || "").trim();
    if (!token) {
      return Response.redirect(failedRedirectUrl(req), 303);
    }

    const result = await verifyTokenAndUpdate(token);
    return Response.redirect(result.ok ? successRedirectUrl(req) : failedRedirectUrl(req), 303);
  } catch (error) {
    console.error("Email verification GET error:", error);
    return Response.redirect(failedRedirectUrl(req), 303);
  }
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null);
    const token = String(body?.token || "").trim();
    if (!token) {
      return Response.json({ ok: false, error: "Token is required" }, { status: 400 });
    }

    const result = await verifyTokenAndUpdate(token);
    if (!result.ok) {
      return Response.json({ ok: false, error: "Token is invalid or expired" }, { status: 400 });
    }

    return Response.json({ ok: true, verified: true });
  } catch (error) {
    console.error("Email verification POST error:", error);
    return Response.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
