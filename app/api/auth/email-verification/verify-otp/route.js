import getDB from "@/lib/mongodb";
import { isValidEmail } from "@/lib/security";
import {
  hashEmailVerificationOtp,
  isOtpExpired,
  MAX_OTP_ATTEMPTS,
} from "@/lib/emailVerification";
import { getAppBaseUrl, notifyAdminsNewUserApproval } from "@/lib/emailNotifications";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null);
    const email = String(body?.email || "").trim().toLowerCase();
    const code = String(body?.code || "").replace(/\D/g, "");

    if (!email || !isValidEmail(email)) {
      return Response.json({ ok: false, error: "Valid email is required" }, { status: 400 });
    }

    if (code.length !== 6) {
      return Response.json({ ok: false, error: "Enter the 6-digit verification code." }, { status: 400 });
    }

    const { db } = await getDB();
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return Response.json({ ok: false, error: "Account not found." }, { status: 404 });
    }

    if (user?.emailVerification?.verified === true) {
      return Response.json({
        ok: true,
        verified: true,
        alreadyVerified: true,
        message: "Email already verified. Wait for admin approval before signing in.",
      });
    }

    const verification = user.emailVerification || {};

    if (!verification.codeHash) {
      return Response.json({ ok: false, error: "Request a verification code first." }, { status: 400 });
    }

    if (Number(verification.attempts || 0) >= MAX_OTP_ATTEMPTS) {
      return Response.json(
        { ok: false, error: "Too many wrong attempts. Request a new verification code." },
        { status: 429 }
      );
    }

    if (isOtpExpired(verification.expiresAt)) {
      await db.collection("users").updateOne(
        { userId: user.userId },
        {
          $set: {
            "emailVerification.codeHash": null,
            "emailVerification.expiresAt": null,
            updatedAt: new Date(),
          },
        }
      );

      return Response.json({ ok: false, error: "Verification code expired. Request a new code." }, { status: 400 });
    }

    if (hashEmailVerificationOtp(code) !== verification.codeHash) {
      await db.collection("users").updateOne(
        { userId: user.userId },
        {
          $inc: { "emailVerification.attempts": 1 },
          $set: { updatedAt: new Date() },
        }
      );

      return Response.json({ ok: false, error: "Invalid verification code." }, { status: 400 });
    }

    const now = new Date();
    const shouldNotifyAdmins = !user?.approval?.requestedAt;

    await db.collection("users").updateOne(
      { userId: user.userId },
      {
        $set: {
          "emailVerification.verified": true,
          "emailVerification.verifiedAt": now,
          "emailVerification.codeHash": null,
          "emailVerification.tokenHash": null,
          "emailVerification.expiresAt": null,
          "emailVerification.attempts": 0,
          "approval.requestedAt": user?.approval?.requestedAt || now,
          updatedAt: now,
        },
      }
    );

    if (shouldNotifyAdmins) {
      const baseUrl = getAppBaseUrl(req);
      void notifyAdminsNewUserApproval(db, {
        user: {
          userId: user.userId,
          name: user.name || "User",
          email: user.email,
          authProvider: user.authProvider || "credentials",
          referredBy: user.referredBy || null,
        },
        baseUrl,
      }).catch((err) => console.error("Admin new user notification error:", err));
    }

    return Response.json({
      ok: true,
      verified: true,
      message: "Email verified. Your account is now pending admin approval.",
      approvalRequired: true,
    });
  } catch (error) {
    console.error("Email OTP verification error:", error);
    return Response.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
