import getDB from "@/lib/mongodb";
import crypto from "crypto";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function POST(req) {
  try {
    const body = await req.json();
    const { uid, email, name, photo, referralCode } = body;

    if (!uid) {
      return Response.json(
        { ok: false, error: "UID required" },
        { status: 400 }
      );
    }

    const { db } = await getDB();

    /* ================= CHECK EXISTING USER ================= */
    const existingUser = await db.collection("users").findOne({ userId: uid });

    // 👉 If user already exists, just update basic info
    if (existingUser) {
      await db.collection("users").updateOne(
        { userId: uid },
        {
          $set: {
            email: email || existingUser.email,
            name: name || existingUser.name,
            photo:
              photo ||
              existingUser.photo ||
              "https://i.ibb.co/kgp65LMf/profile-avater.png",
            updatedAt: new Date(),
          },
        }
      );

      // 🔐 Ensure Firebase custom claim exists
      await adminAuth.setCustomUserClaims(uid, {
        role: existingUser.role || "user",
      });

      return Response.json({ ok: true, existing: true });
    }

    /* ================= REFERRAL VALIDATION (NEW USER ONLY) ================= */
    let referredByUser = null;

    if (referralCode) {
      referredByUser = await db.collection("users").findOne({
        referralCode: referralCode.trim().toUpperCase(),
      });

      if (!referredByUser) {
        return Response.json(
          { ok: false, error: "Invalid referral code" },
          { status: 400 }
        );
      }

      if (referredByUser.userId === uid) {
        return Response.json(
          { ok: false, error: "You cannot use your own referral code" },
          { status: 400 }
        );
      }
    }

    /* ================= GENERATE UNIQUE REFERRAL CODE ================= */
    let myReferralCode;
    let exists = true;

    while (exists) {
      myReferralCode = crypto.randomBytes(4).toString("hex").toUpperCase();

      exists = await db
        .collection("users")
        .findOne({ referralCode: myReferralCode });
    }

    /* ================= CREATE NEW USER ================= */
    await db.collection("users").insertOne({
      userId: uid,
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
      referredBy: referredByUser ? referredByUser.userId : null,

      referralStats: {
        totalReferIncome: 0,
        totalReferrers: 0,
        totalPayout: 0,
      },

      email: email || "",
      name: name || "User",
      photo: photo || "https://i.ibb.co/kgp65LMf/profile-avater.png",

      createdAt: new Date(),
      updatedAt: new Date(),
    });

    /* ================= SET FIREBASE CUSTOM CLAIM ================= */
    await adminAuth.setCustomUserClaims(uid, {
      role: "user",
    });

    /* ================= INCREASE REFERRER COUNT ================= */
    if (referredByUser) {
      await db.collection("users").updateOne(
        { userId: referredByUser.userId },
        {
          $inc: {
            "referralStats.totalReferrers": 1,
          },
        }
      );
    }

    return Response.json({ ok: true, created: true });
  } catch (e) {
    console.error("Register error:", e);
    return Response.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
