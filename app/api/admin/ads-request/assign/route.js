import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import getDB from "@/lib/mongodb";
import { parseJsonBody, requireAuth, requireRoles } from "@/lib/apiGuard";
import { normalizeAssignedAccounts } from "@/lib/adAccountRequests";
import { resolveUserEffectiveUsdRate } from "@/lib/dollarRateManagement";
import { serializeMongoId } from "@/lib/serializeMongoId";
import { normalizeAdAccountId } from "@/lib/metaAdsAccess";
import { notifyUserDashboardActivity } from "@/lib/whatsappActivityNotify";

function buildMetaIdCandidates(metaId) {
  const clean = normalizeAdAccountId(metaId);
  if (!clean) return [];
  return [...new Set([clean, `act_${clean}`])];
}

async function findRequestForMeta(db, metaId) {
  const candidates = buildMetaIdCandidates(metaId);
  if (!candidates.length) return null;

  return db.collection("adAccountRequests").findOne(
    {
      $or: [
        { MetaAccountID: { $in: candidates } },
        { "assignedAccounts.MetaAccountID": { $in: candidates } },
      ],
      status: { $nin: ["cancelled", "canceled", "rejected"] },
    },
    { sort: { updatedAt: -1, createdAt: -1 } }
  );
}

export async function POST(req) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.response;

    const { db } = await getDB();
    const access = await requireRoles(db, auth.decoded.uid, ["admin", "manager"]);
    if (!access.ok) return access.response;

    const body = await parseJsonBody(req);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
    }

    const userUid = String(body.userUid || "").trim();
    const metaId = normalizeAdAccountId(body.metaId);
    const requestId = serializeMongoId(body.requestId ?? body.id);
    const bmId = String(body.bmId || "").trim();
    const accountName = String(body.accountName || "").trim();
    const monthlyBudget = Number(body.monthlyBudget || 0);

    if (!userUid) {
      return NextResponse.json({ ok: false, error: "User is required" }, { status: 400 });
    }

    if (!metaId && (!requestId || !ObjectId.isValid(requestId))) {
      return NextResponse.json({ ok: false, error: "Meta account ID is required" }, { status: 400 });
    }

    const user = await db.collection("users").findOne({ userId: userUid });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const resolvedRate = await resolveUserEffectiveUsdRate(db, userUid, body.usdToBdtRate);
    const slot = {
      accountName: accountName || (metaId ? `Ad Account ${metaId.slice(-4)}` : "Ad Account"),
      bmId,
      MetaAccountID: metaId,
      monthlyBudget: Number.isFinite(monthlyBudget) && monthlyBudget > 0 ? monthlyBudget : 0,
      userUid,
      userEmail: user.email || "",
      status: "active",
      usdToBdtRate: resolvedRate,
    };

    let existing = null;
    if (requestId && ObjectId.isValid(requestId)) {
      existing = await db.collection("adAccountRequests").findOne({ _id: new ObjectId(requestId) });
    }
    if (!existing && metaId) {
      existing = await findRequestForMeta(db, metaId);
    }

    const now = new Date();
    let resultDoc = null;
    let becameActive = false;

    if (existing) {
      const prevStatus = String(existing.status || "").toLowerCase();
      const prevUserUid = String(existing.userUid || "").trim();
      const assignedAccounts = normalizeAssignedAccounts([slot], {
        ...existing,
        ...slot,
        status: "active",
        usdToBdtRate: resolvedRate,
      });

      const update = {
        accountName: slot.accountName,
        bmId: bmId || existing.bmId || "",
        MetaAccountID: metaId || existing.MetaAccountID || "",
        monthlyBudget: slot.monthlyBudget,
        userUid,
        userEmail: user.email || "",
        status: "active",
        usdToBdtRate: resolvedRate,
        assignedAccounts,
        updatedAt: now,
      };

      const updated = await db.collection("adAccountRequests").findOneAndUpdate(
        { _id: existing._id },
        { $set: update },
        { returnDocument: "after" }
      );

      resultDoc = updated?.value || updated;
      becameActive = String(resultDoc?.status || "").toLowerCase() === "active" && prevStatus !== "active";
      const userChanged = prevUserUid && prevUserUid !== userUid;

      if (resultDoc?.userUid && (becameActive || userChanged)) {
        const label = resultDoc.MetaAccountID || resultDoc.accountName || "Ad account";
        void notifyUserDashboardActivity(
          db,
          resultDoc.userUid,
          `NeonCode: Meta ad account assigned to you — ${label}.`
        );
      }
    } else {
      const assignedAccounts = normalizeAssignedAccounts([slot], {
        ...slot,
        status: "active",
        usdToBdtRate: resolvedRate,
      });

      const doc = {
        accountName: slot.accountName,
        bmId,
        timezone: "BST",
        monthlyBudget: slot.monthlyBudget,
        usdToBdtRate: resolvedRate,
        userEmail: user.email || "",
        userUid,
        MetaAccountID: metaId,
        assignedAccounts,
        status: "active",
        createdAt: now,
        updatedAt: now,
        source: "admin-available-assign",
      };

      const insertResult = await db.collection("adAccountRequests").insertOne(doc);
      resultDoc = { ...doc, _id: insertResult.insertedId };
      becameActive = true;

      if (doc.userUid) {
        const label = doc.MetaAccountID || doc.accountName || "Ad account";
        void notifyUserDashboardActivity(
          db,
          doc.userUid,
          `NeonCode: Your Meta ad account is approved — ${label}.`
        );
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Ad account assigned successfully",
      requestId: serializeMongoId(resultDoc?._id),
      data: {
        requestId: serializeMongoId(resultDoc?._id),
        metaId: normalizeAdAccountId(resultDoc?.MetaAccountID) || metaId,
        userUid: resultDoc?.userUid || userUid,
        userEmail: resultDoc?.userEmail || user.email || "",
        accountName: resultDoc?.accountName || slot.accountName,
        status: resultDoc?.status || "active",
        becameActive,
      },
    });
  } catch (error) {
    console.error("ASSIGN AD ACCOUNT ERROR:", error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
