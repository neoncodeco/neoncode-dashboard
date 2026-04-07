const normalizeAdAccountId = (value) => String(value || "").replace(/^act_/, "").trim();

const buildCandidateMetaIds = (adAccountId) => {
  const cleanId = normalizeAdAccountId(adAccountId);
  if (!cleanId) return [];
  return [cleanId, `act_${cleanId}`];
};

const findBmConfigByBusinessId = (bmConfigs, businessId) => {
  const normalizedBusinessId = String(businessId || "").trim();
  if (!normalizedBusinessId) return null;

  return (
    bmConfigs.find((bm) => String(bm?.businessId || "").trim() === normalizedBusinessId) || null
  );
};

const findBmConfigBySlot = (bmConfigs, candidateMetaIds) => {
  if (!candidateMetaIds.length) return null;

  return (
    bmConfigs.find(
      (bm) =>
        Array.isArray(bm?.slots) &&
        bm.slots.some((slot) => candidateMetaIds.includes(String(slot?.metaId || "").trim()))
    ) || null
  );
};

const pushUniqueToken = (target, token, source) => {
  const cleanToken = String(token || "").trim();
  if (!cleanToken) return;
  if (target.some((entry) => entry.token === cleanToken)) return;
  target.push({ token: cleanToken, source });
};

export async function resolveMetaAccessTokens(db, adAccountId) {
  const candidateMetaIds = buildCandidateMetaIds(adAccountId);
  const cleanAdAccountId = normalizeAdAccountId(adAccountId);

  const [settings, requestDoc] = await Promise.all([
    db.collection("settings").find({ key: { $in: ["FB_BM_CONFIGS", "FB_SYS_TOKEN"] } }).toArray(),
    candidateMetaIds.length
      ? db.collection("adAccountRequests").findOne(
          { MetaAccountID: { $in: candidateMetaIds } },
          { sort: { updatedAt: -1, createdAt: -1 } }
        )
      : null,
  ]);

  const bmConfigs =
    settings.find((item) => item.key === "FB_BM_CONFIGS")?.value?.filter(Boolean) || [];
  const systemToken = settings.find((item) => item.key === "FB_SYS_TOKEN")?.value || "";

  const tokens = [];

  const mappedBm = findBmConfigByBusinessId(bmConfigs, requestDoc?.bmId);
  if (mappedBm?.token) {
    pushUniqueToken(tokens, mappedBm.token, `bm:${mappedBm.businessId}`);
  }

  const slotBm = findBmConfigBySlot(bmConfigs, candidateMetaIds);
  if (slotBm?.token) {
    pushUniqueToken(tokens, slotBm.token, `slot:${slotBm.businessId}`);
  }

  pushUniqueToken(tokens, systemToken, "system");

  bmConfigs.forEach((bm) => {
    pushUniqueToken(tokens, bm?.token, `bm:${bm?.businessId || "unknown"}`);
  });

  return {
    cleanAdAccountId,
    requestDoc,
    tokens,
  };
}

export { normalizeAdAccountId };
