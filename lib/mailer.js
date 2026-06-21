import nodemailer from "nodemailer";
import { buildNeonEmailHtml, buildNeonEmailText } from "@/lib/emailTemplates";

function getSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from = process.env.SMTP_FROM?.trim() || user || "";
  const secureFlag = String(process.env.SMTP_SECURE ?? "").trim().toLowerCase();
  const secure = secureFlag ? ["1", "true", "yes"].includes(secureFlag) : port === 465;

  if (!host || !port || !user || !pass || !from) {
    return null;
  }

  return {
    host,
    port,
    secure,
    auth: { user, pass },
    from,
  };
}

function getTransporter(smtp) {
  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: smtp.auth,
    ...(smtp.port === 587 && !smtp.secure ? { requireTLS: true } : {}),
  });
}

export async function sendEmail({ to, subject, html, text }) {
  const smtp = getSmtpConfig();
  if (!smtp) {
    console.warn("SMTP is not configured. Set SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/SMTP_FROM.");
    return { ok: false, error: "Email service is not configured." };
  }

  const recipients = Array.isArray(to) ? to.filter(Boolean).join(", ") : String(to || "").trim();
  if (!recipients) {
    return { ok: false, error: "Missing recipient email." };
  }

  try {
    const transporter = getTransporter(smtp);
    await transporter.sendMail({
      from: smtp.from,
      to: recipients,
      subject,
      text,
      html,
    });
    return { ok: true };
  } catch (error) {
    console.error("SMTP send error:", error);
    return { ok: false, error: error?.message || "Failed to send email." };
  }
}

export async function sendPasswordResetOtp({ to, name, code }) {
  const safeName = String(name || "User").trim() || "User";
  const safeCode = String(code || "").trim();
  const subject = "Your Neon Code password reset code";
  const paragraphs = [
    `Your password reset code is: ${safeCode}`,
    "Enter this code on the forgot password page to continue resetting your password.",
    "This code expires in 10 minutes. If you did not request this, you can safely ignore this email.",
  ];

  const html = buildNeonEmailHtml({
    preview: subject,
    title: "Reset your password",
    greeting: `Hi ${safeName},`,
    paragraphs,
    statusKey: "info",
    statusText: "Password reset code",
  });

  const text = buildNeonEmailText({
    title: "Reset your password",
    greeting: `Hi ${safeName},`,
    paragraphs,
    statusText: "Password reset code",
  });

  return sendEmail({ to, subject, html, text });
}

export async function sendEmailVerificationOtp({ to, name, code }) {
  const safeName = String(name || "User").trim() || "User";
  const safeCode = String(code || "").trim();
  const subject = "Your Neon Code verification code";
  const paragraphs = [
    `Your email verification code is: ${safeCode}`,
    "Enter this code on the registration page to complete your account setup.",
    "This code expires in 10 minutes. If you did not request this, you can safely ignore this email.",
  ];

  const html = buildNeonEmailHtml({
    preview: subject,
    title: "Verify your email",
    greeting: `Hi ${safeName},`,
    paragraphs,
    statusKey: "info",
    statusText: "Verification code",
  });

  const text = buildNeonEmailText({
    title: "Verify your email",
    greeting: `Hi ${safeName},`,
    paragraphs,
    statusText: "Verification code",
  });

  return sendEmail({ to, subject, html, text });
}

export async function sendVerificationEmail({ to, name, verificationUrl }) {
  const safeName = String(name || "User").trim() || "User";
  const subject = "Verify your email - Neon Code";
  const paragraphs = [
    "Please verify your email within 5 minutes to continue setting up your account.",
    "If you did not request this, you can safely ignore this email.",
  ];

  const html = buildNeonEmailHtml({
    preview: subject,
    title: "Verify your email",
    greeting: `Hi ${safeName},`,
    paragraphs,
    statusKey: "info",
    statusText: "Verification required",
    ctaLabel: "Verify email address",
    ctaUrl: verificationUrl,
  });

  const text = buildNeonEmailText({
    title: "Verify your email",
    greeting: `Hi ${safeName},`,
    paragraphs,
    statusText: "Verification required",
    ctaUrl: verificationUrl,
  });

  return sendEmail({ to, subject, html, text });
}
