import getDB from "@/lib/mongodb";
import { createPasswordResetToken } from "@/lib/passwordReset";
import { isValidEmail } from "@/lib/security";
import { verifyTurnstileToken } from "@/lib/turnstile";

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
      return Response.json({
        ok: true,
        message: "If an account exists for this email, a reset link has been generated.",
      });
    }

    const { tokenHash, expiresAt } = createPasswordResetToken();

    await db.collection("users").updateOne(
      { userId: user.userId },
      {
        $set: {
          passwordResetTokenHash: tokenHash,
          passwordResetExpiresAt: expiresAt,
          updatedAt: new Date(),
        },
      }
    );

    return Response.json({
      ok: true,
      message: "If an account exists for this email, a reset link has been generated.",
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    return Response.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
