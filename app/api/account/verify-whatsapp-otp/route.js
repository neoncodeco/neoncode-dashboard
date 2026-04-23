import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";
import {
  hashOtpCode,
  isOtpExpired,
  MAX_OTP_ATTEMPTS,
} from "@/lib/whatsappOtp";
import { NextResponse } from "next/server";
import { notifyUserDashboardActivity } from "@/lib/whatsappActivityNotify";

export async function POST(req) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded?.uid) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await req.json();
    const normalizedCode = String(code || "").replace(/\D/g, "");

    if (normalizedCode.length !== 6) {
      return NextResponse.json({ ok: false, error: "Enter the 6-digit OTP code." }, { status: 400 });
    }

    const { db } = await getDB();
    const user = await db.collection("users").findOne(
      { userId: decoded.uid },
      { projection: { whatsappNumber: 1, phoneVerification: 1 } }
    );

    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const verification = user.phoneVerification || {};

    if (!user.whatsappNumber || !verification.codeHash) {
      return NextResponse.json({ ok: false, error: "Request an OTP first." }, { status: 400 });
    }

    if (verification.attempts >= MAX_OTP_ATTEMPTS) {
      return NextResponse.json({ ok: false, error: "Too many wrong attempts. Request a new OTP." }, { status: 429 });
    }

    if (isOtpExpired(verification.expiresAt)) {
      await db.collection("users").updateOne(
        { userId: decoded.uid },
        {
          $set: {
            "phoneVerification.status": "expired",
            "phoneVerification.codeHash": null,
            updatedAt: new Date(),
          },
        }
      );

      return NextResponse.json({ ok: false, error: "OTP expired. Request a new code." }, { status: 400 });
    }

    const submittedHash = hashOtpCode(normalizedCode);
    if (submittedHash !== verification.codeHash) {
      await db.collection("users").updateOne(
        { userId: decoded.uid },
        {
          $inc: {
            "phoneVerification.attempts": 1,
          },
          $set: {
            updatedAt: new Date(),
          },
        }
      );

      return NextResponse.json({ ok: false, error: "Invalid OTP code." }, { status: 400 });
    }

    await db.collection("users").updateOne(
      { userId: decoded.uid },
      {
        $set: {
          "phoneVerification.verified": true,
          "phoneVerification.verifiedAt": new Date(),
          "phoneVerification.status": "verified",
          "phoneVerification.codeHash": null,
          "phoneVerification.expiresAt": null,
          "phoneVerification.requestedAt": null,
          "phoneVerification.attempts": 0,
          updatedAt: new Date(),
        },
      }
    );

    void notifyUserDashboardActivity(
      db,
      decoded.uid,
      "NeonCode: WhatsApp verified. Important dashboard activity can now be sent to this number."
    );

    return NextResponse.json({
      ok: true,
      message: "WhatsApp number verified successfully.",
      whatsappNumber: user.whatsappNumber,
    });
  } catch (error) {
    console.error("Verify WhatsApp OTP error:", error);
    return NextResponse.json({ ok: false, error: "Failed to verify OTP." }, { status: 500 });
  }
}
