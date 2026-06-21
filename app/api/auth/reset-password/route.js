import getDB from "@/lib/mongodb";
import { hashPassword } from "@/lib/password";
import {
  hashPasswordResetToken,
  isPasswordResetExpired,
} from "@/lib/passwordReset";
import { isValidEmail } from "@/lib/security";

export async function POST(req) {
  try {
    const body = await req.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const resetToken = String(body?.resetToken || body?.token || "").trim();
    const password = String(body?.password || "");

    if (!resetToken || !password) {
      return Response.json({ ok: false, error: "Reset token and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return Response.json({ ok: false, error: "Password must be at least 6 characters" }, { status: 400 });
    }

    if (password.length > 128) {
      return Response.json({ ok: false, error: "Password is too long" }, { status: 400 });
    }

    const tokenHash = hashPasswordResetToken(resetToken);
    const { db } = await getDB();

    let user = null;

    if (email && isValidEmail(email)) {
      user = await db.collection("users").findOne({ email });
      const resetState = user?.passwordReset || {};
      if (
        !user ||
        !resetState.sessionTokenHash ||
        resetState.sessionTokenHash !== tokenHash ||
        isPasswordResetExpired(resetState.sessionExpiresAt)
      ) {
        return Response.json({ ok: false, error: "Reset session is invalid or expired" }, { status: 400 });
      }
    } else {
      user = await db.collection("users").findOne({ passwordResetTokenHash: tokenHash });
      if (!user || isPasswordResetExpired(user.passwordResetExpiresAt)) {
        return Response.json({ ok: false, error: "This reset link is invalid or expired" }, { status: 400 });
      }
    }

    const { hash, salt } = hashPassword(password);

    await db.collection("users").updateOne(
      { userId: user.userId },
      {
        $set: {
          passwordHash: hash,
          passwordSalt: salt,
          authProvider: user.authProvider || "credentials",
          updatedAt: new Date(),
        },
        $unset: {
          passwordResetTokenHash: "",
          passwordResetExpiresAt: "",
          passwordReset: "",
        },
      }
    );

    return Response.json({ ok: true, message: "Password reset successful" });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    return Response.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
