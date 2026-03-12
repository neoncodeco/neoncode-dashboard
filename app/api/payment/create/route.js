import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";
import crypto from "crypto";

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
  return process.env.UDDOKTAPAY_BASE_URL?.trim() || "";
};

export async function POST(req) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { amount, reason } = await req.json();
    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0 || !reason) {
      return NextResponse.json(
        { ok: false, error: "Valid amount and reason are required" },
        { status: 400 }
      );
    }

    const trackingId = crypto.randomBytes(12).toString("hex");
    const apiKey = getGatewayApiKey();
    const gatewayBaseUrl = getGatewayBaseUrl();
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "Missing UddoktaPay API key in environment" },
        { status: 500 }
      );
    }
    if (!gatewayBaseUrl) {
      return NextResponse.json(
        { ok: false, error: "Missing UddoktaPay base URL in environment" },
        { status: 500 }
      );
    }

    const origin = new URL(req.url).origin;
    const redirectBase =
      process.env.UDDOKTAPAY_REDIRECT || `${origin}/user-dashboard/payment-methods`;
    const cancelBase = process.env.UDDOKTAPAY_CANCEL || `${origin}/api/payment/cancel`;
    const webhookUrl = process.env.UDDOKTAPAY_WEBHOOK || `${origin}/api/payment/callback`;

    const payload = {
      full_name: decoded.email,
      email: decoded.email,
      amount: String(numericAmount),
      metadata: { userUid: decoded.uid, reason },
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
      const { db } = await getDB();

      await db.collection("payments").insertOne({
        trx_id: trackingId,
        userUid: decoded.uid,
        email: decoded.email,
        method: "uddoktapay",
        amount: numericAmount,
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
        data,
        gatewayStatus: res.status,
      },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
