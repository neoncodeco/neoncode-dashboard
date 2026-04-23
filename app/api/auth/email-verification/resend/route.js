import getDB from "@/lib/mongodb";
import { isValidEmail } from "@/lib/security";
import {
  buildEmailVerificationUrl,
  createEmailVerificationToken,
  EMAIL_VERIFICATION_MAX_REQUESTS,
} from "@/lib/emailVerification";
import { sendVerificationEmail } from "@/lib/mailer";

const GENERIC_MESSAGE = "If an account exists and is not verified, a verification email has been sent.";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null);
    const email = String(body?.email || "").trim().toLowerCase();
    if (!email || !isValidEmail(email)) {
      return Response.json({ ok: false, error: "Valid email is required" }, { status: 400 });
    }

    const { db } = await getDB();
    const user = await db.collection("users").findOne({ email });

    if (!user || user?.emailVerification?.verified === true) {
      return Response.json({ ok: true, message: GENERIC_MESSAGE });
    }

    const currentCount = Number(user?.emailVerification?.requestedCount || 0);
    if (currentCount >= EMAIL_VERIFICATION_MAX_REQUESTS) {
      return Response.json(
        { ok: false, error: "Maximum verification requests reached (5)." },
        { status: 429 }
      );
    }

    const { token, tokenHash, expiresAt } = createEmailVerificationToken();
    const verificationUrl = buildEmailVerificationUrl(req, token);

    await db.collection("users").updateOne(
      { userId: user.userId },
      {
        $set: {
          "emailVerification.tokenHash": tokenHash,
          "emailVerification.expiresAt": expiresAt,
          "emailVerification.lastRequestedAt": new Date(),
          "emailVerification.maxRequests": EMAIL_VERIFICATION_MAX_REQUESTS,
          updatedAt: new Date(),
        },
        $inc: {
          "emailVerification.requestedCount": 1,
        },
      }
    );

    await sendVerificationEmail({
      to: email,
      name: user?.name || "User",
      verificationUrl,
    });

    return Response.json({
      ok: true,
      message: "Verification email sent.",
      requestsLeft: Math.max(0, EMAIL_VERIFICATION_MAX_REQUESTS - (currentCount + 1)),
      ...(process.env.NODE_ENV !== "production" ? { verificationUrl } : {}),
    });
  } catch (error) {
    console.error("Email verification resend error:", error);
    return Response.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
