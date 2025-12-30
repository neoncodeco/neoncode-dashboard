import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";

export async function GET(req) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { db } = await getDB();

    const admin = await db.collection("users").findOne({ userId: decoded.uid });
    if (!admin || (admin.role !== "admin" && admin.role !== "manager")) {
      return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // 🔄 MongoDB Aggregation to join with users collection
    const logs = await db.collection("ads_spending_limit_logs").aggregate([
      { $sort: { timestamp: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "user_id", // matches with userId in logs
          foreignField: "userId",
          as: "userDetails"
        }
      },
      {
        $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          _id: 1,
          user_id: 1,
          ad_account_id: 1,
          old_limit: 1,
          new_limit: 1,
          change_amount: 1,
          wallet_before: 1,
          wallet_after: 1,
          timestamp: 1,
          userName: "$userDetails.name",
          userEmail: "$userDetails.email",
          userPhoto: "$userDetails.photo"
        }
      }
    ]).toArray();

    const total = await db.collection("ads_spending_limit_logs").countDocuments();

    return NextResponse.json({
      success: true,
      page,
      limit,
      total,
      data: logs,
    });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}