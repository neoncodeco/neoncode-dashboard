import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { parseJsonBody, requireAuth, requireRoles } from "@/lib/apiGuard";
import {
  normalizeTeamMemberUsername,
} from "@/lib/teamMemberProfile";
import {
  deleteTeamMemberDoc,
  findTeamMemberByUserId,
  findTeamMemberByUsername,
  upsertTeamMemberDoc,
} from "@/lib/teamMembers";

const ALLOWED_ROLES = ["user", "manager", "admin", "team_member"];
const ALLOWED_STATUS = ["active", "pending", "inactive"];

const toSafeNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const sanitizePermissions = (permissions) => {
  if (!permissions || typeof permissions !== "object") return null;
  return {
    projectsAccess: Boolean(permissions.projectsAccess),
    transactionsAccess: Boolean(permissions.transactionsAccess),
    affiliateAccess: Boolean(permissions.affiliateAccess),
    metaAdAccess: Boolean(permissions.metaAdAccess),
  };
};

const sanitizeMetaAdsConfig = (metaAdsConfig, fallback) => {
  const base = fallback && typeof fallback === "object" ? fallback : {};
  if (!metaAdsConfig || typeof metaAdsConfig !== "object") {
    return {
      usdRate: toSafeNumber(base.usdRate, 150),
      allowBudgetIncrease: base.allowBudgetIncrease !== false,
      allowTopupAction: base.allowTopupAction !== false,
      remainingBudgetOverride:
        base.remainingBudgetOverride === null ||
        base.remainingBudgetOverride === undefined
          ? null
          : toSafeNumber(base.remainingBudgetOverride, 0),
    };
  }

  const incomingRemaining = metaAdsConfig.remainingBudgetOverride;
  const normalizedRemaining =
    incomingRemaining === "" ||
    incomingRemaining === null ||
    incomingRemaining === undefined
      ? null
      : toSafeNumber(incomingRemaining, 0);

  return {
    usdRate: toSafeNumber(metaAdsConfig.usdRate, toSafeNumber(base.usdRate, 150)),
    allowBudgetIncrease:
      metaAdsConfig.allowBudgetIncrease === undefined
        ? base.allowBudgetIncrease !== false
        : Boolean(metaAdsConfig.allowBudgetIncrease),
    allowTopupAction:
      metaAdsConfig.allowTopupAction === undefined
        ? base.allowTopupAction !== false
        : Boolean(metaAdsConfig.allowTopupAction),
    remainingBudgetOverride: normalizedRemaining,
  };
};

export async function POST(req) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) {
      return auth.response;
    }

    const { db } = await getDB();
    const access = await requireRoles(db, auth.decoded.uid, ["admin"]);
    if (!access.ok) {
      return access.response;
    }

    const body = await parseJsonBody(req);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
    }
    const {
      userId,
      role,
      status,
      permissions,
      name,
      email,
      photo,
      coverPhoto,
      walletBalance,
      topupBalance,
      referralStats,
      payoutMethods,
      metaAdsConfig,
      level1DepositCount,
      teamMemberUsername,
      teamMemberProfile,
    } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const target = await db.collection("users").findOne({ userId });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updatePayload = { updatedAt: new Date() };

    if (typeof role === "string") {
      if (!ALLOWED_ROLES.includes(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      updatePayload.role = role;
    }

    if (typeof status === "string") {
      if (!ALLOWED_STATUS.includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updatePayload.status = status;
    }

    if (typeof name === "string") updatePayload.name = name.trim();
    if (typeof email === "string") updatePayload.email = email.trim().toLowerCase();
    if (typeof photo === "string") updatePayload.photo = photo.trim();
    if (typeof coverPhoto === "string") updatePayload.coverPhoto = coverPhoto.trim();

    if (walletBalance !== undefined) {
      updatePayload.walletBalance = toSafeNumber(walletBalance, target.walletBalance || 0);
    }
    if (topupBalance !== undefined) {
      updatePayload.topupBalance = toSafeNumber(topupBalance, target.topupBalance || 0);
    }

    if (referralStats && typeof referralStats === "object") {
      updatePayload.referralStats = {
        totalReferrers: toSafeNumber(referralStats.totalReferrers, target.referralStats?.totalReferrers || 0),
        totalReferIncome: toSafeNumber(referralStats.totalReferIncome, target.referralStats?.totalReferIncome || 0),
        totalPayout: toSafeNumber(referralStats.totalPayout, target.referralStats?.totalPayout || 0),
      };
    }

    const normalizedPermissions = sanitizePermissions(permissions);
    if (normalizedPermissions) {
      updatePayload.permissions = normalizedPermissions;
    }

    if (payoutMethods && typeof payoutMethods === "object") {
      updatePayload.payoutMethods = payoutMethods;
    }

    if (metaAdsConfig && typeof metaAdsConfig === "object") {
      updatePayload.metaAdsConfig = sanitizeMetaAdsConfig(
        metaAdsConfig,
        target.metaAdsConfig
      );
    }

    if (level1DepositCount !== undefined) {
      updatePayload.level1DepositCount = toSafeNumber(
        level1DepositCount,
        target.level1DepositCount || 0
      );
    }

    let normalizedTeamMemberUsername = normalizeTeamMemberUsername(
      teamMemberUsername !== undefined ? teamMemberUsername : target.teamMemberUsername
    );

    if (teamMemberUsername !== undefined) {
      const normalizedUsername = normalizedTeamMemberUsername;

      if (normalizedUsername) {
        if (normalizedUsername.length < 3) {
          return NextResponse.json({ error: "Team member username must be at least 3 characters" }, { status: 400 });
        }

        const usernameOwner = await findTeamMemberByUsername(db, normalizedUsername);

        if (usernameOwner && usernameOwner.userId !== userId) {
          return NextResponse.json({ error: "That team member username is already taken" }, { status: 409 });
        }
      }

      updatePayload.teamMemberUsername = normalizedUsername;
    }

    const nextRole = updatePayload.role || target.role;

    await db.collection("users").updateOne(
      { userId },
      {
        $set: updatePayload,
        ...(nextRole === "team_member"
          ? {}
          : {
              $unset: {
                teamMemberProfile: "",
              },
            }),
      }
    );

    const refreshedUser = await db.collection("users").findOne({ userId });

    if (nextRole === "team_member") {
      const existingTeamMemberDoc = await findTeamMemberByUserId(db, userId);
      const fallbackProfile = teamMemberProfile !== undefined ? teamMemberProfile : existingTeamMemberDoc?.profile;
      const finalUsername =
        normalizedTeamMemberUsername ||
        existingTeamMemberDoc?.username ||
        refreshedUser?.teamMemberUsername ||
        "";

      if (finalUsername || teamMemberProfile !== undefined || existingTeamMemberDoc) {
        const savedTeamMemberDoc = await upsertTeamMemberDoc(
          db,
          refreshedUser,
          finalUsername,
          fallbackProfile
        );

        await db.collection("users").updateOne(
          { userId },
          {
            $set: {
              teamMemberUsername: savedTeamMemberDoc.username,
              updatedAt: new Date(),
            },
            $unset: {
              teamMemberProfile: "",
            },
          }
        );
      }
    } else {
      await deleteTeamMemberDoc(db, userId);
      await db.collection("users").updateOne(
        { userId },
        {
          $set: { teamMemberUsername: "" },
          $unset: { teamMemberProfile: "" },
        }
      );
    }

    return NextResponse.json({ ok: true, message: "User updated successfully" });
  } catch (err) {
    console.error("USER UPDATE ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
