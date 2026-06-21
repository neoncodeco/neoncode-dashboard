import { formatBdt, formatUsd } from "@/lib/currency";
import { formatAuthProvider, formatPaymentMethod, formatStatusLabel } from "@/lib/displayFormatters";
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

export function adminEmailUrl(path = "", baseUrl = "") {
  const target = String(path || "").startsWith("/") ? path : `/${path}`;
  const gate = adminUrl("/admin-access", baseUrl);
  return `${gate}?next=${encodeURIComponent(target)}`;
}

export async function getAdminNotificationEmails(db) {
  const admins = await db
    .collection("users")
    .find({ role: { $regex: /^admin$/i } }, { projection: { email: 1 } })
    .toArray();

  const emails = admins
    .map((user) => String(user.email || "").trim().toLowerCase())
    .filter(Boolean);

  const unique = [...new Set(emails)];
  if (unique.length) return unique;

  const fromEnv = String(process.env.ADMIN_NOTIFICATION_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return [...new Set(fromEnv)];
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
    { label: "Payment Method", value: formatPaymentMethod(payment?.method) },
    { label: "Reference ID", value: payment?.trxId || payment?.trx_id || "—" },
  ];
}

export async function notifyAdminsNewPayment(db, { payment, user, baseUrl }) {
  const amountBdt = Number(payment?.amountBdt ?? payment?.amount ?? 0);
  const subject = `New Payment Request - ${formatBdt(amountBdt)}`;
  const reviewUrl = adminEmailUrl("/admin-dashboard/transactions", baseUrl);
  const details = paymentDetails(payment, user);
  const paragraphs = [
    "A new funding request has been submitted and is now awaiting administrative review.",
    "Open the transactions panel to review the request and either approve or reject it.",
  ];

  const html = buildNeonEmailHtml({
    preview: subject,
    title: "New Payment Request",
    greeting: "Hello Admin,",
    paragraphs,
    details,
    statusKey: "pending",
    statusText: "Pending review",
    ctaLabel: "Open Transactions Panel",
    ctaUrl: reviewUrl,
  });

  const text = buildNeonEmailText({
    title: "New Payment Request",
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
    success: "Payment Approved",
    failed: "Payment Failed",
    cancelled: "Payment Rejected",
    pending: "Payment Submitted",
    info: "Payment Update",
  };

  const subjectMap = {
    success: "Your Payment Has Been Approved",
    failed: "Your Payment Could Not Be Completed",
    cancelled: "Your Payment Request Was Rejected",
    pending: "Your Payment Request Has Been Received",
    info: "Payment Status Update",
  };

  const paragraphsMap = {
    success: [
      "Your payment has been approved successfully, and the corresponding balance has been added to your account.",
      "You can review the transaction details at any time from your billing dashboard.",
    ],
    failed: [
      "We were unable to complete your payment successfully.",
      "If any funds were deducted from your side, please contact support and share your payment reference for assistance.",
    ],
    cancelled: [
      "Your payment request was reviewed and could not be approved by our team.",
      "If you believe this decision was made in error, please contact support for clarification.",
    ],
    pending: [
      "We have received your payment request successfully and it is currently under review.",
      "You will receive another email as soon as the request has been approved, rejected, or otherwise updated.",
    ],
    info: ["There has been an update to your payment request."],
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
    statusText: formatStatusLabel(status || statusKey),
    ctaLabel: statusKey === "success" ? "Open Billing Dashboard" : undefined,
    ctaUrl: statusKey === "success" ? billingUrl : undefined,
  });

  const text = buildNeonEmailText({
    title: statusLabels[statusKey] || "Payment update",
    greeting: `Hi ${user?.name || "there"},`,
    paragraphs: paragraphsMap[statusKey] || paragraphsMap.info,
    details,
    statusText: formatStatusLabel(status || statusKey),
    ctaUrl: statusKey === "success" ? billingUrl : undefined,
  });

  return sendToUser({ to, subject, html, text });
}

export async function notifyAdminsNewUserApproval(db, { user, baseUrl }) {
  const subject = `New User Approval Request - ${user?.email || user?.userId}`;
  const reviewUrl = adminEmailUrl("/admin-dashboard/user-approvals", baseUrl);
  const details = [
    { label: "Name", value: user?.name || "—" },
    { label: "Email", value: user?.email || "—" },
    { label: "User ID", value: user?.userId || "—" },
    { label: "Authentication Method", value: formatAuthProvider(user?.authProvider) },
    { label: "Referral Source", value: user?.referredBy || "—" },
  ];

  const html = buildNeonEmailHtml({
    preview: subject,
    title: "New User Approval Request",
    greeting: "Hello Admin,",
    paragraphs: [
      "A new user has completed registration and is now waiting for administrative approval.",
      "Please review the account request from your admin dashboard before account access is granted.",
    ],
    details,
    statusKey: "pending",
    statusText: "Pending approval",
    ctaLabel: "Review Approval Requests",
    ctaUrl: reviewUrl,
  });

  const text = buildNeonEmailText({
    title: "New User Approval Request",
    greeting: "Hello Admin,",
    paragraphs: ["A newly registered user is currently waiting for approval."],
    details,
    statusText: "Pending approval",
    ctaUrl: reviewUrl,
  });

  return sendToAdmins(db, { subject, html, text });
}

export async function notifyUserApprovalStatus(db, { user, status, note, baseUrl }) {
  const statusKey = resolveEmailStatus(status === "inactive" ? "failed" : status);
  const subjectMap = {
    success: "Your Neon Code Account Has Been Approved",
    failed: "Your Account Access Has Been Restricted",
    cancelled: "Your Registration Request Was Rejected",
    pending: "Your Account Is Still Pending Approval",
    info: "Account Status Update",
  };

  const paragraphsMap = {
    success: [
      "Your account has been approved successfully.",
      "You may now sign in and start using your Neon Code dashboard.",
    ],
    failed: [
      "Your account has been restricted by an administrator.",
      note ? `Note: ${note}` : "",
    ].filter(Boolean),
    cancelled: [
      "Your registration request was reviewed but could not be approved.",
      note ? `Note: ${note}` : "",
    ].filter(Boolean),
    pending: ["Your account is still awaiting administrative approval."],
    info: ["There has been an update to your account status."],
  };

  const to = user?.email;
  const subject = subjectMap[statusKey] || subjectMap.info;
  const loginUrl = `${baseUrl || getAppBaseUrl()}/login`;
  const details = [
    { label: "Name", value: user?.name || "—" },
    { label: "Email", value: user?.email || "—" },
    { label: "Account Status", value: formatStatusLabel(status) },
  ];

  const html = buildNeonEmailHtml({
    preview: subject,
    title: "Account Approval Update",
    greeting: `Hi ${user?.name || "there"},`,
    paragraphs: paragraphsMap[statusKey] || paragraphsMap.info,
    details,
    statusKey,
    statusText: formatStatusLabel(status || statusKey),
    ctaLabel: statusKey === "success" ? "Sign In to Dashboard" : undefined,
    ctaUrl: statusKey === "success" ? loginUrl : undefined,
  });

  const text = buildNeonEmailText({
    title: "Account Approval Update",
    greeting: `Hi ${user?.name || "there"},`,
    paragraphs: paragraphsMap[statusKey] || paragraphsMap.info,
    details,
    statusText: formatStatusLabel(status || statusKey),
    ctaUrl: statusKey === "success" ? loginUrl : undefined,
  });

  return sendToUser({ to, subject, html, text });
}

export async function notifyAdminsNewAdAccountRequest(db, { request, user, baseUrl }) {
  const requestId = serializeMongoId(request?._id);
  const subject = `New Ad Account Request - ${request?.accountName || request?.userEmail || "Ad Account"}`;
  const reviewUrl = requestId
    ? adminEmailUrl(`/admin-dashboard/meta-ads/${encodeURIComponent(requestId)}`, baseUrl)
    : adminEmailUrl("/admin-dashboard/meta-ads", baseUrl);

  const details = [
    { label: "Account Name", value: request?.accountName || "—" },
    { label: "User", value: user?.name || request?.userEmail || "—" },
    { label: "Email", value: request?.userEmail || user?.email || "—" },
    { label: "BM ID", value: request?.bmId || "—" },
    { label: "Monthly Budget", value: formatUsd(request?.monthlyBudget) },
    { label: "Meta Account ID", value: request?.MetaAccountID || "Not assigned yet" },
  ];

  const html = buildNeonEmailHtml({
    preview: subject,
    title: "New Meta Ad Account Request",
    greeting: "Hello Admin,",
    paragraphs: [
      "A new Meta ad account request has been submitted by a user.",
      "Open the request in the admin dashboard to review the details and take the appropriate action.",
    ],
    details,
    statusKey: "pending",
    statusText: "Pending review",
    ctaLabel: "Open Ad Account Request",
    ctaUrl: reviewUrl,
  });

  const text = buildNeonEmailText({
    title: "New Meta Ad Account Request",
    greeting: "Hello Admin,",
    paragraphs: ["A new Meta ad account request is awaiting review."],
    details,
    statusText: "Pending review",
    ctaUrl: reviewUrl,
  });

  return sendToAdmins(db, { subject, html, text });
}

export async function notifyUserAdAccountStatus(db, { request, user, status, baseUrl }) {
  const statusKey = resolveEmailStatus(status);
  const subjectMap = {
    success: "Your Ad Account Has Been Approved",
    failed: "Your Ad Account Has Been Restricted",
    cancelled: "Your Ad Account Request Was Rejected",
    pending: "Your Ad Account Request Is Pending Review",
    info: "Ad Account Status Update",
  };

  const paragraphsMap = {
    success: [
      "Your Meta ad account request has been approved successfully.",
      "You can now access and manage the account from your user dashboard.",
    ],
    failed: [
      "Your ad account has been restricted by an administrator.",
      "Please contact support if you need assistance restoring access.",
    ],
    cancelled: [
      "Your ad account request was reviewed but could not be approved.",
      "You may submit a new request after updating the required information.",
    ],
    pending: ["Your ad account request is currently pending administrative review."],
    info: ["There has been an update to your ad account request."],
  };

  const to = user?.email || request?.userEmail;
  const subject = subjectMap[statusKey] || subjectMap.info;
  const dashboardUrl = `${baseUrl || getAppBaseUrl()}/user-dashboard/overview`;
  const details = [
    { label: "Account Name", value: request?.accountName || "—" },
    { label: "BM ID", value: request?.bmId || "—" },
    { label: "Meta Account ID", value: request?.MetaAccountID || "—" },
    { label: "Monthly Budget", value: formatUsd(request?.monthlyBudget) },
    { label: "Status", value: formatStatusLabel(status) },
  ];

  const html = buildNeonEmailHtml({
    preview: subject,
    title: "Ad Account Update",
    greeting: `Hi ${user?.name || "there"},`,
    paragraphs: paragraphsMap[statusKey] || paragraphsMap.info,
    details,
    statusKey,
    statusText: formatStatusLabel(status || statusKey),
    ctaLabel: statusKey === "success" ? "Open User Dashboard" : undefined,
    ctaUrl: statusKey === "success" ? dashboardUrl : undefined,
  });

  const text = buildNeonEmailText({
    title: "Ad Account Update",
    greeting: `Hi ${user?.name || "there"},`,
    paragraphs: paragraphsMap[statusKey] || paragraphsMap.info,
    details,
    statusText: formatStatusLabel(status || statusKey),
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
