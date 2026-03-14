import getDB from "@/lib/mongodb";
import { createPasswordResetToken } from "@/lib/passwordReset";

function getBaseUrl(req) {
  const envUrl = process.env.NEXTAUTH_URL?.trim();
  if (envUrl) return envUrl;

  try {
    return new URL(req.url).origin;
  } catch {
    return "http://localhost:3000";
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const email = String(body?.email || "").trim().toLowerCase();

    if (!email) {
      return Response.json({ ok: false, error: "Email is required" }, { status: 400 });
    }

    const { db } = await getDB();
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return Response.json({
        ok: true,
        message: "If an account exists for this email, a reset link has been generated.",
      });
    }

    const { token, tokenHash, expiresAt } = createPasswordResetToken();

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

    const baseUrl = getBaseUrl(req);
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    return Response.json({
      ok: true,
      message: "Reset link generated successfully.",
      resetUrl,
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    return Response.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
