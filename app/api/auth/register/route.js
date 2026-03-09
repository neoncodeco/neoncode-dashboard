import getDB from "@/lib/mongodb";
import crypto from "crypto";
import { hashPassword } from "@/lib/password";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password, name, photo, referralCode } = body;

    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedName = String(name || "").trim();

    if (!normalizedEmail || !password) {
      return Response.json({ ok: false, error: "Email and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return Response.json({ ok: false, error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const { db } = await getDB();
    const existingUser = await db.collection("users").findOne({ email: normalizedEmail });

    if (existingUser) {
      return Response.json({ ok: false, error: "Account already exists with this email" }, { status: 409 });
    }

    let referredByUser = null;
    if (referralCode) {
      referredByUser = await db.collection("users").findOne({ referralCode: String(referralCode).trim().toUpperCase() });
      if (!referredByUser) {
        return Response.json({ ok: false, error: "Invalid referral code" }, { status: 400 });
      }
    }

    let myReferralCode;
    let codeExists = true;
    while (codeExists) {
      myReferralCode = crypto.randomBytes(4).toString("hex").toUpperCase();
      codeExists = await db.collection("users").findOne({ referralCode: myReferralCode });
    }

    const userId = crypto.randomUUID();
    const { hash, salt } = hashPassword(password);

    await db.collection("users").insertOne({
      userId,
      role: "user",
      permissions: {
        projectsAccess: false,
        transactionsAccess: false,
        affiliateAccess: false,
        metaAdAccess: false,
      },
      walletBalance: 0,
      topupBalance: 0,
      freepikCredits: 0,
      freepikSubscription: {
        planId: null,
        planName: null,
        status: "inactive",
        purchasedAt: null,
        expiresAt: null,
      },
      referralCode: myReferralCode,
      referredBy: referredByUser ? referredByUser.userId : null,
      referralStats: {
        totalReferIncome: 0,
        totalReferrers: 0,
        totalPayout: 0,
      },
      email: normalizedEmail,
      name: normalizedName || "User",
      photo: photo || "https://i.ibb.co/kgp65LMf/profile-avater.png",
      passwordHash: hash,
      passwordSalt: salt,
      authProvider: "credentials",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    if (referredByUser) {
      await db.collection("users").updateOne(
        { userId: referredByUser.userId },
        { $inc: { "referralStats.totalReferrers": 1 } }
      );
    }

    return Response.json({ ok: true, created: true, userId });
  } catch (e) {
    console.error("Register error:", e);
    return Response.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
