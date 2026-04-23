import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import crypto from "crypto";
import getDB from "@/lib/mongodb";
import { verifyPassword } from "@/lib/password";
import { verifyTurnstileToken } from "@/lib/turnstile";

const LOGIN_LOCK_MAX_ATTEMPTS = 5;
const LOGIN_LOCK_DURATION_MS = 15 * 60 * 1000;

function normalizeDeviceFingerprint(value) {
  return String(value || "").trim().slice(0, 255);
}

function buildKnownDevicesAfterLogin({ knownDevices, fingerprint }) {
  const now = new Date();
  const existing = Array.isArray(knownDevices) ? knownDevices : [];
  const fp = normalizeDeviceFingerprint(fingerprint);

  if (!fp) {
    return {
      nextDevices: existing,
      suspiciousLogin: true,
      suspiciousDeviceFingerprint: null,
      suspiciousLoginAt: now,
    };
  }

  const idx = existing.findIndex((d) => d?.fingerprint === fp);
  if (idx >= 0) {
    const nextDevices = existing.map((d, i) =>
      i === idx ? { ...d, fingerprint: fp, lastSeenAt: now } : d
    );
    return {
      nextDevices,
      suspiciousLogin: false,
      suspiciousDeviceFingerprint: null,
      suspiciousLoginAt: null,
    };
  }

  return {
    nextDevices: [...existing, { fingerprint: fp, firstSeenAt: now, lastSeenAt: now }],
    suspiciousLogin: true,
    suspiciousDeviceFingerprint: fp,
    suspiciousLoginAt: now,
  };
}

async function upsertOAuthUser({ email, name, image }) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const { db } = await getDB();

  const existing = await db.collection("users").findOne({ email: normalizedEmail });

  if (existing) {
    await db.collection("users").updateOne(
      { userId: existing.userId },
      {
        $set: {
          email: normalizedEmail,
          name: name || existing.name || "User",
          photo: image || existing.photo || "https://i.ibb.co/kgp65LMf/profile-avater.png",
          emailVerification: {
            verified: true,
            verifiedAt: existing?.emailVerification?.verifiedAt || new Date(),
            tokenHash: null,
            expiresAt: null,
            requestedCount: existing?.emailVerification?.requestedCount || 0,
            maxRequests: existing?.emailVerification?.maxRequests || 5,
            lastRequestedAt: existing?.emailVerification?.lastRequestedAt || null,
          },
          updatedAt: new Date(),
        },
      }
    );

    return {
      uid: existing.userId,
      email: normalizedEmail,
      name: name || existing.name || "User",
      image: image || existing.photo || null,
      role: existing.role || "user",
    };
  }

  let myReferralCode;
  let exists = true;

  while (exists) {
    myReferralCode = crypto.randomBytes(4).toString("hex").toUpperCase();
    exists = await db.collection("users").findOne({ referralCode: myReferralCode });
  }

  const userId = crypto.randomUUID();

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
    referralCode: myReferralCode,
    referredBy: null,
    referralStats: {
      totalReferIncome: 0,
      totalReferrers: 0,
      totalPayout: 0,
    },
    email: normalizedEmail,
    name: name || "User",
    photo: image || "https://i.ibb.co/kgp65LMf/profile-avater.png",
    emailVerification: {
      verified: true,
      verifiedAt: new Date(),
      tokenHash: null,
      expiresAt: null,
      requestedCount: 0,
      maxRequests: 5,
      lastRequestedAt: null,
    },
    knownDevices: [],
    suspiciousLogin: false,
    suspiciousDeviceFingerprint: null,
    suspiciousLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return {
    uid: userId,
    email: normalizedEmail,
    name: name || "User",
    image: image || null,
    role: "user",
  };
}

export const authConfig = {
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        turnstileToken: { label: "Turnstile", type: "text" },
        deviceFingerprint: { label: "Device fingerprint", type: "text" },
      },
      async authorize(credentials, request) {
        const email = String(credentials?.email || "").trim().toLowerCase();
        const password = String(credentials?.password || "");
        const turnstileToken = String(credentials?.turnstileToken || "");
        const deviceFingerprint = String(credentials?.deviceFingerprint || "");
        if (!email || !password) return null;

        const forwarded = request?.headers?.get("x-forwarded-for");
        const remoteip = forwarded?.split(",")[0]?.trim() || request?.headers?.get("x-real-ip") || "";

        const captchaOk = await verifyTurnstileToken(turnstileToken, { remoteip });
        if (!captchaOk) return null;

        const { db } = await getDB();
        const user = await db.collection("users").findOne({ email });
        if (!user || !user.passwordHash || !user.passwordSalt) return null;
        if (user?.emailVerification?.verified === false) return null;

        const now = Date.now();
        const lockUntil = user?.authSecurity?.loginLockUntil
          ? new Date(user.authSecurity.loginLockUntil).getTime()
          : 0;
        if (lockUntil && lockUntil > now) return null;

        const valid = verifyPassword(password, user.passwordHash, user.passwordSalt);
        if (!valid) {
          const currentFailed = Number(user?.authSecurity?.failedLoginAttempts || 0);
          const nextFailed = currentFailed + 1;
          const lockTriggered = nextFailed >= LOGIN_LOCK_MAX_ATTEMPTS;

          await db.collection("users").updateOne(
            { userId: user.userId },
            {
              $set: {
                updatedAt: new Date(),
                "authSecurity.failedLoginAttempts": lockTriggered ? 0 : nextFailed,
                "authSecurity.lastFailedLoginAt": new Date(),
                "authSecurity.loginLockUntil": lockTriggered
                  ? new Date(now + LOGIN_LOCK_DURATION_MS)
                  : null,
              },
            }
          );
          return null;
        }

        const deviceState = buildKnownDevicesAfterLogin({
          knownDevices: user.knownDevices,
          fingerprint: deviceFingerprint,
        });

        await db.collection("users").updateOne(
          { userId: user.userId },
          {
            $set: {
              updatedAt: new Date(),
              "authSecurity.failedLoginAttempts": 0,
              "authSecurity.loginLockUntil": null,
              "authSecurity.lastLoginAt": new Date(),
              knownDevices: deviceState.nextDevices,
              suspiciousLogin: deviceState.suspiciousLogin,
              suspiciousDeviceFingerprint: deviceState.suspiciousDeviceFingerprint,
              suspiciousLoginAt: deviceState.suspiciousLoginAt,
            },
          }
        );

        return {
          id: user.userId,
          uid: user.userId,
          email: user.email,
          name: user.name || "User",
          image: user.photo || null,
          role: user.role || "user",
        };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user?.email) return false;
        const dbUser = await upsertOAuthUser({ email: user.email, name: user.name, image: user.image });
        user.uid = dbUser.uid;
        user.role = dbUser.role;
        user.email = dbUser.email;
        user.name = dbUser.name;
        user.image = dbUser.image;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.uid || user.id;
        token.role = user.role || "user";
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (!session.user) session.user = {};
      session.user.uid = token.uid;
      session.user.role = token.role;
      session.user.email = token.email;
      session.user.name = token.name;
      session.user.image = token.picture;
      session.accessToken = "session-auth";
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
