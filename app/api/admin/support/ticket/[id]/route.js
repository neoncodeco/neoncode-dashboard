
import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { verifyToken } from "@/lib/verifyToken";

const requireAdminOrManager = async (req, db) => {
  const decoded = await verifyToken(req);
  if (!decoded) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const user = await db.collection("users").findOne({ userId: decoded.uid });
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "User not found" }, { status: 404 }),
    };
  }

  if (!["admin", "manager"].includes(user.role)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, user };
};

export async function GET(req, { params }) {
  try {

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ticket id" }, { status: 400 });
    }
    const { db } = await getDB();
    const access = await requireAdminOrManager(req, db);
    if (!access.ok) return access.response;

    const ticket = await db.collection("tickets").findOne({
      _id: new ObjectId(id),
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    const ticketUser = ticket.userId
      ? await db.collection("users").findOne(
          { userId: ticket.userId },
          { projection: { userId: 1, name: 1, email: 1 } }
        )
      : null;

    return NextResponse.json({
      ok: true,
      data: {
        ...ticket,
        userName: ticket.userName || ticketUser?.name || "",
        userEmail: ticket.userEmail || ticketUser?.email || "",
      },
    });

  } catch (err) {
    console.error("ADMIN GET TICKET ERROR:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ticket id" }, { status: 400 });
    }

    const { db } = await getDB();
    const access = await requireAdminOrManager(req, db);
    if (!access.ok) return access.response;

    const result = await db.collection("tickets").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "closed",
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, message: "Ticket closed" });
  } catch (err) {
    console.error("ADMIN CLOSE TICKET ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ticket id" }, { status: 400 });
    }

    const { db } = await getDB();
    const access = await requireAdminOrManager(req, db);
    if (!access.ok) return access.response;

    const result = await db.collection("tickets").deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, message: "Ticket deleted" });
  } catch (err) {
    console.error("ADMIN DELETE TICKET ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
