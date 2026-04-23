import getDB from "@/lib/mongodb";
import crypto from "crypto";
import { hashPassword } from "@/lib/password";
import { isValidEmail, sanitizeText } from "@/lib/security";
import {
  buildEmailVerificationUrl,
  createEmailVerificationToken,
  EMAIL_VERIFICATION_MAX_REQUESTS,
} from "@/lib/emailVerification";
import { sendVerificationEmail } from "@/lib/mailer";
import { verifyTurnstileToken } from "@/lib/turnstile";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password, name, photo, referralCode, turnstileToken, deviceFingerprint } = body;

    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedName = sanitizeText(name, 80);
    const normalizedFingerprint = String(deviceFingerprint || "").trim().slice(0, 255);

    if (!normalizedEmail || !password) {
      return Response.json({ ok: false, error: "Email and password are required" }, { status: 400 });
    }

    if (!isValidEmail(normalizedEmail)) {
      return Response.json({ ok: false, error: "Invalid email format" }, { status: 400 });
    }

    if (password.length < 6) {
      return Response.json({ ok: false, error: "Password must be at least 6 characters" }, { status: 400 });
    }

    if (password.length > 128) {
      return Response.json({ ok: false, error: "Password is too long" }, { status: 400 });
    }

    const forwarded = req.headers.get("x-forwarded-for");
    const remoteip = forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "";
    const captchaOk = await verifyTurnstileToken(turnstileToken, { remoteip });
    if (!captchaOk) {
      return Response.json({ ok: false, error: "Captcha verification failed" }, { status: 400 });
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

    const { token, tokenHash, expiresAt } = createEmailVerificationToken();
    const verificationUrl = buildEmailVerificationUrl(req, token);

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
      whatsappNumber: "",
      phoneVerification: {
        verified: false,
        verifiedAt: null,
        status: "unverified",
        requestedAt: null,
        expiresAt: null,
        codeHash: null,
        attempts: 0,
      },
      passwordHash: hash,
      passwordSalt: salt,
      authProvider: "credentials",
      knownDevices: normalizedFingerprint
        ? [
            {
              fingerprint: normalizedFingerprint,
              firstSeenAt: new Date(),
              lastSeenAt: new Date(),
            },
          ]
        : [],
      suspiciousLogin: false,
      suspiciousDeviceFingerprint: null,
      suspiciousLoginAt: null,
      emailVerification: {
        verified: false,
        verifiedAt: null,
        tokenHash,
        expiresAt,
        requestedCount: 1,
        maxRequests: EMAIL_VERIFICATION_MAX_REQUESTS,
        lastRequestedAt: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    if (referredByUser) {
      await db.collection("users").updateOne(
        { userId: referredByUser.userId },
        { $inc: { "referralStats.totalReferrers": 1 } }
      );
    }

    const emailResult = await sendVerificationEmail({
      to: normalizedEmail,
      name: normalizedName || "User",
      verificationUrl,
    });

    return Response.json({
      ok: true,
      created: true,
      userId,
      verificationRequired: true,
      ...(process.env.NODE_ENV !== "production" ? { verificationUrl } : {}),
      ...(emailResult.ok ? {} : { warning: emailResult.error }),
    });
  } catch (e) {
    console.error("Register error:", e);
    return Response.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
