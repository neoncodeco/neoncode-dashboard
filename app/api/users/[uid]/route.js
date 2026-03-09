import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";

export async function GET(req, { params }) {
  try {
    // 🔐 Verify token
    const decoded = await verifyToken(req);
    if (!decoded) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // ✅ params sync destructure (no await)
    const { uid } = await params;

    // 🔒 user can only access own data
    if (decoded.uid !== uid) {
      return Response.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const { db } = await getDB();

    // 🔥 IMPORTANT: userId is used in DB
    const user = await db
      .collection("users")
      .findOne({ userId: uid });

    if (!user) {
      return Response.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // ✅ SEND FULL REQUIRED USER DATA
    return Response.json({
      ok: true,
      data: {
        userId: user.userId,
        email: user.email,
        status: user.status ?? "active",
        role: user.role,
        permissions: user.permissions,
        walletBalance: user.walletBalance ?? 0,
        topupBalance: user.topupBalance ?? 0,
        freepikCredits: user.freepikCredits ?? 0,
        freepikSubscription: user.freepikSubscription ?? {
          planId: null,
          planName: null,
          status: "inactive",
          purchasedAt: null,
          expiresAt: null,
        },

        referralCode: user.referralCode ?? null,
        referredBy: user.referredBy ?? null,

        referralStats: {
          totalReferIncome: user.referralStats?.totalReferIncome ?? 0,
          totalReferrers: user.referralStats?.totalReferrers ?? 0,
          totalPayout: user.referralStats?.totalPayout ?? 0,
        },
        level1DepositCount: user.level1DepositCount ?? 0,

        name: user.name,
        photo: user.photo,
        coverPhoto: user.coverPhoto ?? "",
        payoutMethods: user.payoutMethods ?? {},
        metaAdsConfig: {
          usdRate: user.metaAdsConfig?.usdRate ?? 150,
          allowBudgetIncrease: user.metaAdsConfig?.allowBudgetIncrease ?? true,
          allowTopupAction: user.metaAdsConfig?.allowTopupAction ?? true,
          remainingBudgetOverride: user.metaAdsConfig?.remainingBudgetOverride ?? null,
        },

        createdAt: user.createdAt,
        updatedAt: user.updatedAt ?? user.createdAt,
      },
    });

  } catch (error) {
    console.error("GET USER ERROR:", error);
    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
