import getDB from "@/lib/mongodb";
import { isValidEmail } from "@/lib/security";
import {
  canResendOtp,
  createPasswordResetOtp,
  OTP_RESEND_COOLDOWN_MS,
  PASSWORD_RESET_MAX_REQUESTS,
} from "@/lib/passwordReset";
import { sendPasswordResetOtp } from "@/lib/mailer";
import { verifyTurnstileToken } from "@/lib/turnstile";

const GENERIC_MESSAGE = "If an account exists for this email, a reset code has been sent.";

export async function POST(req) {
  try {
    const body = await req.json();
    const email = String(body?.email || "").trim().toLowerCase();

    if (!email || !isValidEmail(email)) {
      return Response.json({ ok: false, error: "Valid email is required" }, { status: 400 });
    }

    const forwarded = req.headers.get("x-forwarded-for");
    const remoteip = forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "";
    const captchaOk = await verifyTurnstileToken(body?.turnstileToken, { remoteip });
    if (!captchaOk) {
      return Response.json({ ok: false, error: "Captcha verification failed" }, { status: 400 });
    }

    const { db } = await getDB();
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return Response.json({ ok: true, message: GENERIC_MESSAGE, otpSent: true });
    }

    if (!user.passwordHash || !user.passwordSalt) {
      return Response.json({
        ok: true,
        message: GENERIC_MESSAGE,
        otpSent: true,
      });
    }

    const resetState = user.passwordReset || {};
    const currentCount = Number(resetState.requestedCount || 0);
    if (currentCount >= PASSWORD_RESET_MAX_REQUESTS) {
      return Response.json(
        { ok: false, error: "Maximum reset requests reached. Contact support." },
        { status: 429 }
      );
    }

    if (!canResendOtp(resetState.lastRequestedAt)) {
      return Response.json(
        {
          ok: false,
          error: `Please wait ${Math.ceil(OTP_RESEND_COOLDOWN_MS / 1000)} seconds before requesting another code.`,
        },
        { status: 429 }
      );
    }

    const { code, codeHash, expiresAt } = createPasswordResetOtp();

    await db.collection("users").updateOne(
      { userId: user.userId },
      {
        $set: {
          passwordReset: {
            codeHash,
            expiresAt,
            attempts: 0,
            lastRequestedAt: new Date(),
            requestedCount: currentCount + 1,
            maxRequests: PASSWORD_RESET_MAX_REQUESTS,
            sessionTokenHash: null,
            sessionExpiresAt: null,
          },
          updatedAt: new Date(),
        },
        $unset: {
          passwordResetTokenHash: "",
          passwordResetExpiresAt: "",
        },
      }
    );

    const emailResult = await sendPasswordResetOtp({
      to: email,
      name: user?.name || "User",
      code,
    });

    return Response.json({
      ok: true,
      message: "Reset code sent to your email.",
      otpSent: true,
      requestsLeft: Math.max(0, PASSWORD_RESET_MAX_REQUESTS - (currentCount + 1)),
      ...(process.env.NODE_ENV !== "production" ? { debugOtp: code } : {}),
      ...(emailResult.ok ? {} : { warning: emailResult.error }),
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    return Response.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
