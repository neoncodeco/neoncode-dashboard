import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";
import {
  hashOtpCode,
  isOtpExpired,
  MAX_OTP_ATTEMPTS,
} from "@/lib/otpUtils"; // ✅ FIXED
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded?.uid) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await req.json();
    const normalizedCode = String(code || "").replace(/\D/g, "");

    if (normalizedCode.length !== 6) {
      return NextResponse.json(
        { ok: false, error: "Enter 6-digit OTP" },
        { status: 400 }
      );
    }

    const { db } = await getDB();

    const user = await db.collection("users").findOne(
      { userId: decoded.uid },
      { projection: { phone: 1, phoneVerification: 1 } } // ✅ FIX
    );

    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const verification = user.phoneVerification || {};

    
    // ✅ FIXED
    if (!user.phone || !verification.codeHash) {
      return NextResponse.json(
        { ok: false, error: "Request OTP first" },
        { status: 400 }
      );
    }

    if (verification.attempts >= MAX_OTP_ATTEMPTS) {
      return NextResponse.json(
        { ok: false, error: "Too many attempts" },
        { status: 429 }
      );
    }

    if (verification.verified) {
  return NextResponse.json({
    ok: true,
    message: "Already verified ✅",
  });
}
    if (isOtpExpired(verification.expiresAt)) {
      await db.collection("users").updateOne(
        { userId: decoded.uid },
        {
          $set: {
            "phoneVerification.status": "expired",
            "phoneVerification.codeHash": null,
          },
        }
      );

      return NextResponse.json(
        { ok: false, error: "OTP expired" },
        { status: 400 }
      );
    }

    if (hashOtpCode(normalizedCode) !== verification.codeHash) {
      await db.collection("users").updateOne(
        { userId: decoded.uid },
        {
          $inc: { "phoneVerification.attempts": 1 },
        }
      );

      return NextResponse.json(
        { ok: false, error: "Invalid OTP" },
        { status: 400 }
      );
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
          "phoneVerification.attempts": 0,
        },
      }
    );

    return NextResponse.json({
      ok: true,
      message: "Phone verified successfully ✅",
    });
  } catch (err) {
    console.error("OTP verify error:", err);
    return NextResponse.json({ ok: false, error: "Verification failed." }, { status: 500 });
  }
}