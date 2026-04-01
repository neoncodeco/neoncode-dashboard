import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";
import { sendZavuTemplateOtp } from "@/lib/zavuSms";
import {
  canResendOtp,
  generateOtpCode,
  getOtpExpiryDate,
  hashOtpCode,
  OTP_RESEND_COOLDOWN_MS,
} from "@/lib/otpUtils"; 
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded?.uid) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { phone } = await req.json();

    // simple validation
    if (!phone || !phone.startsWith("880")) {
      return NextResponse.json(
        { ok: false, error: "Enter valid phone like 8801XXXXXXXXX" },
        { status: 400 }
      );
    }

    const { db } = await getDB();

    const user = await db.collection("users").findOne(
      { userId: decoded.uid },
      { projection: { phoneVerification: 1 } }
    );

    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    if (!canResendOtp(user.phoneVerification?.requestedAt)) {
      return NextResponse.json(
        {
          ok: false,
          error: `Wait ${Math.ceil(OTP_RESEND_COOLDOWN_MS / 1000)} sec`,
        },
        { status: 429 }
      );
    }

    const otp = generateOtpCode();
    const expiresAt = getOtpExpiryDate();

    // 🔥 ZAVU SEND
  const sendResult = await sendZavuTemplateOtp({ to: phone, code: otp });

    if (!sendResult.ok) {
      return NextResponse.json(
        { ok: false, error: `OTP failed: ${sendResult.error}` },
        { status: 502 }
      );
    }

    await db.collection("users").updateOne(
      { userId: decoded.uid },
      {
        $set: {
          phone,
          phoneVerification: {
            verified: false,
            status: "pending",
            requestedAt: new Date(),
            expiresAt,
            codeHash: hashOtpCode(otp),
            attempts: 0,
          },
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      ok: true,
      message: `OTP sent to ${phone}`,
    });
  } catch (err) {
    console.error("OTP send error:", err);
    return NextResponse.json({ ok: false, error: "Failed to send OTP." }, { status: 500 });
  }
}