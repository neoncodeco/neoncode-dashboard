import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";
import { ensureWritableUser } from "@/lib/userAccess";
import { normalizeAssignedAccounts } from "@/lib/adAccountRequests";


export async function POST(req) {
  try {
    const decoded = await verifyToken(req);

    if (!decoded) {
      return NextResponse.json(
        { message: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const { db } = await getDB();
    const access = await ensureWritableUser(db, decoded.uid);
    if (!access.ok) {
      return access.response;
    }
    const assignedAccounts = normalizeAssignedAccounts(body.assignedAccounts, body);
    const primary = assignedAccounts[0] || body;
    const bmId = String(primary?.bmId ?? "").trim();
    const monthlyBudget = Number(primary?.monthlyBudget);
    const MIN_MONTHLY_BUDGET_USD = 100;

    if (!bmId) {
      return NextResponse.json({ ok: false, message: "Business Manager ID is required." }, { status: 400 });
    }
    if (!Number.isFinite(monthlyBudget) || monthlyBudget < MIN_MONTHLY_BUDGET_USD) {
      return NextResponse.json(
        { ok: false, message: `Monthly budget is required (minimum $${MIN_MONTHLY_BUDGET_USD} USD).` },
        { status: 400 }
      );
    }
    await db.collection("adAccountRequests").insertOne({
      ...body,
      userEmail: decoded.email,
      userUid: decoded.uid,
      MetaAccountID: "",
      status: "pending",
      assignedAccounts,
      createdAt: new Date(),
    });

    return NextResponse.json({ ok: true, message: "Request submitted successfully" });
  } catch (err) {
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}
