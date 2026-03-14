import getDB from "@/lib/mongodb";
import { hashPassword } from "@/lib/password";
import { hashPasswordResetToken, isPasswordResetExpired } from "@/lib/passwordReset";

export async function POST(req) {
  try {
    const body = await req.json();
    const token = String(body?.token || "").trim();
    const password = String(body?.password || "");

    if (!token || !password) {
      return Response.json({ ok: false, error: "Token and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return Response.json({ ok: false, error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const tokenHash = hashPasswordResetToken(token);
    const { db } = await getDB();
    const user = await db.collection("users").findOne({ passwordResetTokenHash: tokenHash });

    if (!user || isPasswordResetExpired(user.passwordResetExpiresAt)) {
      return Response.json({ ok: false, error: "This reset link is invalid or expired" }, { status: 400 });
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
        },
      }
    );

    return Response.json({ ok: true, message: "Password reset successful" });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    return Response.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
