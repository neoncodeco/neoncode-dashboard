export const supportDepartments = [
  {
    id: "priority_support",
    name: "Priority Support",
    description: "Urgent product, dashboard, payment, or account issues that need a fast admin review.",
    accentClass: "from-[#8ab4ff]/32 via-[#8ab4ff]/18 to-transparent",
    badgeClass: "bg-[#8ab4ff]/22 text-[#7aa8ff]",
  },
  {
    id: "billing_payments",
    name: "Billing & Payments",
    description: "Wallet balance, manual payment, top-up, transaction mismatch, or payout related questions.",
    accentClass: "from-[#45cf9b]/32 via-[#45cf9b]/18 to-transparent",
    badgeClass: "bg-[#45cf9b]/22 text-[#38a878]",
  },
  {
    id: "meta_ads",
    name: "Ad Accounts",
    description: "Spend cap, account sync, budget increase, top-up, or Meta ad account access issues.",
    accentClass: "from-[#9bcf5a]/34 via-[#9bcf5a]/20 to-transparent",
    badgeClass: "bg-[#9bcf5a]/24 text-[#6f9b35]",
  },
  {
    id: "technical_help",
    name: "Technical Help",
    description: "Dashboard bugs, loading problems, broken pages, screenshots, and general troubleshooting.",
    accentClass: "from-[#f5b36c]/34 via-[#f5b36c]/18 to-transparent",
    badgeClass: "bg-[#f5b36c]/22 text-[#c47a2b]",
  },
  {
    id: "general_sales",
    name: "General & Sales",
    description: "Service inquiry, pre-sales questions, setup guidance, or anything that does not fit another team.",
    accentClass: "from-[#b68cff]/32 via-[#b68cff]/18 to-transparent",
    badgeClass: "bg-[#b68cff]/22 text-[#8a60da]",
  },
];

export const supportPriorityOptions = ["Low", "Medium", "High"];

export const getSupportDepartmentById = (departmentId) =>
  supportDepartments.find((department) => department.id === departmentId) ?? supportDepartments[0];
