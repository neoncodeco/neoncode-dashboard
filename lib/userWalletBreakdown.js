export async function listUserWalletRemainingBreakdown(db) {
  const users = await db
    .collection("users")
    .find(
      {
        role: { $not: { $regex: /^admin$/i } },
        walletBalance: { $gt: 0 },
      },
      {
        projection: {
          userId: 1,
          name: 1,
          email: 1,
          walletBalance: 1,
          topupBalance: 1,
        },
      }
    )
    .sort({ walletBalance: -1 })
    .limit(100)
    .toArray();

  const accounts = users.map((user) => ({
    userId: user.userId,
    name: String(user.name || "").trim() || String(user.email || "").split("@")[0] || "User",
    email: String(user.email || "").trim(),
    remaining: Math.round(Number(user.walletBalance || 0) * 100) / 100,
    topup: Math.round(Number(user.topupBalance || 0) * 100) / 100,
  }));

  const totalRemaining = Math.round(
    accounts.reduce((sum, item) => sum + item.remaining, 0) * 100
  ) / 100;

  return {
    totalRemaining,
    accountCount: accounts.length,
    accounts,
  };
}
