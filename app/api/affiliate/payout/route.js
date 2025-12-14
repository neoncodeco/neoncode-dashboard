
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";

export async function POST(req) {
  try {
    const decoded = await verifyToken(req);
    const { amount, method } = await req.json();

    const { db } = await getDB();

    const user = await db.collection("users").findOne({
      userId: decoded.uid
    });

    if (!user || user.walletBalance < amount) {
      return Response.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // 🔻 Deduct balance & increase payout stat
    await db.collection("users").updateOne(
      { userId: decoded.uid },
      {
        $inc: {
          walletBalance: -amount,
          "referralStats.totalPayout": amount
        }
      }
    );

    // 🧾 Save payout history
    await db.collection("payout_history").insertOne({
      userId: decoded.uid,
      amount,
      method: method || "wallet",
      status: "completed", // later can be pending
      reference: `PO-${Date.now()}`,
      createdAt: new Date()
    });

    return Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
