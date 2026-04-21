export const userDashboardRoutes = Object.freeze({
  root: "/user-dashboard",
  dashboard: "/user-dashboard/dashboard",
  services: "/user-dashboard/services",
  adAccounts: "/user-dashboard/ad-accounts",
  billing: "/user-dashboard/billing",
  billingCancel: "/user-dashboard/billing/cancel",
  support: "/user-dashboard/support",
  supportNew: "/user-dashboard/support/new",
  activity: "/user-dashboard/activity",
  referrals: "/user-dashboard/referrals",
  account: "/user-dashboard/account",
  accountChat: "/user-dashboard/account?panel=chat",
});

export const legacyUserDashboardRoutes = Object.freeze({
  dashboard: "/user-dashboard/overview",
  adAccounts: "/user-dashboard/meta-ads-account",
  billing: "/user-dashboard/payment-methods",
  billingCancel: "/user-dashboard/payment-methods/cancel",
  supportNew: "/user-dashboard/support/create",
  activity: "/user-dashboard/history",
  referrals: "/user-dashboard/affiliate",
  account: "/user-dashboard/profile",
});

export const userDashboardLegacyRedirects = [
  { source: legacyUserDashboardRoutes.dashboard, destination: userDashboardRoutes.dashboard },
  { source: legacyUserDashboardRoutes.adAccounts, destination: userDashboardRoutes.adAccounts },
  { source: legacyUserDashboardRoutes.billing, destination: userDashboardRoutes.billing },
  { source: legacyUserDashboardRoutes.billingCancel, destination: userDashboardRoutes.billingCancel },
  { source: legacyUserDashboardRoutes.supportNew, destination: userDashboardRoutes.supportNew },
  { source: legacyUserDashboardRoutes.activity, destination: userDashboardRoutes.activity },
  { source: legacyUserDashboardRoutes.referrals, destination: userDashboardRoutes.referrals },
  { source: legacyUserDashboardRoutes.account, destination: userDashboardRoutes.account },
];

export const userDashboardCanonicalRewrites = userDashboardLegacyRedirects.map(({ source, destination }) => ({
  source: destination,
  destination: source,
}));
