import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";

export async function GET(req) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const uid = decoded.uid;

    const { db } = await getDB();
    const admin = await db.collection("users").findOne({ userId:uid });

    if (!admin || admin.role !== "admin" && admin.role !== "manager") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payments = await db.collection("payments")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const userIds = [...new Set(payments.map((payment) => payment.userUid).filter(Boolean))];
    const users = userIds.length
      ? await db
          .collection("users")
          .find(
            { userId: { $in: userIds } },
            { projection: { userId: 1, name: 1, email: 1 } }
          )
          .toArray()
      : [];

    const userMap = new Map(users.map((item) => [item.userId, item]));
    const paymentsWithUser = payments.map((payment) => {
      const matchedUser = userMap.get(payment.userUid);
      return {
        ...payment,
        userName: payment.userName || matchedUser?.name || "",
        userEmail: payment.userEmail || matchedUser?.email || "",
      };
    });

    return NextResponse.json({ ok: true, payments: paymentsWithUser });

  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message });
  }
}
