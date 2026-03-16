import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";
import crypto from "crypto";
import { convertBdtToUsd, DEFAULT_USD_TO_BDT_RATE, resolveUsdToBdtRate } from "@/lib/currency";

const withInvoiceId = (url, trackingId) => {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}invoice_id=${trackingId}`;
};

const getGatewayApiKey = () => {
  return (
    process.env.UDDOKTAPAY_API_KEY?.trim() ||
    process.env.PAYMENTLY_API_KEY?.trim() ||
    ""
  );
};

const getGatewayBaseUrl = () => {
  return (
    process.env.UDDOKTAPAY_BASE_URL?.trim() ||
    process.env.PAYMENTLY_BASE_URL?.trim() ||
    ""
  );
};

const getPublicBaseUrl = (req) => {
  const explicitBase =
    process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
    process.env.APP_BASE_URL?.trim() ||
    process.env.UDDOKTAPAY_REDIRECT?.trim() ||
    "";

  if (explicitBase) {
    try {
      return new URL(explicitBase).origin;
    } catch {
      return explicitBase.replace(/\/+$/, "");
    }
  }

  return new URL(req.url).origin;
};

const getConfigIssues = ({ apiKey, gatewayBaseUrl, webhookUrl, publicBaseUrl }) => {
  const issues = [];

  if (!apiKey) issues.push("Missing automatic payment API key.");
  if (!gatewayBaseUrl) issues.push("Missing automatic payment gateway URL.");
  if (!publicBaseUrl) issues.push("Missing public app base URL.");
  if (webhookUrl?.includes("localhost")) {
    issues.push("Webhook URL is using localhost, which external gateways cannot reach.");
  }

  return issues;
};

const getCurrentUsdToBdtRate = async (db) => {
  const rateSetting = await db.collection("settings").findOne({ key: "USD_TO_BDT_RATE" });
  return resolveUsdToBdtRate(rateSetting?.value, DEFAULT_USD_TO_BDT_RATE);
};

export async function POST(req) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { amount, reason } = await req.json();
    const numericAmountBdt = Number(amount);

    if (!numericAmountBdt || numericAmountBdt <= 0 || !reason) {
      return NextResponse.json(
        { ok: false, error: "Valid BDT amount and reason are required" },
        { status: 400 }
      );
    }

    const trackingId = crypto.randomBytes(12).toString("hex");
    const apiKey = getGatewayApiKey();
    const gatewayBaseUrl = getGatewayBaseUrl();
    const publicBaseUrl = getPublicBaseUrl(req);
    const redirectBase =
      process.env.UDDOKTAPAY_REDIRECT?.trim() || `${publicBaseUrl}/user-dashboard/payment-methods`;
    const cancelBase =
      process.env.UDDOKTAPAY_CANCEL?.trim() || `${publicBaseUrl}/api/payment/cancel`;
    const webhookUrl =
      process.env.UDDOKTAPAY_WEBHOOK?.trim() || `${publicBaseUrl}/api/payment/callback`;
    const configIssues = getConfigIssues({
      apiKey,
      gatewayBaseUrl,
      webhookUrl,
      publicBaseUrl,
    });

    if (!apiKey || !gatewayBaseUrl) {
      return NextResponse.json(
        {
          ok: false,
          error: "Automatic payment gateway is not configured correctly.",
          issues: configIssues,
        },
        { status: 500 }
      );
    }

    const { db } = await getDB();
    const usdToBdtRate = await getCurrentUsdToBdtRate(db);
    const creditedUsdAmount = convertBdtToUsd(numericAmountBdt, usdToBdtRate);

    const payload = {
      full_name: decoded.email,
      email: decoded.email,
      amount: String(numericAmountBdt),
      metadata: { userUid: decoded.uid, reason, currency: "BDT", usdToBdtRate },
      redirect_url: withInvoiceId(redirectBase, trackingId),
      cancel_url: withInvoiceId(cancelBase, trackingId),
      webhook_url: webhookUrl,
    };

    const res = await fetch(gatewayBaseUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "RT-UDDOKTAPAY-API-KEY": apiKey,
      },
      body: JSON.stringify(payload),
    });

    const rawBody = await res.text();
    let data = null;
    try {
      data = JSON.parse(rawBody);
    } catch {
      data = { raw: rawBody };
    }

    if (res.ok && data.status && data.payment_url) {
      await db.collection("payments").insertOne({
        trx_id: trackingId,
        userUid: decoded.uid,
        email: decoded.email,
        method: "uddoktapay",
        amount: numericAmountBdt,
        amountBdt: numericAmountBdt,
        creditedUsdAmount,
        currency: "BDT",
        usdToBdtRate,
        reason,
        status: "pending",
        createdAt: new Date(),
      });

      return NextResponse.json({
        ok: true,
        paymentUrl: data.payment_url,
        trx_id: trackingId,
      });
    }

    console.error("UDDOKTAPAY CREATE FAILED:", {
      status: res.status,
      gatewayBaseUrl,
      publicBaseUrl,
      redirectBase,
      cancelBase,
      webhookUrl,
      response: data,
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          data?.message ||
          data?.error ||
          "Payment init failed from gateway",
        issues:
          res.status === 401
            ? [
                "The gateway rejected the configured API key.",
                "Check that the API key matches the same merchant account as the configured gateway URL.",
              ]
            : configIssues,
        data,
        gatewayStatus: res.status,
      },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
