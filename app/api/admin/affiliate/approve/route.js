
import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";
import { ObjectId } from "mongodb";

export async function POST(req) {
  try {
       const decoded = await verifyToken(req);
       if (!decoded) {
         return NextResponse.json(
           { ok: false, error: "Unauthorized" },
           { status: 401 }
         );
       }
   
       const { db } = await getDB();
   
       const admin = await db
         .collection("users")
         .findOne({ userId: decoded.uid });
   
       if (!admin || admin.role !== "admin" && admin.role !== "manager") {
         return NextResponse.json(
           { ok: false, error: "Forbidden" },
           { status: 403 }
         );
       }

    const { requestId, action } = await req.json();


    const request = await db.collection("referral_withdraw_requests")
      .findOne({ _id: new ObjectId(requestId) });


    if (!request || request.status !== "pending") {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (action === "approve") {
      // 🔒 increase withdrawn (NOT walletBalance)
      await db.collection("users").updateOne(
        { userId: request.userId },
        {
          $inc: {
            "referralStats.totalReferIncome": -request.amount,
            "referralStats.totalPayout": request.amount,
          },
        }
      );
    }

    await db.collection("referral_withdraw_requests").updateOne(
      { _id: request._id },
      {
        $set: {
          status: action === "approve" ? "approved" : "rejected",
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      ok: true,
      message: `Request ${action}ed`,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
