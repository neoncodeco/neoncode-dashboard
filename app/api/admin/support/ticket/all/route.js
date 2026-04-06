
import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";

export async function GET(req) {
  const decoded = await verifyToken(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { db } = await getDB();
  const admin = await db.collection("users").findOne({ userId: decoded.uid });

  if (!["admin", "manager"].includes(admin.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tickets = await db
    .collection("tickets")
    .find({})
    .sort({ updatedAt: -1 })
    .toArray();

  const userIds = [...new Set(tickets.map((ticket) => ticket.userId).filter(Boolean))];
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
  const ticketsWithUserName = tickets.map((ticket) => {
    const matchedUser = userMap.get(ticket.userId);
    return {
      ...ticket,
      userName: ticket.userName || matchedUser?.name || "",
      userEmail: ticket.userEmail || matchedUser?.email || "",
    };
  });

  return NextResponse.json({ ok: true, data: ticketsWithUserName });
}
