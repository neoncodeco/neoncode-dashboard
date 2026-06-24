const STATUS_STYLES = {
  success: { label: "Success", bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
  failed: { label: "Failed", bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" },
  cancelled: { label: "Cancelled", bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  pending: { label: "Pending", bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
  info: { label: "Update", bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function resolveEmailStatus(status) {
  const s = String(status || "").toLowerCase();
  if (["approved", "active", "success", "completed"].includes(s)) return "success";
  if (["failed", "blocked", "inactive"].includes(s)) return "failed";
  if (["rejected", "cancelled", "canceled"].includes(s)) return "cancelled";
  if (["pending"].includes(s)) return "pending";
  return "info";
}

/**
 * @param {object} options
 * @param {string} options.preview
 * @param {string} options.title
 * @param {string} [options.greeting]
 * @param {string[]} [options.paragraphs]
 * @param {Array<{label:string,value:string}>} [options.details]
 * @param {string} [options.statusKey] success|failed|cancelled|pending|info
 * @param {string} [options.statusText]
 * @param {string} [options.ctaLabel]
 * @param {string} [options.ctaUrl]
 * @param {string} [options.footerNote]
 */
export function buildNeonEmailHtml({
  preview,
  title,
  greeting,
  paragraphs = [],
  details = [],
  statusKey = "info",
  statusText,
  ctaLabel,
  ctaUrl,
  footerNote,
}) {
  const status = STATUS_STYLES[statusKey] || STATUS_STYLES.info;
  const safeTitle = escapeHtml(title);
  const safeGreeting = escapeHtml(greeting || "Hello,");
  const safePreview = escapeHtml(preview || title);
  const safeStatus = escapeHtml(statusText || status.label);
  const safeFooter =
    footerNote ||
    process.env.NOTIFICATION_EMAIL_FOOTER?.trim() ||
    "This is an automated message from Neon Code. Please do not reply to this email.";

  const detailRows = details
    .filter((row) => row?.label)
    .map(
      (row) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eef2f7;color:#64748b;font-size:13px;width:38%;vertical-align:top;">${escapeHtml(row.label)}</td>
          <td style="padding:10px 0;border-bottom:1px solid #eef2f7;color:#0f172a;font-size:13px;font-weight:600;word-break:break-word;">${escapeHtml(row.value || "—")}</td>
        </tr>`
    )
    .join("");

  const bodyParagraphs = paragraphs
    .map((p) => `<p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.6;">${escapeHtml(p)}</p>`)
    .join("");

  const ctaBlock =
    ctaLabel && ctaUrl
      ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:22px 0 8px;">
          <tr>
            <td style="border-radius:12px;background:#b7df69;">
              <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;padding:12px 22px;color:#17210e;font-size:14px;font-weight:800;text-decoration:none;">${escapeHtml(ctaLabel)}</a>
            </td>
          </tr>
        </table>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${safePreview}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e5eaf3;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.06);">
          <tr>
            <td style="padding:22px 24px;background:linear-gradient(135deg,#17210e 0%,#243516 100%);">
              <p style="margin:0;color:#b7df69;font-size:11px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;">Neon Code</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;line-height:1.3;">${safeTitle}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <p style="margin:0 0 14px;color:#0f172a;font-size:16px;font-weight:700;">${safeGreeting}</p>
              ${bodyParagraphs}
              <div style="display:inline-block;margin:4px 0 18px;padding:8px 12px;border-radius:999px;background:${status.bg};border:1px solid ${status.border};color:${status.color};font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">
                Status: ${safeStatus}
              </div>
              ${
                detailRows
                  ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 8px;">${detailRows}</table>`
                  : ""
              }
              ${ctaBlock}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 22px;border-top:1px solid #eef2f7;background:#fafbfd;">
              <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">${escapeHtml(safeFooter)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildNeonEmailText({ title, greeting, paragraphs = [], details = [], statusText, ctaUrl, footerNote }) {
  const lines = [
    title,
    "",
    greeting || "Hello,",
    "",
    ...paragraphs,
    "",
    `Status: ${statusText || "Update"}`,
    "",
    ...details.map((row) => `${row.label}: ${row.value || "—"}`),
  ];
  if (ctaUrl) lines.push("", `Action Link: ${ctaUrl}`);
  lines.push(
    "",
    footerNote || process.env.NOTIFICATION_EMAIL_FOOTER || "This is an automated message from Neon Code."
  );
  return lines.join("\n");
}

/**
 * Polished platform-wide notification email (admin news → user inbox).
 */
export function buildPlatformNotificationEmail({
  title,
  message,
  userName,
  publishedAt,
  publisherName,
  dashboardUrl,
}) {
  const safeTitle = escapeHtml(String(title || "Platform Update").trim() || "Platform Update");
  const safeName = escapeHtml(String(userName || "there").trim() || "there");
  const safePublisher = escapeHtml(String(publisherName || "Neon Code Team").trim() || "Neon Code Team");
  const safePublished = escapeHtml(String(publishedAt || "Just now").trim() || "Just now");
  const safeUrl = escapeHtml(dashboardUrl || "");
  const messageLines = String(message || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const safeMessageHtml = messageLines.length
    ? messageLines.map((line) => `<p style="margin:0 0 12px;color:#1e293b;font-size:16px;line-height:1.7;font-weight:500;">${escapeHtml(line)}</p>`).join("")
    : `<p style="margin:0;color:#64748b;font-size:15px;line-height:1.6;">Open your dashboard to read this update.</p>`;
  const safeMessageText = messageLines.join("\n\n") || "Open your dashboard to read this update.";
  const safePreview = escapeHtml(messageLines[0] || title || "New platform update");
  const safeFooter =
    process.env.NOTIFICATION_EMAIL_FOOTER?.trim() ||
    "You received this email because a platform announcement was sent to your Neon Code account. Please do not reply to this message.";

  const subject = `${String(title || "Platform Update").trim()} · Neon Code`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background:#eef2eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${safePreview}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef2eb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;">
          <tr>
            <td style="padding:0 4px 14px;text-align:center;">
              <p style="margin:0;color:#64748b;font-size:12px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;">Neon Code</p>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;box-shadow:0 18px 50px rgba(15,23,42,0.08);">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding:28px 28px 22px;background:linear-gradient(135deg,#17210e 0%,#2a3f18 100%);">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td>
                          <span style="display:inline-block;padding:6px 10px;border-radius:999px;background:rgba(183,223,105,0.18);border:1px solid rgba(183,223,105,0.35);color:#d9f99d;font-size:10px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;">Announcement</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top:14px;">
                          <h1 style="margin:0;color:#ffffff;font-size:24px;line-height:1.25;font-weight:800;letter-spacing:-0.02em;">${safeTitle}</h1>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px;">
                    <p style="margin:0 0 18px;color:#0f172a;font-size:16px;line-height:1.5;font-weight:600;">Hi ${safeName},</p>
                    <p style="margin:0 0 22px;color:#64748b;font-size:14px;line-height:1.7;">There is a new announcement waiting in your dashboard.</p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #b7df69;border-radius:16px;">
                      <tr>
                        <td style="padding:22px 22px 18px;">
                          ${safeMessageHtml}
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:8px;padding-top:16px;border-top:1px solid #e2e8f0;">
                            <tr>
                              <td style="color:#94a3b8;font-size:12px;line-height:1.6;">
                                <span style="display:block;color:#64748b;font-weight:700;">${safePublished}</span>
                                <span style="display:block;margin-top:4px;">Shared by <strong style="color:#475569;font-weight:700;">${safePublisher}</strong></span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    ${
                      safeUrl
                        ? `<table role="presentation" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="border-radius:12px;background:#b7df69;">
                            <a href="${safeUrl}" style="display:inline-block;padding:13px 24px;color:#17210e;font-size:14px;font-weight:800;text-decoration:none;letter-spacing:0.01em;">View in dashboard</a>
                          </td>
                        </tr>
                      </table>`
                        : ""
                    }
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 28px 24px;border-top:1px solid #eef2f7;background:#fafbfd;">
                    <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.7;">${escapeHtml(safeFooter)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    safeTitle,
    "",
    `Hi ${String(userName || "there").trim() || "there"},`,
    "",
    "There is a new announcement in your Neon Code dashboard.",
    "",
    safeMessageText,
    "",
    `Published: ${String(publishedAt || "Just now")}`,
    `Shared by: ${String(publisherName || "Neon Code Team")}`,
    dashboardUrl ? `\nView in dashboard: ${dashboardUrl}` : "",
    "",
    safeFooter,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}
