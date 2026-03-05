import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";

const ALLOWED_ROLES = ["user", "manager", "admin"];
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
    const decoded = await verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await getDB();

    const adminUser = await db.collection("users").findOne({ userId: decoded.uid });
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
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

    await db.collection("users").updateOne({ userId }, { $set: updatePayload });

    return NextResponse.json({ ok: true, message: "User updated successfully" });
  } catch (err) {
    console.error("USER UPDATE ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
