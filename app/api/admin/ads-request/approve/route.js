import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";
import { ObjectId } from "mongodb";

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
    "accountName",
    "bmId",
    "timezone",
    "facebookPage",
    "email",
    "monthlyBudget",
    "startDate",
    "userUid",
    "userEmail",
  ];

  fields.forEach((k) => {
    if (payload[k] !== undefined) {
      updateData[k] = k === "monthlyBudget" ? Number(payload[k] || 0) : payload[k];
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
    const { id } = payload;
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid or missing ID" }, { status: 400 });
    }

    const updateData = buildUpdateData(payload);
    const result = await db.collection("adAccountRequests").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: "after" }
    );

    const updatedDoc = result.value || result;
    if (!updatedDoc) {
      return NextResponse.json({ message: "Request not found in database" }, { status: 404 });
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
    const doc = {
      accountName: body.accountName || "Manual Account",
      bmId: body.bmId || "",
      timezone: body.timezone || "BST",
      facebookPage: body.facebookPage || "",
      email: body.email || "",
      monthlyBudget: Number(body.monthlyBudget || 0),
      startDate: body.startDate || "",
      userEmail: body.userEmail || "",
      userUid: body.userUid || "",
      MetaAccountID: body.MetaAccountID || "",
      status: body.status || "active",
      createdAt: new Date(),
      updatedAt: new Date(),
      source: "admin-manual",
    };

    const result = await db.collection("adAccountRequests").insertOne(doc);
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

    const { id } = await req.json();
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
