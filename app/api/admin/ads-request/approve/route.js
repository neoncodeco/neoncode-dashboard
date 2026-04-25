import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";
import { ObjectId } from "mongodb";
import { normalizeAssignedAccounts } from "@/lib/adAccountRequests";
import { serializeMongoId } from "@/lib/serializeMongoId";
import { notifyUserDashboardActivity } from "@/lib/whatsappActivityNotify";

const assertAdmin = async (req) => {
  const decoded = await verifyToken(req);
  if (!decoded) return { error: "Unauthorized", status: 401 };

  const { db } = await getDB();
  const admin = await db.collection("users").findOne({ userId: decoded.uid });
  if (!admin || (admin.role !== "admin" && admin.role !== "manager")) {
    return { error: "Forbidden", status: 403 };
  }

  return { db };
};

const buildUpdateData = (payload) => {
  const updateData = {};
  const fields = [
    "status",
    "MetaAccountID",
    "assignedAccounts",
    "accountName",
    "bmId",
    "timezone",
    "facebookPage",
    "email",
    "monthlyBudget",
    "usdToBdtRate",
    "startDate",
    "userUid",
    "userEmail",
  ];

  fields.forEach((k) => {
    if (payload[k] !== undefined) {
      if (k === "monthlyBudget" || k === "usdToBdtRate") {
        const raw = payload[k];
        const n =
          typeof raw === "string"
            ? parseFloat(String(raw).replace(/,/g, "").trim(), 10)
            : Number(raw);
        updateData[k] = Number.isFinite(n) && n >= 0 ? n : 0;
      } else if (k === "assignedAccounts") {
        updateData[k] = normalizeAssignedAccounts(payload[k], payload);
        if (!updateData.MetaAccountID && updateData[k][0]?.MetaAccountID) {
          updateData.MetaAccountID = updateData[k][0].MetaAccountID;
        }
        if (!updateData.accountName && updateData[k][0]?.accountName) {
          updateData.accountName = updateData[k][0].accountName;
        }
      } else {
        updateData[k] = payload[k];
      }
    }
  });

  updateData.updatedAt = new Date();
  return updateData;
};

export async function PUT(req) {
  try {
    const auth = await assertAdmin(req);
    if (auth.error) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }
    const { db } = auth;

    const payload = await req.json();
    const id = serializeMongoId(payload.id ?? payload._id);
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid or missing ID" }, { status: 400 });
    }

    const existing = await db.collection("adAccountRequests").findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return NextResponse.json({ message: "Request not found in database" }, { status: 404 });
    }

    const updateData = buildUpdateData(payload);
    const mergedForSlots = { ...existing, ...updateData };

    const pendingActivationStatus = String(updateData.status ?? payload.status ?? existing.status ?? "").toLowerCase();
    const metaClean = String(updateData.MetaAccountID ?? payload.MetaAccountID ?? existing.MetaAccountID ?? "").trim();

    const sourceSlots =
      Array.isArray(updateData.assignedAccounts) && updateData.assignedAccounts.length > 0
        ? updateData.assignedAccounts
        : Array.isArray(existing.assignedAccounts) && existing.assignedAccounts.length > 0
          ? existing.assignedAccounts
          : null;

    if (sourceSlots?.length) {
      const slotFallback = {
        ...mergedForSlots,
        ...(pendingActivationStatus === "active" && metaClean
          ? { status: "active", MetaAccountID: metaClean }
          : {}),
      };
      updateData.assignedAccounts = normalizeAssignedAccounts(sourceSlots, slotFallback);
    }

    const result = await db.collection("adAccountRequests").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: "after" }
    );

    const updatedDoc = result.value || result;
    if (!updatedDoc) {
      return NextResponse.json({ message: "Request not found in database" }, { status: 404 });
    }

    const prevStatus = String(existing.status || "").toLowerCase();
    const nextStatus = String(updatedDoc.status || "").toLowerCase();
    const becameActive = nextStatus === "active" && prevStatus !== "active";
    if (becameActive && updatedDoc.userUid) {
      const label = updatedDoc.MetaAccountID || updatedDoc.accountName || "Ad account";
      void notifyUserDashboardActivity(
        db,
        updatedDoc.userUid,
        `NeonCode: Your Meta ad account is approved — ${label}.`
      );
    }

    await db.collection("otherCollection").insertOne({
      requestId: updatedDoc._id,
      userUid: updatedDoc.userUid,
      type: "Meta Account Updated",
      title: updatedDoc.MetaAccountID || "",
      status: updatedDoc.status,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      ok: true,
      message: "Request updated successfully",
      data: updatedDoc,
    });
  } catch (err) {
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await assertAdmin(req);
    if (auth.error) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }
    const { db } = auth;

    const body = await req.json();
    const assignedAccounts = normalizeAssignedAccounts(body.assignedAccounts, body);
    const primaryAccount = assignedAccounts[0] || {};
    const doc = {
      accountName: body.accountName || primaryAccount.accountName || "Manual Account",
      bmId: body.bmId || primaryAccount.bmId || "",
      timezone: body.timezone || primaryAccount.timezone || "BST",
      facebookPage: body.facebookPage || primaryAccount.facebookPage || "",
      email: body.email || primaryAccount.email || "",
      monthlyBudget: Number(body.monthlyBudget || primaryAccount.monthlyBudget || 0),
      usdToBdtRate: Number(body.usdToBdtRate || primaryAccount.usdToBdtRate || 0),
      startDate: body.startDate || primaryAccount.startDate || "",
      userEmail: body.userEmail || primaryAccount.userEmail || "",
      userUid: body.userUid || primaryAccount.userUid || "",
      MetaAccountID: body.MetaAccountID || primaryAccount.MetaAccountID || "",
      assignedAccounts,
      status: body.status || primaryAccount.status || "active",
      createdAt: new Date(),
      updatedAt: new Date(),
      source: "admin-manual",
    };

    const result = await db.collection("adAccountRequests").insertOne(doc);
    if (doc.userUid && String(doc.status || "").toLowerCase() === "active") {
      const label = doc.MetaAccountID || doc.accountName || "Ad account";
      void notifyUserDashboardActivity(db, doc.userUid, `NeonCode: Your Meta ad account is approved — ${label}.`);
    }
    return NextResponse.json({
      ok: true,
      message: "Ad account added successfully",
      data: { ...doc, _id: result.insertedId },
    });
  } catch (err) {
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const auth = await assertAdmin(req);
    if (auth.error) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }
    const { db } = auth;

    const body = await req.json();
    const id = serializeMongoId(body.id ?? body._id);
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid or missing ID" }, { status: 400 });
    }

    await db.collection("adAccountRequests").updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: "cancelled", updatedAt: new Date() } }
    );

    return NextResponse.json({ ok: true, message: "Ad account cancelled successfully" });
  } catch (err) {
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}
