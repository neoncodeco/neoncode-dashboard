const normalizeText = (value) => String(value || "").trim();

export const normalizeAssignedAccounts = (accounts, fallback = {}) => {
  if (!Array.isArray(accounts)) return [];

  const parentStatus = normalizeText(fallback.status || "").toLowerCase();

  return accounts
    .map((item, index) => {
      const merged = item || {};
      // Parent doc is approved as active but legacy rows still have status "pending" on each slot;
      // those slots must not override the parent — otherwise user UI treats the account as not fetchable.
      const resolvedStatus =
        parentStatus === "active"
          ? "active"
          : normalizeText(merged.status || fallback.status || "pending") || "pending";

      const fromMerged = Number(merged.usdToBdtRate);
      const fromFallback = Number(fallback.usdToBdtRate);
      // Parent document rate (admin panel) must win over slot values so saves and BDT hints stay in sync.
      const usdToBdtRate =
        Number.isFinite(fromFallback) && fromFallback > 0
          ? fromFallback
          : Number.isFinite(fromMerged) && fromMerged > 0
            ? fromMerged
            : 0;

      return {
        accountName: normalizeText(merged.accountName || fallback.accountName || `Ad Account ${index + 1}`),
        bmId: normalizeText(merged.bmId || fallback.bmId),
        monthlyBudget: Number(merged.monthlyBudget ?? fallback.monthlyBudget ?? 0),
        userUid: normalizeText(merged.userUid || fallback.userUid),
        userEmail: normalizeText(merged.userEmail || fallback.userEmail),
        MetaAccountID: normalizeText(merged.MetaAccountID || fallback.MetaAccountID),
        status: resolvedStatus,
        timezone: normalizeText(merged.timezone || fallback.timezone || "BST") || "BST",
        facebookPage: normalizeText(merged.facebookPage || fallback.facebookPage),
        email: normalizeText(merged.email || fallback.email),
        startDate: normalizeText(merged.startDate || fallback.startDate),
        usdToBdtRate,
      };
    })
    .filter((item) => item.accountName || item.bmId || item.MetaAccountID || item.userUid || item.userEmail);
};

export const expandAdAccountRequests = (requests = []) => {
  const safeRequests = Array.isArray(requests) ? requests : [];

  return safeRequests.flatMap((request) => {
    if (request?.parentRequestId) {
      return [request];
    }

    const assignedAccounts = normalizeAssignedAccounts(request?.assignedAccounts, request);
    const sourceAccounts = assignedAccounts.length > 0 ? assignedAccounts : [request];

    return sourceAccounts.map((account, index) => ({
      ...request,
      ...account,
      parentRequestId: request?._id,
      parentStatus: request?.status || "pending",
      requestIndex: index,
      isExpandedAccount: true,
      bundleSize: assignedAccounts.length,
      bundleLead: index === 0,
      assignedAccounts: index === 0 ? assignedAccounts : [],
    }));
  });
};
