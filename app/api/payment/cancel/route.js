import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const invoiceId = searchParams.get("invoice_id"); // এখন এটি আর null হবে না

    console.log("Extracted Tracking ID:", invoiceId);

    if (invoiceId) {
      const { db } = await getDB();
      
      const result = await db.collection("payments").updateOne(
        { trx_id: invoiceId, status: "pending" }, 
        { $set: { status: "cancelled", updatedAt: new Date() } }
      );
      
      console.log("DB Update Result:", result.modifiedCount > 0 ? "Success" : "Already Cancelled");
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    return NextResponse.redirect(new URL("/user-dashboard/payment-methods/cancel", baseUrl).toString(), 303);
    
  } catch (error) {
    return NextResponse.redirect(new URL("/user-dashboard/payment-methods", req.url));
  }
}