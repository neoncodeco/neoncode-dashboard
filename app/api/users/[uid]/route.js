import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";
import { getTeamMemberPublicUrl, getTeamMemberQrUrlWithFallback } from "@/lib/teamMemberProfile";
import { findTeamMemberByUserId, getTeamMemberView } from "@/lib/teamMembers";

export async function GET(req, { params }) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { uid } = await params;
    if (decoded.uid !== uid) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { db } = await getDB();
    const user = await db.collection("users").findOne({ userId: uid });
    const teamMemberDoc = await findTeamMemberByUserId(db, uid);
    const teamMemberView = getTeamMemberView(user || {}, teamMemberDoc);

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

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
        teamMemberUsername: teamMemberView.username || user.teamMemberUsername || "",
        teamMemberProfile: teamMemberView.profile,
        teamMemberPublicUrl: getTeamMemberPublicUrl(teamMemberView.username || user.teamMemberUsername),
        teamMemberQrUrl: getTeamMemberQrUrlWithFallback({
          publicId: teamMemberDoc?.publicId,
          username: teamMemberView.username || user.teamMemberUsername,
        }),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt ?? user.createdAt,
      },
    });
  } catch (error) {
    console.error("GET USER ERROR:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
