import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";
import {
  canResendOtp,
  generateOtpCode,
  getOtpExpiryDate,
  hashOtpCode,
  isValidWhatsAppNumber,
  maskWhatsAppNumber,
  normalizeWhatsAppNumber,
  OTP_RESEND_COOLDOWN_MS,
  sendWhatsAppOtpTemplate,
} from "@/lib/whatsappOtp";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded?.uid) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { whatsappNumber } = await req.json();
    const normalizedNumber = normalizeWhatsAppNumber(whatsappNumber);

    if (!isValidWhatsAppNumber(normalizedNumber)) {
      return NextResponse.json(
        { ok: false, error: "Enter a valid WhatsApp number like 8801XXXXXXXXX." },
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
          error: `Please wait ${Math.ceil(OTP_RESEND_COOLDOWN_MS / 1000)} seconds before requesting another code.`,
        },
        { status: 429 }
      );
    }

    const code = generateOtpCode();
    const expiresAt = getOtpExpiryDate();
    const sendResult = await sendWhatsAppOtpTemplate({ to: normalizedNumber, code });

    if (!sendResult.ok) {
      return NextResponse.json({ ok: false, error: sendResult.error }, { status: 500 });
    }

    await db.collection("users").updateOne(
      { userId: decoded.uid },
      {
        $set: {
          whatsappNumber: normalizedNumber,
          phoneVerification: {
            verified: false,
            verifiedAt: null,
            status: "pending",
            requestedAt: new Date(),
            expiresAt,
            codeHash: hashOtpCode(code),
            attempts: 0,
          },
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      ok: true,
      message: `Verification code sent to WhatsApp ${maskWhatsAppNumber(normalizedNumber)}.`,
      whatsappNumber: normalizedNumber,
    });
  } catch (error) {
    console.error("Send WhatsApp OTP error:", error);
    return NextResponse.json({ ok: false, error: "Failed to send verification code." }, { status: 500 });
  }
}
