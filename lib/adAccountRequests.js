const normalizeText = (value) => String(value || "").trim();

export const normalizeAssignedAccounts = (accounts, fallback = {}) => {
  if (!Array.isArray(accounts)) return [];

  return accounts
    .map((item, index) => {
      const merged = item || {};
      return {
        accountName: normalizeText(merged.accountName || fallback.accountName || `Ad Account ${index + 1}`),
        bmId: normalizeText(merged.bmId || fallback.bmId),
        monthlyBudget: Number(merged.monthlyBudget ?? fallback.monthlyBudget ?? 0),
        userUid: normalizeText(merged.userUid || fallback.userUid),
        userEmail: normalizeText(merged.userEmail || fallback.userEmail),
        MetaAccountID: normalizeText(merged.MetaAccountID || fallback.MetaAccountID),
        status: normalizeText(merged.status || fallback.status || "pending") || "pending",
        timezone: normalizeText(merged.timezone || fallback.timezone || "BST") || "BST",
        facebookPage: normalizeText(merged.facebookPage || fallback.facebookPage),
        email: normalizeText(merged.email || fallback.email),
        startDate: normalizeText(merged.startDate || fallback.startDate),
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
