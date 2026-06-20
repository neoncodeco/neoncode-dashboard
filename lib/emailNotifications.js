import { formatBdt, formatUsd } from "@/lib/currency";
import { serializeMongoId } from "@/lib/serializeMongoId";
import { buildNeonEmailHtml, buildNeonEmailText, resolveEmailStatus } from "@/lib/emailTemplates";
import { sendEmail } from "@/lib/mailer";

function notificationsEnabled() {
  const flag = String(process.env.NOTIFICATIONS_ENABLED ?? "true").trim().toLowerCase();
  return !["0", "false", "no", "off"].includes(flag);
}

export function getAppBaseUrl(req) {
  const explicit =
    process.env.APP_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    "";

  if (explicit) {
    try {
      return new URL(explicit).origin;
    } catch {
      return explicit.replace(/\/+$/, "");
    }
  }

  if (req?.url) {
    try {
      return new URL(req.url).origin;
    } catch {
      return "";
    }
  }

  return "";
}

export function adminUrl(path = "", baseUrl = "") {
  const origin = baseUrl || getAppBaseUrl();
  const clean = String(path || "").startsWith("/") ? path : `/${path}`;
  return `${origin}${clean}`;
}

export async function getAdminNotificationEmails(db) {
  const fromEnv = String(process.env.ADMIN_NOTIFICATION_EMAILS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (fromEnv.length) return [...new Set(fromEnv)];

  const admins = await db
    .collection("users")
    .find({ role: { $in: ["admin", "manager"] } }, { projection: { email: 1 } })
    .toArray();

  const emails = admins.map((user) => String(user.email || "").trim()).filter(Boolean);
  return [...new Set(emails)];
}

async function sendToAdmins(db, { subject, html, text }) {
  if (!notificationsEnabled()) return { ok: false, skipped: true };

  const recipients = await getAdminNotificationEmails(db);
  if (!recipients.length) {
    console.warn("No admin notification recipients configured.");
    return { ok: false, error: "No admin recipients" };
  }

  return sendEmail({ to: recipients, subject, html, text });
}

async function sendToUser({ to, subject, html, text }) {
  if (!notificationsEnabled()) return { ok: false, skipped: true };
  if (!to) return { ok: false, error: "Missing recipient" };
  return sendEmail({ to, subject, html, text });
}

function paymentDetails(payment, user) {
  const amountBdt = Number(payment?.amountBdt ?? payment?.amount ?? 0);
  const creditedUsd = Number(payment?.creditedUsdAmount ?? 0);
  return [
    { label: "User", value: user?.name || payment?.email || "—" },
    { label: "Email", value: user?.email || payment?.email || "—" },
    { label: "Amount (BDT)", value: formatBdt(amountBdt) },
    { label: "Credited (USD)", value: creditedUsd > 0 ? formatUsd(creditedUsd) : "—" },
    { label: "Method", value: payment?.method || "—" },
    { label: "Transaction ID", value: payment?.trxId || payment?.trx_id || "—" },
  ];
}

export async function notifyAdminsNewPayment(db, { payment, user, baseUrl }) {
  const amountBdt = Number(payment?.amountBdt ?? payment?.amount ?? 0);
  const subject = `New payment pending — ${formatBdt(amountBdt)}`;
  const reviewUrl = adminUrl("/admin-dashboard/transactions", baseUrl);
  const details = paymentDetails(payment, user);
  const paragraphs = [
    "A new payment is waiting for your review in the admin dashboard.",
    "Open the transactions page to approve or reject this payment.",
  ];

  const html = buildNeonEmailHtml({
    preview: subject,
    title: "New payment request",
    greeting: "Hello Admin,",
    paragraphs,
    details,
    statusKey: "pending",
    statusText: "Pending review",
    ctaLabel: "Review in admin dashboard",
    ctaUrl: reviewUrl,
  });

  const text = buildNeonEmailText({
    title: "New payment request",
    greeting: "Hello Admin,",
    paragraphs,
    details,
    statusText: "Pending review",
    ctaUrl: reviewUrl,
  });

  return sendToAdmins(db, { subject, html, text });
}

export async function notifyUserPaymentStatus(db, { payment, user, status, baseUrl }) {
  const statusKey = resolveEmailStatus(status);
  const statusLabels = {
    success: "Payment approved",
    failed: "Payment failed",
    cancelled: "Payment rejected",
    pending: "Payment pending",
    info: "Payment update",
  };

  const subjectMap = {
    success: "Your payment was approved",
    failed: "Your payment could not be completed",
    cancelled: "Your payment was rejected",
    pending: "Your payment is pending",
    info: "Payment status update",
  };

  const paragraphsMap = {
    success: [
      "Great news — your payment has been approved and your wallet balance has been updated.",
      "You can view the transaction from your dashboard billing page.",
    ],
    failed: [
      "We could not complete your payment. If money was deducted, contact support with your transaction reference.",
    ],
    cancelled: [
      "Your payment request was reviewed and rejected by our team.",
      "If you believe this is a mistake, please contact support.",
    ],
    pending: ["Your payment is pending review. We will notify you once it is processed."],
    info: ["Your payment status has been updated."],
  };

  const to = user?.email || payment?.email;
  const subject = subjectMap[statusKey] || subjectMap.info;
  const details = paymentDetails(payment, user);
  const billingUrl = `${baseUrl || getAppBaseUrl()}/user-dashboard/billing`;

  const html = buildNeonEmailHtml({
    preview: subject,
    title: statusLabels[statusKey] || "Payment update",
    greeting: `Hi ${user?.name || "there"},`,
    paragraphs: paragraphsMap[statusKey] || paragraphsMap.info,
    details,
    statusKey,
    statusText: String(status || statusKey).toUpperCase(),
    ctaLabel: statusKey === "success" ? "Open billing dashboard" : undefined,
    ctaUrl: statusKey === "success" ? billingUrl : undefined,
  });

  const text = buildNeonEmailText({
    title: statusLabels[statusKey] || "Payment update",
    greeting: `Hi ${user?.name || "there"},`,
    paragraphs: paragraphsMap[statusKey] || paragraphsMap.info,
    details,
    statusText: String(status || statusKey).toUpperCase(),
    ctaUrl: statusKey === "success" ? billingUrl : undefined,
  });

  return sendToUser({ to, subject, html, text });
}

export async function notifyAdminsNewUserApproval(db, { user, baseUrl }) {
  const subject = `New user approval — ${user?.email || user?.userId}`;
  const reviewUrl = adminUrl("/admin-dashboard/user-approvals", baseUrl);
  const details = [
    { label: "Name", value: user?.name || "—" },
    { label: "Email", value: user?.email || "—" },
    { label: "User ID", value: user?.userId || "—" },
    { label: "Auth provider", value: user?.authProvider || "credentials" },
    { label: "Referred by", value: user?.referredBy || "—" },
  ];

  const html = buildNeonEmailHtml({
    preview: subject,
    title: "New registration approval",
    greeting: "Hello Admin,",
    paragraphs: [
      "A new user registered and is waiting for approval before they can sign in.",
      "Review the request from your admin dashboard.",
    ],
    details,
    statusKey: "pending",
    statusText: "Pending approval",
    ctaLabel: "Review approval requests",
    ctaUrl: reviewUrl,
  });

  const text = buildNeonEmailText({
    title: "New registration approval",
    greeting: "Hello Admin,",
    paragraphs: ["A new user is waiting for approval."],
    details,
    statusText: "Pending approval",
    ctaUrl: reviewUrl,
  });

  return sendToAdmins(db, { subject, html, text });
}

export async function notifyUserApprovalStatus(db, { user, status, note, baseUrl }) {
  const statusKey = resolveEmailStatus(status === "inactive" ? "failed" : status);
  const subjectMap = {
    success: "Your Neon Code account is approved",
    failed: "Your account access was restricted",
    cancelled: "Your registration was rejected",
    pending: "Your account is pending approval",
    info: "Account status update",
  };

  const paragraphsMap = {
    success: [
      "Your account has been approved. You can now sign in and use the dashboard.",
    ],
    failed: [
      "Your account has been blocked or deactivated by an administrator.",
      note ? `Note: ${note}` : "",
    ].filter(Boolean),
    cancelled: [
      "Your registration request was rejected.",
      note ? `Note: ${note}` : "",
    ].filter(Boolean),
    pending: ["Your account is still pending admin approval."],
    info: ["Your account status has been updated."],
  };

  const to = user?.email;
  const subject = subjectMap[statusKey] || subjectMap.info;
  const loginUrl = `${baseUrl || getAppBaseUrl()}/login`;
  const details = [
    { label: "Name", value: user?.name || "—" },
    { label: "Email", value: user?.email || "—" },
    { label: "Account status", value: String(status || "—") },
  ];

  const html = buildNeonEmailHtml({
    preview: subject,
    title: "Account approval update",
    greeting: `Hi ${user?.name || "there"},`,
    paragraphs: paragraphsMap[statusKey] || paragraphsMap.info,
    details,
    statusKey,
    statusText: String(status || statusKey).toUpperCase(),
    ctaLabel: statusKey === "success" ? "Sign in to dashboard" : undefined,
    ctaUrl: statusKey === "success" ? loginUrl : undefined,
  });

  const text = buildNeonEmailText({
    title: "Account approval update",
    greeting: `Hi ${user?.name || "there"},`,
    paragraphs: paragraphsMap[statusKey] || paragraphsMap.info,
    details,
    statusText: String(status || statusKey).toUpperCase(),
    ctaUrl: statusKey === "success" ? loginUrl : undefined,
  });

  return sendToUser({ to, subject, html, text });
}

export async function notifyAdminsNewAdAccountRequest(db, { request, user, baseUrl }) {
  const requestId = serializeMongoId(request?._id);
  const subject = `New ad account request — ${request?.accountName || request?.userEmail || "Ad account"}`;
  const reviewUrl = requestId
    ? adminUrl(`/admin-dashboard/meta-ads/${encodeURIComponent(requestId)}`, baseUrl)
    : adminUrl("/admin-dashboard/meta-ads", baseUrl);

  const details = [
    { label: "Account name", value: request?.accountName || "—" },
    { label: "User", value: user?.name || request?.userEmail || "—" },
    { label: "Email", value: request?.userEmail || user?.email || "—" },
    { label: "BM ID", value: request?.bmId || "—" },
    { label: "Monthly budget", value: formatUsd(request?.monthlyBudget) },
    { label: "Meta ID", value: request?.MetaAccountID || "Not set yet" },
  ];

  const html = buildNeonEmailHtml({
    preview: subject,
    title: "New Meta ad account request",
    greeting: "Hello Admin,",
    paragraphs: [
      "A user submitted a new ad account request.",
      "Open the request in admin dashboard to review, approve, or reject.",
    ],
    details,
    statusKey: "pending",
    statusText: "Pending review",
    ctaLabel: "Open ad account request",
    ctaUrl: reviewUrl,
  });

  const text = buildNeonEmailText({
    title: "New Meta ad account request",
    greeting: "Hello Admin,",
    paragraphs: ["A new ad account request needs review."],
    details,
    statusText: "Pending review",
    ctaUrl: reviewUrl,
  });

  return sendToAdmins(db, { subject, html, text });
}

export async function notifyUserAdAccountStatus(db, { request, user, status, baseUrl }) {
  const statusKey = resolveEmailStatus(status);
  const subjectMap = {
    success: "Your ad account was approved",
    failed: "Your ad account was blocked",
    cancelled: "Your ad account request was rejected",
    pending: "Ad account request pending",
    info: "Ad account status update",
  };

  const paragraphsMap = {
    success: [
      "Your Meta ad account request has been approved.",
      "You can now manage the account from your user dashboard.",
    ],
    failed: [
      "Your ad account has been blocked by an administrator.",
      "Contact support if you need help restoring access.",
    ],
    cancelled: [
      "Your ad account request was rejected or cancelled.",
      "You may submit a new request after fixing the required details.",
    ],
    pending: ["Your ad account request is still pending review."],
    info: ["Your ad account status has been updated."],
  };

  const to = user?.email || request?.userEmail;
  const subject = subjectMap[statusKey] || subjectMap.info;
  const dashboardUrl = `${baseUrl || getAppBaseUrl()}/user-dashboard/overview`;
  const details = [
    { label: "Account name", value: request?.accountName || "—" },
    { label: "BM ID", value: request?.bmId || "—" },
    { label: "Meta ID", value: request?.MetaAccountID || "—" },
    { label: "Monthly budget", value: formatUsd(request?.monthlyBudget) },
    { label: "Status", value: String(status || "—") },
  ];

  const html = buildNeonEmailHtml({
    preview: subject,
    title: "Ad account update",
    greeting: `Hi ${user?.name || "there"},`,
    paragraphs: paragraphsMap[statusKey] || paragraphsMap.info,
    details,
    statusKey,
    statusText: String(status || statusKey).toUpperCase(),
    ctaLabel: statusKey === "success" ? "Open user dashboard" : undefined,
    ctaUrl: statusKey === "success" ? dashboardUrl : undefined,
  });

  const text = buildNeonEmailText({
    title: "Ad account update",
    greeting: `Hi ${user?.name || "there"},`,
    paragraphs: paragraphsMap[statusKey] || paragraphsMap.info,
    details,
    statusText: String(status || statusKey).toUpperCase(),
    ctaUrl: statusKey === "success" ? dashboardUrl : undefined,
  });

  return sendToUser({ to, subject, html, text });
}

export async function fetchUserByUid(db, userUid) {
  if (!userUid) return null;
  return db.collection("users").findOne(
    { userId: userUid },
    { projection: { userId: 1, name: 1, email: 1, role: 1, status: 1 } }
  );
}
