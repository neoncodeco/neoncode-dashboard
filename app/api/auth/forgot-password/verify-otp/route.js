import getDB from "@/lib/mongodb";
import { isValidEmail } from "@/lib/security";
import {
  createPasswordResetSession,
  hashPasswordResetOtp,
  isOtpExpired,
  MAX_OTP_ATTEMPTS,
} from "@/lib/passwordReset";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null);
    const email = String(body?.email || "").trim().toLowerCase();
    const code = String(body?.code || "").replace(/\D/g, "");

    if (!email || !isValidEmail(email)) {
      return Response.json({ ok: false, error: "Valid email is required" }, { status: 400 });
    }

    if (code.length !== 6) {
      return Response.json({ ok: false, error: "Enter the 6-digit reset code." }, { status: 400 });
    }

    const { db } = await getDB();
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return Response.json({ ok: false, error: "Invalid reset code." }, { status: 400 });
    }

    const resetState = user.passwordReset || {};

    if (!resetState.codeHash) {
      return Response.json({ ok: false, error: "Request a reset code first." }, { status: 400 });
    }

    if (Number(resetState.attempts || 0) >= MAX_OTP_ATTEMPTS) {
      return Response.json(
        { ok: false, error: "Too many wrong attempts. Request a new reset code." },
        { status: 429 }
      );
    }

    if (isOtpExpired(resetState.expiresAt)) {
      await db.collection("users").updateOne(
        { userId: user.userId },
        {
          $set: {
            "passwordReset.codeHash": null,
            "passwordReset.expiresAt": null,
            updatedAt: new Date(),
          },
        }
      );

      return Response.json({ ok: false, error: "Reset code expired. Request a new code." }, { status: 400 });
    }

    if (hashPasswordResetOtp(code) !== resetState.codeHash) {
      await db.collection("users").updateOne(
        { userId: user.userId },
        {
          $inc: { "passwordReset.attempts": 1 },
          $set: { updatedAt: new Date() },
        }
      );

      return Response.json({ ok: false, error: "Invalid reset code." }, { status: 400 });
    }

    const { token, sessionTokenHash, sessionExpiresAt } = createPasswordResetSession();

    await db.collection("users").updateOne(
      { userId: user.userId },
      {
        $set: {
          "passwordReset.codeHash": null,
          "passwordReset.expiresAt": null,
          "passwordReset.attempts": 0,
          "passwordReset.sessionTokenHash": sessionTokenHash,
          "passwordReset.sessionExpiresAt": sessionExpiresAt,
          updatedAt: new Date(),
        },
      }
    );

    return Response.json({
      ok: true,
      verified: true,
      resetToken: token,
      message: "Code verified. You can now set a new password.",
    });
  } catch (error) {
    console.error("Forgot password verify OTP error:", error);
    return Response.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
