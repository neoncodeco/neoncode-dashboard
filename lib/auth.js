import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import crypto from "crypto";
import getDB from "@/lib/mongodb";
import { verifyPassword } from "@/lib/password";

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
      },
      async authorize(credentials) {
        const email = String(credentials?.email || "").trim().toLowerCase();
        const password = String(credentials?.password || "");
        if (!email || !password) return null;

        const { db } = await getDB();
        const user = await db.collection("users").findOne({ email });
        if (!user || !user.passwordHash || !user.passwordSalt) return null;

        const valid = verifyPassword(password, user.passwordHash, user.passwordSalt);
        if (!valid) return null;

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
