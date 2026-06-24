const FETCH_LIMIT = 250;

function toMs(value) {
  if (!value) return 0;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function normalizeRole(role) {
  const value = String(role || "admin").toLowerCase();
  return value === "manager" ? "manager" : "admin";
}

function buildStaffFields({ uid, name, email, role }) {
  return {
    staffUid: String(uid || "").trim(),
    staffName: String(name || email || "Staff").trim() || "Staff",
    staffEmail: String(email || "").trim(),
    staffRole: normalizeRole(role),
  };
}

function summarizePaymentChanges(changes = []) {
  if (!Array.isArray(changes) || !changes.length) return "";
  return changes
    .slice(0, 4)
    .map((change) => `${change.field}: ${change.from ?? "—"} → ${change.to ?? "—"}`)
    .join(" · ");
}

function mapPaymentEdit(log) {
  const staff = buildStaffFields({
    uid: log.adminUid,
    name: log.adminName,
    email: log.adminEmail,
    role: log.adminRole,
  });

  const amount = log.after?.amountBdt ?? log.before?.amountBdt ?? 0;
  const status = log.after?.status || log.before?.status || "";

  return {
    id: `payment-edit-${String(log._id)}`,
    category: "payment",
    action: "payment_edited",
    actionLabel: "Edited payment",
    title: `Payment ${amount} BDT`,
    description:
      summarizePaymentChanges(log.changes) ||
      `Status ${status}${log.walletDelta ? ` · wallet ${log.walletDelta > 0 ? "+" : ""}${log.walletDelta} USD` : ""}`,
    ...staff,
    targetUserId: log.userUid || "",
    href: "/admin-dashboard/transactions",
    createdAt: log.createdAt,
  };
}

function mapNotificationPublish(item) {
  const createdBy = item.createdBy || {};
  return {
    id: `notification-publish-${String(item._id)}`,
    category: "notification",
    action: "notification_published",
    actionLabel: "Published announcement",
    title: item.title || "Platform update",
    description: String(item.message || "").slice(0, 140),
    ...buildStaffFields({
      uid: createdBy.userId,
      name: createdBy.name,
      email: createdBy.email,
      role: createdBy.role,
    }),
    href: "/admin-dashboard/news",
    createdAt: item.publishedAt || item.createdAt,
  };
}

function mapNotificationEdit(item) {
  const editedBy = item.editedBy || {};
  return {
    id: `notification-edit-${String(item._id)}-${toMs(item.updatedAt)}`,
    category: "notification",
    action: "notification_edited",
    actionLabel: "Edited announcement",
    title: item.title || "Platform update",
    description: "Notification content was updated",
    ...buildStaffFields({
      uid: editedBy.userId,
      name: editedBy.name,
      email: editedBy.email,
      role: editedBy.role,
    }),
    href: "/admin-dashboard/news",
    createdAt: item.updatedAt,
  };
}

function mapUserApproval(user, reviewer) {
  const status = String(user.status || "").toLowerCase();
  const actionMap = {
    active: { action: "user_approved", actionLabel: "Approved user signup" },
    rejected: { action: "user_rejected", actionLabel: "Rejected user signup" },
    inactive: { action: "user_blocked", actionLabel: "Blocked user account" },
  };
  const meta = actionMap[status] || { action: "user_reviewed", actionLabel: "Reviewed user signup" };

  return {
    id: `user-approval-${user.userId}-${toMs(user.approval?.reviewedAt)}`,
    category: "user",
    action: meta.action,
    actionLabel: meta.actionLabel,
    title: user.name || user.email || user.userId,
    description: user.email || user.userId,
    ...buildStaffFields({
      uid: user.approval?.reviewedBy,
      name: reviewer?.name,
      email: reviewer?.email,
      role: reviewer?.role,
    }),
    targetUserId: user.userId,
    href: "/admin-dashboard/user-approvals",
    createdAt: user.approval?.reviewedAt,
  };
}

function mapMetaAccountUpdate(item) {
  const status = String(item.status || "").toLowerCase();
  const actionLabel =
    status === "active"
      ? "Approved Meta ad account"
      : status === "rejected"
        ? "Rejected Meta ad account"
        : status === "blocked"
          ? "Blocked Meta ad account"
          : "Updated Meta ad account";

  return {
    id: `meta-update-${String(item._id)}`,
    category: "meta",
    action: "meta_account_updated",
    actionLabel,
    title: item.title || "Ad account",
    description: `Status: ${item.status || "updated"}`,
    ...buildStaffFields({ uid: item.staffUid, name: item.staffName, email: item.staffEmail, role: item.staffRole }),
    targetUserId: item.userUid || "",
    href: "/admin-dashboard/meta-ads",
    createdAt: item.updatedAt || item.createdAt,
  };
}

function mapStoredStaffLog(item) {
  return {
    id: `staff-log-${String(item._id)}`,
    category: item.category || "payment",
    action: item.action || "staff_action",
    actionLabel: item.actionLabel || item.title || "Staff action",
    title: item.title || "Staff action",
    description: item.description || "",
    ...buildStaffFields({
      uid: item.staffUid,
      name: item.staffName,
      email: item.staffEmail,
      role: item.staffRole,
    }),
    targetUserId: item.targetUserId || "",
    href: item.href || null,
    meta: item.meta || null,
    createdAt: item.createdAt,
  };
}

function mapTicketStaffReply(ticket, message, index) {
  return {
    id: `ticket-reply-${String(ticket._id)}-${index}`,
    category: "support",
    action: "support_replied",
    actionLabel: "Replied to support ticket",
    title: ticket.subject || "Support ticket",
    description: String(message.text || "").slice(0, 140) || `Ticket ${ticket.ticketId || ""}`,
    ...buildStaffFields({
      uid: message.senderId,
      name: message.senderName,
      role: message.senderRole,
    }),
    targetUserId: ticket.userUid || ticket.userId || "",
    href: "/admin-dashboard/support",
    createdAt: message.createdAt,
  };
}

async function loadReviewerMap(db, reviewerIds) {
  const unique = [...new Set(reviewerIds.filter(Boolean))];
  if (!unique.length) return new Map();

  const reviewers = await db
    .collection("users")
    .find({ userId: { $in: unique } }, { projection: { userId: 1, name: 1, email: 1, role: 1 } })
    .toArray();

  return new Map(reviewers.map((user) => [user.userId, user]));
}

export async function recordAdminStaffLog(db, entry) {
  const staffUser = entry.staffUser || {};
  const now = new Date();

  await db.collection("admin_staff_logs").insertOne({
    category: entry.category || "payment",
    action: entry.action || "staff_action",
    actionLabel: entry.actionLabel || entry.title || "Staff action",
    title: entry.title || "Staff action",
    description: entry.description || "",
    staffUid: staffUser.userId || staffUser.uid || entry.staffUid || "",
    staffName: staffUser.name || staffUser.email || entry.staffName || "Staff",
    staffEmail: staffUser.email || entry.staffEmail || "",
    staffRole: normalizeRole(staffUser.role || entry.staffRole),
    targetUserId: entry.targetUserId || null,
    href: entry.href || null,
    meta: entry.meta || null,
    createdAt: now,
  });
}

export async function loadAdminStaffLogs(db) {
  const [
    paymentEdits,
    notifications,
    reviewedUsers,
    metaUpdates,
    storedLogs,
    tickets,
  ] = await Promise.all([
    db
      .collection("payment_admin_edit_logs")
      .find({})
      .sort({ createdAt: -1 })
      .limit(FETCH_LIMIT)
      .toArray(),
    db
      .collection("notifications")
      .find({})
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(FETCH_LIMIT)
      .toArray(),
    db
      .collection("users")
      .find({ "approval.reviewedBy": { $exists: true, $ne: null } })
      .sort({ "approval.reviewedAt": -1 })
      .limit(FETCH_LIMIT)
      .project({ userId: 1, name: 1, email: 1, status: 1, approval: 1 })
      .toArray(),
    db
      .collection("otherCollection")
      .find({ type: "Meta Account Updated" })
      .sort({ updatedAt: -1 })
      .limit(FETCH_LIMIT)
      .toArray(),
    db
      .collection("admin_staff_logs")
      .find({})
      .sort({ createdAt: -1 })
      .limit(FETCH_LIMIT)
      .toArray(),
    db
      .collection("tickets")
      .find({ "messages.senderType": "staff" })
      .sort({ updatedAt: -1 })
      .limit(80)
      .project({ subject: 1, ticketId: 1, userUid: 1, userId: 1, messages: 1, updatedAt: 1 })
      .toArray(),
  ]);

  const reviewerMap = await loadReviewerMap(
    db,
    reviewedUsers.map((user) => user.approval?.reviewedBy)
  );

  const items = [];

  for (const log of paymentEdits) items.push(mapPaymentEdit(log));
  for (const log of storedLogs) items.push(mapStoredStaffLog(log));

  for (const notification of notifications) {
    if (notification.createdBy) items.push(mapNotificationPublish(notification));
    if (notification.editedBy && notification.updatedAt) {
      const editedMs = toMs(notification.updatedAt);
      const createdMs = toMs(notification.createdAt);
      if (editedMs > createdMs + 1000) items.push(mapNotificationEdit(notification));
    }
  }

  for (const user of reviewedUsers) {
    const reviewer = reviewerMap.get(user.approval?.reviewedBy);
    items.push(mapUserApproval(user, reviewer));
  }

  for (const item of metaUpdates) items.push(mapMetaAccountUpdate(item));

  for (const ticket of tickets) {
    const messages = Array.isArray(ticket.messages) ? ticket.messages : [];
    messages.forEach((message, index) => {
      if (String(message.senderType || "").toLowerCase() !== "staff") return;
      items.push(mapTicketStaffReply(ticket, message, index));
    });
  }

  const deduped = new Map();
  for (const item of items) {
    if (!item.createdAt) continue;
    deduped.set(item.id, item);
  }

  return [...deduped.values()].sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));
}

export function filterAdminStaffLogs(items, { category = "all", query = "" } = {}) {
  const q = String(query || "").trim().toLowerCase();
  const cat = String(category || "all").toLowerCase();

  return items.filter((item) => {
    if (cat !== "all" && item.category !== cat) return false;
    if (!q) return true;

    const haystack = [
      item.title,
      item.description,
      item.actionLabel,
      item.staffName,
      item.staffEmail,
      item.staffRole,
      item.category,
      item.targetUserId,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  });
}

export function paginateAdminStaffLogs(items, { page = 1, limit = 15 } = {}) {
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 15));
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / safeLimit));
  const safePage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const start = (safePage - 1) * safeLimit;

  return {
    data: items.slice(start, start + safeLimit),
    pagination: {
      page: safePage,
      limit: safeLimit,
      totalItems,
      totalPages,
      hasPrev: safePage > 1,
      hasNext: safePage < totalPages,
    },
  };
}

export function countAdminStaffLogsByCategory(items) {
  const counts = {
    all: items.length,
    payment: 0,
    notification: 0,
    user: 0,
    meta: 0,
    support: 0,
  };

  for (const item of items) {
    if (counts[item.category] !== undefined) counts[item.category] += 1;
  }

  return counts;
}
