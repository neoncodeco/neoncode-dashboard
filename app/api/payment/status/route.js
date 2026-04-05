import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { createDefaultBankPaymentDetails, normalizeBankPaymentDetails } from "@/lib/bankDetails";

const getGatewayApiKey = () =>
  process.env.UDDOKTAPAY_API_KEY?.trim() ||
  process.env.PAYMENTLY_API_KEY?.trim() ||
  "";

const getGatewayBaseUrl = () =>
  process.env.UDDOKTAPAY_BASE_URL?.trim() ||
  process.env.PAYMENTLY_BASE_URL?.trim() ||
  "";

const getPublicBaseUrl = () =>
  process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
  process.env.APP_BASE_URL?.trim() ||
  process.env.UDDOKTAPAY_REDIRECT?.trim() ||
  "";

export async function GET() {
  const apiKey = getGatewayApiKey();
  const gatewayBaseUrl = getGatewayBaseUrl();
  const publicBaseUrl = getPublicBaseUrl();
  const webhookUrl =
    process.env.UDDOKTAPAY_WEBHOOK?.trim() ||
    (publicBaseUrl ? `${publicBaseUrl.replace(/\/+$/, "")}/api/payment/callback` : "");

  const issues = [];

  if (!apiKey) {
    issues.push("Missing automatic payment API key.");
  }

  if (!gatewayBaseUrl) {
    issues.push("Missing automatic payment gateway URL.");
  }

  if (!publicBaseUrl) {
    issues.push("Missing public app URL for redirect and callback handling.");
  }

  if (webhookUrl.includes("localhost")) {
    issues.push("Webhook URL is using localhost, which external gateways cannot reach.");
  }

  let bankPaymentDetails = [];
  try {
    const { db } = await getDB();
    const bankDetailsSetting = await db.collection("settings").findOne({ key: "BANK_PAYMENT_DETAILS" });
    bankPaymentDetails = normalizeBankPaymentDetails(bankDetailsSetting?.value || createDefaultBankPaymentDetails());
  } catch (error) {
    console.error("PAYMENT STATUS SETTINGS LOAD ERROR:", error);
  }

  return NextResponse.json({
    ok: true,
    automaticPayment: {
      ready: issues.length === 0,
      gatewayConfigured: Boolean(gatewayBaseUrl),
      apiKeyConfigured: Boolean(apiKey),
      publicBaseConfigured: Boolean(publicBaseUrl),
      webhookUrl,
      gatewayBaseUrl,
    },
    manualPayment: {
      ready: true,
      bankPaymentDetails,
    },
    issues,
  });
}
