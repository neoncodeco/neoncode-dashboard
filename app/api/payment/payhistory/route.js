import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { requireAuth } from "@/lib/apiGuard";
import { formatPaymentDescription, formatPaymentMethod, formatStatusLabel } from "@/lib/displayFormatters";

export async function GET(req) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) {
      return auth.response;
    }

    const { db } = await getDB();

    // Fetch all payments for this user (latest first)
    const payments = await db
      .collection("payments")
      .find({ userUid: auth.decoded.uid })
      .sort({ createdAt: -1 })
      .toArray();

    // Format response data
    const formatted = payments.map((p) => ({
      id: p.trx_id || p.trxId || String(p._id),
      date: (p.createdAt ? new Date(p.createdAt) : new Date()).toISOString(),
      description: formatPaymentDescription(p.method),
      amount: Number((p.amountBdt ?? p.amount) || 0),
      amountBdt: Number((p.amountBdt ?? p.amount) || 0),
      creditedUsdAmount: Number(p.creditedUsdAmount || 0),
      currency: p.currency || "BDT",
      method: formatPaymentMethod(p.method),
      status: p.status || "pending",
      statusLabel: formatStatusLabel(p.status || "pending"),
      screenshot: p.screenshotUrl || p.screenshot || null,
    }));

    return NextResponse.json({
      ok: true,
      count: formatted.length,
      data: formatted,
    });

  } catch (err) {
    console.error("Payment history error:", err);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
