import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import getDB from "@/lib/mongodb";
import { parseJsonBody, requireAuth, requireRoles } from "@/lib/apiGuard";
import { convertBdtToUsd, DEFAULT_USD_TO_BDT_RATE, resolveUsdToBdtRate } from "@/lib/currency";
import { serializeMongoId } from "@/lib/serializeMongoId";
import { isSafeHttpUrl, sanitizeText } from "@/lib/security";

const ALLOWED_STATUSES = ["pending", "approved", "rejected"];
const ALLOWED_METHODS = ["bank_transfer", "uddoktapay", "online", "manual"];

function normalizeStatus(value, fallback = "pending") {
  const next = String(value || fallback).trim().toLowerCase();
  return ALLOWED_STATUSES.includes(next) ? next : fallback;
}

function normalizeMethod(value, fallback = "bank_transfer") {
  const next = String(value || fallback).trim().toLowerCase();
  return ALLOWED_METHODS.includes(next) ? next : fallback;
}

function roundUsd(value) {
  return Math.round(Number(value) * 10000) / 10000;
}

function normalizeCreatedAtMs(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setSeconds(0, 0);
  return d.getTime();
}

function paymentSnapshot(payment) {
  return {
    amountBdt: Math.round(Number(payment.amountBdt ?? payment.amount ?? 0)),
    creditedUsdAmount: roundUsd(payment.creditedUsdAmount || 0),
    usdToBdtRate: Number(payment.usdToBdtRate || 0),
    method: normalizeMethod(payment.method),
    status: normalizeStatus(payment.status),
    trxId: sanitizeText(payment.trxId || payment.trx_id || ""),
    screenshotUrl: String(payment.screenshotUrl || payment.screenshot || "").trim(),
    createdAtMs: normalizeCreatedAtMs(payment.createdAt),
  };
}

async function resolveCreditedUsd(db, amountBdt, usdToBdtRate, explicitUsd) {
  const explicit = Number(explicitUsd);
  if (Number.isFinite(explicit) && explicit > 0) {
    return roundUsd(explicit);
  }

  const rateSetting = await db.collection("settings").findOne({ key: "USD_TO_BDT_RATE" });
  const rate = resolveUsdToBdtRate(usdToBdtRate, resolveUsdToBdtRate(rateSetting?.value, DEFAULT_USD_TO_BDT_RATE));
  return roundUsd(convertBdtToUsd(amountBdt, rate));
}

function buildChanges(before, after) {
  const fields = [
    "amountBdt",
    "creditedUsdAmount",
    "usdToBdtRate",
    "method",
    "status",
    "trxId",
    "screenshotUrl",
    "createdAtMs",
  ];

  return fields
    .filter((field) => {
      const left = before[field];
      const right = after[field];
      if (field === "createdAtMs") return left !== right;
      if (typeof left === "number" && typeof right === "number") {
        return Math.abs(left - right) > 0.0001;
      }
      return String(left ?? "") !== String(right ?? "");
    })
    .map((field) => ({
      field: field === "createdAtMs" ? "createdAt" : field,
      from: field === "createdAtMs" && before.createdAtMs ? new Date(before.createdAtMs).toISOString() : before[field],
      to: field === "createdAtMs" && after.createdAtMs ? new Date(after.createdAtMs).toISOString() : after[field],
    }));
}

function computeWalletDelta(oldStatus, newStatus, oldCredit, newCredit) {
  const wasApproved = oldStatus === "approved";
  const willApprove = newStatus === "approved";

  if (wasApproved && willApprove) return newCredit - oldCredit;
  if (wasApproved && !willApprove) return -oldCredit;
  if (!wasApproved && willApprove) return newCredit;
  return 0;
}

export async function POST(req) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.response;

    const { db } = await getDB();
    const access = await requireRoles(db, auth.decoded.uid, ["admin", "manager"]);
    if (!access.ok) return access.response;

    const body = await parseJsonBody(req);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
    }

    const paymentId = serializeMongoId(body.paymentId ?? body.id ?? body._id);
    if (!paymentId || !ObjectId.isValid(paymentId)) {
      return NextResponse.json({ ok: false, error: "Valid payment ID is required" }, { status: 400 });
    }

    const payment = await db.collection("payments").findOne({ _id: new ObjectId(paymentId) });
    if (!payment) {
      return NextResponse.json({ ok: false, error: "Payment not found" }, { status: 404 });
    }

    const before = paymentSnapshot(payment);
    const amountBdt = Math.round(Number(body.amountBdt ?? before.amountBdt));
    const usdToBdtRate = resolveUsdToBdtRate(body.usdToBdtRate, before.usdToBdtRate || DEFAULT_USD_TO_BDT_RATE);

    if (!Number.isFinite(amountBdt) || amountBdt <= 0) {
      return NextResponse.json({ ok: false, error: "Amount must be greater than zero" }, { status: 400 });
    }

    const creditedUsdAmount = await resolveCreditedUsd(db, amountBdt, usdToBdtRate, body.creditedUsdAmount);
    if (!Number.isFinite(creditedUsdAmount) || creditedUsdAmount <= 0) {
      return NextResponse.json({ ok: false, error: "Credited USD amount is invalid" }, { status: 400 });
    }

    const method = normalizeMethod(body.method, before.method);
    const status = normalizeStatus(body.status, before.status);
    const trxId = sanitizeText(body.trxId ?? body.trx_id ?? before.trxId, 120);
    const screenshotUrl = String(body.screenshotUrl ?? before.screenshotUrl ?? "").trim();

    if (screenshotUrl && !isSafeHttpUrl(screenshotUrl)) {
      return NextResponse.json({ ok: false, error: "Screenshot URL must be a valid http(s) URL" }, { status: 400 });
    }

    let createdAt = before.createdAtMs ? new Date(before.createdAtMs) : new Date();
    if (body.createdAt) {
      const parsed = new Date(body.createdAt);
      if (!Number.isNaN(parsed.getTime())) createdAt = parsed;
    }

    const afterSnapshot = paymentSnapshot({
      amountBdt,
      creditedUsdAmount,
      usdToBdtRate,
      method,
      status,
      trxId,
      screenshotUrl,
      createdAt,
    });

    const changes = buildChanges(before, afterSnapshot);

    if (changes.length === 0) {
      return NextResponse.json({ ok: true, message: "No changes were needed.", payment: { id: paymentId, ...afterSnapshot } });
    }

    const user = await db.collection("users").findOne({ userId: payment.userUid });
    if (!user) {
      return NextResponse.json({ ok: false, error: "Linked user not found" }, { status: 404 });
    }

    const oldCredit = before.creditedUsdAmount > 0
      ? before.creditedUsdAmount
      : convertBdtToUsd(before.amountBdt, before.usdToBdtRate || DEFAULT_USD_TO_BDT_RATE);

    const walletDelta = computeWalletDelta(before.status, status, oldCredit, creditedUsdAmount);
    const nextWallet = Number(user.walletBalance || 0) + walletDelta;
    const nextTopup = Number(user.topupBalance || 0) + walletDelta;

    if (walletDelta < 0 && (nextWallet < 0 || nextTopup < 0)) {
      return NextResponse.json(
        { ok: false, error: "Cannot apply this edit because user balance would go negative." },
        { status: 400 }
      );
    }

    const now = new Date();
    const adminUser = access.user;
    const historyEntry = {
      adminUid: auth.decoded.uid,
      adminName: adminUser?.name || "Admin",
      adminEmail: adminUser?.email || "",
      before,
      after: {
        amountBdt,
        creditedUsdAmount,
        usdToBdtRate,
        method,
        status,
        trxId,
        screenshotUrl,
        createdAt,
      },
      changes,
      walletDelta,
      createdAt: now,
    };

    const after = {
      amountBdt,
      amount: amountBdt,
      creditedUsdAmount,
      usdToBdtRate,
      currency: "BDT",
      method,
      status,
      trxId,
      trx_id: trxId,
      screenshotUrl,
      createdAt,
    };

    if (walletDelta !== 0) {
      await db.collection("users").updateOne(
        { userId: payment.userUid },
        {
          $set: {
            walletBalance: nextWallet,
            topupBalance: nextTopup,
            updatedAt: now,
          },
        }
      );
    }

    await db.collection("payments").updateOne(
      { _id: payment._id },
      {
        $set: {
          ...after,
          updatedAt: now,
          lastAdminEditAt: now,
          lastAdminEditBy: auth.decoded.uid,
        },
        $push: {
          adminEditHistory: {
            $each: [historyEntry],
            $slice: -50,
          },
        },
      }
    );

    await db.collection("payment_admin_edit_logs").insertOne({
      paymentId,
      userUid: payment.userUid,
      ...historyEntry,
    });

    return NextResponse.json({
      ok: true,
      message: "Payment updated successfully. Balances and records were synced.",
      payment: {
        id: paymentId,
        ...after,
        walletDelta,
        nextWalletBalance: walletDelta !== 0 ? nextWallet : Number(user.walletBalance || 0),
        nextTopupBalance: walletDelta !== 0 ? nextTopup : Number(user.topupBalance || 0),
      },
      editHistory: historyEntry,
    });
  } catch (error) {
    console.error("ADMIN PAYMENT EDIT ERROR:", error);
    return NextResponse.json({ ok: false, error: "Internal Server Error" }, { status: 500 });
  }
}
