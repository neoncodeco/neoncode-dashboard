const STATUS_LABELS = {
  approved: "Approved",
  active: "Approved",
  success: "Successful",
  completed: "Completed",
  failed: "Failed",
  blocked: "Blocked",
  inactive: "Restricted",
  rejected: "Rejected",
  cancelled: "Cancelled",
  canceled: "Cancelled",
  pending: "Pending",
  open: "Open",
  resolved: "Resolved",
  answered: "Answered",
  closed: "Closed",
  deleted: "Deleted",
};

export function formatStatusLabel(status) {
  const normalized = String(status || "").trim().toLowerCase();
  return STATUS_LABELS[normalized] || (normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : "Unknown");
}

export function formatPaymentMethod(method) {
  const normalized = String(method || "").trim().toLowerCase();
  if (normalized === "bank_transfer") return "Bank Transfer";
  if (normalized === "uddoktapay") return "UddoktaPay";
  if (normalized === "online") return "Online Payment";
  if (normalized === "manual") return "Manual Review";
  if (normalized === "unknown" || !normalized) return "Not Specified";

  return normalized
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatAuthProvider(provider) {
  const normalized = String(provider || "").trim().toLowerCase();
  if (normalized === "google") return "Google";
  if (normalized === "credentials") return "Email and Password";
  if (!normalized) return "Standard";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function formatPaymentDescription(method) {
  const normalized = String(method || "").trim().toLowerCase();
  if (normalized === "bank_transfer") return "Bank Transfer Payment";
  if (normalized === "uddoktapay") return "UddoktaPay Payment";
  return "Online Payment";
}
