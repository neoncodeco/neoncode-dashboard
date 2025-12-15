import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/firebaseClient"; 

export async function POST(req) {
  try {
    // ---- Verify Auth ----
    const user = verifyToken(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); // ---- Inputs ----

    const { ad_account_id, new_limit, old_limit } = await req.json();
    if (!ad_account_id || new_limit === undefined)
      return NextResponse.json(
        { error: "Invalid Input: ad_account_id and new_limit are required." },
        { status: 400 }
      );

    // ---- Unit Conversion (MOST IMPORTANT FIX) ----
    // Convert limit to sub-units (cents/paisa) by multiplying by 100
    const spendCapInSubUnits = Math.round(new_limit * 100);

    const db = await getDB(); // Assuming this connects to MongoDB // ---- FB Spending Limit Update ----

    const response = await fetch(
      // URL Format: v18.0/act_1234567890
      `https://graph.facebook.com/v18.0/act_${ad_account_id}`,
      {
        method: "POST", // Header will be automatically set to application/x-www-form-urlencoded
        body: new URLSearchParams({
          access_token: process.env.FB_SYS_TOKEN,
          spend_cap: spendCapInSubUnits, 
        }),
      }
    );

    const fbResult = await response.json();

    if (fbResult.error) {
      // Log the error message from Facebook for debugging
      console.error("Facebook API Error:", fbResult.error);
      return NextResponse.json(
        {
          error: fbResult.error.message || "Facebook API Error",
        },
        { status: 400 }
      );
    } // ---- Save Log ----

    await db.collection("ads_spending_limit_logs").insertOne({
      user_id: user.uid,
      ad_account_id,
      old_limit,
      new_limit,
      approved: true,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Spending Limit Updated Successfully",
      new_spend_cap: new_limit, // Return the user-friendly limit
    });
  } catch (err) {
    console.error("Server Catch Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", details: err.message },
      { status: 500 }
    );
  }
}
