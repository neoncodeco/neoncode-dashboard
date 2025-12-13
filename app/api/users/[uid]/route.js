import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";

export async function GET(req, { params }) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { uid } = await params;

    // 🔐 user can only access own data
    if (decoded.uid !== uid) {
      return Response.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }
 

    const { db } = await getDB();

    // 🔥 IMPORTANT FIX: userId (not uid)
    const user = await db
      .collection("users")
      .findOne({ userId: uid });

    if (!user) {
      return Response.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return Response.json({
      userId: user.userId,
      email: user.email,
      role: user.role,
      walletBalance: user.walletBalance,
      topupBalance: user.topupBalance,
      name: user.name,
      photo: user.photo,
    });

  } catch (error) {
    console.error("GET USER ERROR:", error);
    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
