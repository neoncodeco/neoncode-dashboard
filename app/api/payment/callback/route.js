import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";

const VERIFIED_SUCCESS_STATUS = "COMPLETED";
const getGatewayApiKey = () => {
  return (
    process.env.UDDOKTAPAY_API_KEY?.trim() ||
    process.env.PAYMENTLY_API_KEY?.trim() ||
    ""
  );
};

const getVerifyUrl = () => {
  const baseUrl = process.env.UDDOKTAPAY_BASE_URL?.trim() || "";
  if (!baseUrl) return "";

  try {
    const url = new URL(baseUrl);
    url.pathname = "/api/verify-payment";
    url.search = "";
    return url.toString();
  } catch {
    return "";
  }
};

const getTrxIdFromBody = (body) => {
  return (
    body?.trx_id ||
    body?.transaction_id ||
    body?.invoice_id ||
    body?.metadata?.invoice_id ||
    body?.metadata?.trx_id ||
    null
  );
};

const parseCallbackBody = async (req) => {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await req.json();
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const form = await req.formData();
    return Object.fromEntries(form.entries());
  }

  try {
    return await req.json();
  } catch {
    return {};
  }
};

const verifyPayment = async (trxId) => {
  const apiKey = getGatewayApiKey();
  const verifyUrl = getVerifyUrl();
  if (!apiKey) {
    return { ok: false, verifyData: { error: "Missing UddoktaPay API key" } };
  }
  if (!verifyUrl) {
    return { ok: false, verifyData: { error: "Missing UddoktaPay verify URL" } };
  }

  const verifyRes = await fetch(verifyUrl, {
    method: "POST",
    headers: {
      "RT-UDDOKTAPAY-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ transaction_id: trxId }),
  });

  let verifyData = null;
  try {
    verifyData = await verifyRes.json();
  } catch {
    verifyData = null;
  }

  return {
    ok:
      verifyData?.success === true &&
      verifyData?.payment?.status === VERIFIED_SUCCESS_STATUS,
    verifyData,
  };
};

const processPayment = async ({ trxId, callbackData = null }) => {
  const { db } = await getDB();

  const paymentDoc = await db.collection("payments").findOne({ trx_id: trxId });
  if (!paymentDoc) {
    return { ok: false, status: 404, error: "Record not found" };
  }

  if (paymentDoc.status === "approved") {
    return { ok: true, status: "approved", alreadyProcessed: true };
  }

  const { ok: paid, verifyData } = await verifyPayment(trxId);

  if (!paid) {
    await db.collection("payments").updateOne(
      { trx_id: trxId, status: { $ne: "approved" } },
      {
        $set: {
          status: "failed",
          verifyResponse: verifyData,
          callbackData,
          updatedAt: new Date(),
        },
      }
    );

    return { ok: true, status: "failed" };
  }

  const approveResult = await db.collection("payments").updateOne(
    { trx_id: trxId, status: { $ne: "approved" } },
    {
      $set: {
        status: "approved",
        verifyResponse: verifyData,
        callbackData,
        updatedAt: new Date(),
      },
    }
  );

  if (approveResult.modifiedCount > 0) {
    const amount = Number(paymentDoc.amount) || 0;
    if (amount > 0 && paymentDoc.userUid) {
      await db.collection("users").updateOne(
        { userId: paymentDoc.userUid },
        { $inc: { walletBalance: amount, topupBalance: amount } }
      );
    }
  }

  return { ok: true, status: "approved" };
};

export async function POST(req) {
  try {
    const body = await parseCallbackBody(req);
    const trxId = getTrxIdFromBody(body);

    if (!trxId) {
      return NextResponse.json({ ok: false, error: "trx_id missing in callback" }, { status: 400 });
    }

    const result = await processPayment({ trxId, callbackData: body });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: result.status || 500 });
    }

    return NextResponse.json({ ok: true, status: result.status });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  const origin = new URL(req.url).origin;
  const successUrl = new URL("/user-dashboard/payment-methods?payment=success", origin);
  const failedUrl = new URL("/user-dashboard/payment-methods?payment=failed", origin);

  try {
    const { searchParams } = new URL(req.url);
    const trxId =
      searchParams.get("invoice_id") ||
      searchParams.get("trx_id") ||
      searchParams.get("transaction_id");

    if (!trxId) {
      return NextResponse.redirect(failedUrl, 303);
    }

    const result = await processPayment({ trxId });
    return NextResponse.redirect(result.status === "approved" ? successUrl : failedUrl, 303);
  } catch {
    return NextResponse.redirect(failedUrl, 303);
  }
}
