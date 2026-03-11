import { auth } from "@/lib/auth";
import { getToken } from "next-auth/jwt";

export async function verifyToken(req) {
  try {
    const session = await auth();
    if (session?.user?.uid) {
      return {
        uid: session.user.uid,
        email: session.user.email,
        role: session.user.role || "user",
      };
    }

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.uid) return null;

    return {
      uid: token.uid,
      email: token.email,
      role: token.role || "user",
    };
  } catch {
    return null;
  }
}
