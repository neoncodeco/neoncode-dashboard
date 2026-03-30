export const supportDepartments = [
  {
    id: "priority_support",
    name: "Priority Support",
    description: "Urgent product, dashboard, payment, or account issues that need a fast admin review.",
    accentClass: "from-[#8ab4ff]/18 via-[#8ab4ff]/10 to-transparent",
    badgeClass: "bg-[#8ab4ff]/12 text-[#b8d2ff]",
  },
  {
    id: "billing_payments",
    name: "Billing & Payments",
    description: "Wallet balance, manual payment, top-up, transaction mismatch, or payout related questions.",
    accentClass: "from-[#45cf9b]/18 via-[#45cf9b]/10 to-transparent",
    badgeClass: "bg-[#45cf9b]/12 text-[#8ce3bf]",
  },
  {
    id: "meta_ads",
    name: "Meta Ads Accounts",
    description: "Spend cap, account sync, budget increase, top-up, or Meta ad account access issues.",
    accentClass: "from-[#9bcf5a]/18 via-[#9bcf5a]/10 to-transparent",
    badgeClass: "bg-[#9bcf5a]/12 text-[#d8efb5]",
  },
  {
    id: "technical_help",
    name: "Technical Help",
    description: "Dashboard bugs, loading problems, broken pages, screenshots, and general troubleshooting.",
    accentClass: "from-[#f5b36c]/18 via-[#f5b36c]/10 to-transparent",
    badgeClass: "bg-[#f5b36c]/12 text-[#ffd7aa]",
  },
  {
    id: "general_sales",
    name: "General & Sales",
    description: "Service inquiry, pre-sales questions, setup guidance, or anything that does not fit another team.",
    accentClass: "from-[#b68cff]/18 via-[#b68cff]/10 to-transparent",
    badgeClass: "bg-[#b68cff]/12 text-[#dbc9ff]",
  },
];

export const supportPriorityOptions = ["Low", "Medium", "High"];

export const getSupportDepartmentById = (departmentId) =>
  supportDepartments.find((department) => department.id === departmentId) ?? supportDepartments[0];
