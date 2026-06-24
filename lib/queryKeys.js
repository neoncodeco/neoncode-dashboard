export const queryKeys = {
  admin: {
    stats: (range) => ["admin", "stats", range],
    users: () => ["admin", "users", "list"],
    transactions: () => ["admin", "transactions", "list"],
    metaAds: () => ["admin", "meta-ads", "list"],
    metaLogs: (page, limit) => ["admin", "meta-logs", page, limit],
    news: () => ["admin", "news", "list"],
    settings: () => ["admin", "settings"],
    paymentDetails: () => ["admin", "payment-details"],
    affiliates: () => ["admin", "affiliates"],
    activity: (params) => ["admin", "activity", params],
    staffLogs: (params) => ["admin", "staff-logs", params],
    availableAdAccounts: () => ["admin", "available-ad-accounts"],
    adAccountBalances: () => ["admin", "ad-account-balances"],
    userApprovals: (params) => ["admin", "user-approvals", params],
    dollarRates: (params) => ["admin", "dollar-rates", params],
  },
  user: {
    history: (params) => ["user", "history", params],
    insights: (userId) => ["admin", "user-insights", userId],
  },
};
