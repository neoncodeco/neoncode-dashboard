import nodemailer from "nodemailer";

function getSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from = process.env.SMTP_FROM?.trim() || user || "";

  if (!host || !port || !user || !pass || !from) {
    return null;
  }

  return {
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    from,
  };
}

export async function sendVerificationEmail({ to, name, verificationUrl }) {
  const smtp = getSmtpConfig();
  if (!smtp) {
    console.warn("SMTP is not configured. Set SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/SMTP_FROM.");
    return { ok: false, error: "Email service is not configured." };
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: smtp.auth,
  });

  const safeName = String(name || "User").trim() || "User";
  await transporter.sendMail({
    from: smtp.from,
    to,
    subject: "Verify your email - Neon Code",
    text: `Hi ${safeName},\n\nPlease verify your email within 5 minutes:\n${verificationUrl}\n\nIf you did not request this, ignore this email.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
        <h2>Verify your email</h2>
        <p>Hi ${safeName},</p>
        <p>Please verify your email within <strong>5 minutes</strong>.</p>
        <p><a href="${verificationUrl}" style="display:inline-block;padding:10px 14px;background:#b7df69;color:#17210e;text-decoration:none;border-radius:8px;font-weight:700">Verify Email</a></p>
        <p>Or open this link:</p>
        <p>${verificationUrl}</p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });

  return { ok: true };
}
