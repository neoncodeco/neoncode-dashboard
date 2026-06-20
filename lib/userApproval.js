export const USER_APPROVAL_STATUSES = {
  PENDING: "pending",
  ACTIVE: "active",
  REJECTED: "rejected",
  INACTIVE: "inactive",
};

export function getUserStatus(user) {
  const status = String(user?.status || "").toLowerCase();
  if (status) return status;
  return USER_APPROVAL_STATUSES.ACTIVE;
}

export function canUserAccessApp(user) {
  const role = String(user?.role || "user").toLowerCase();
  if (role === "admin" || role === "manager") return true;
  return getUserStatus(user) === USER_APPROVAL_STATUSES.ACTIVE;
}

export function buildApprovalMeta(existing = {}, reviewerId, note = "") {
  return {
    requestedAt: existing.requestedAt || new Date(),
    reviewedAt: new Date(),
    reviewedBy: reviewerId || null,
    reviewNote: String(note || "").trim(),
  };
}
