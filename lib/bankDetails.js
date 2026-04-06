const DEFAULT_BANK_ENTRY = {
  id: "",
  bankName: "",
  logoUrl: "",
  accountName: "",
  accountNumber: "",
  branch: "",
  district: "",
  routingNumber: "",
  swiftCode: "",
  reference: "",
};

const pickColorPair = (text) => {
  const palettes = [
    ["#1d4ed8", "#60a5fa"],
    ["#0f766e", "#2dd4bf"],
    ["#7c3aed", "#a78bfa"],
    ["#b45309", "#f59e0b"],
    ["#be185d", "#f472b6"],
    ["#1f2937", "#64748b"],
  ];

  const seed = String(text || "")
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return palettes[seed % palettes.length];
};

export const createEmptyBankDetail = () => ({
  ...DEFAULT_BANK_ENTRY,
  id: `bank_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
});

export const createDefaultBankPaymentDetails = () => [
  {
    id: "eastern-bank-plc-ebl",
    bankName: "Eastern Bank PLC (EBL)",
    logoUrl: "",
    accountName: "Gorila Digital Bangladesh",
    accountNumber: "2001070004137",
    branch: "Khulna Branch",
    district: "Khulna",
    routingNumber: "095471549",
    swiftCode: "EBLDBDDH004",
    reference: "",
  },
];

export const normalizeBankPaymentDetails = (items = [], options = {}) => {
  const requireComplete = Boolean(options.requireComplete);

  return (Array.isArray(items) ? items : [])
    .map((item, index) => {
      const bankName = String(item?.bankName || "").trim();
      const logoUrl = String(item?.logoUrl || item?.logo || "").trim();
      const accountName = String(item?.accountName || "").trim();
      const accountNumber = String(item?.accountNumber || item?.accNumber || "").trim();
      const branch = String(item?.branch || "").trim();
      const district = String(item?.district || "").trim();
      const routingNumber = String(item?.routingNumber || item?.routingNo || "").trim();
      const swiftCode = String(item?.swiftCode || item?.swift || "").trim();
      const reference = String(item?.reference || item?.ref || "").trim();

      const hasAnyValue = [
        bankName,
        logoUrl,
        accountName,
        accountNumber,
        branch,
        district,
        routingNumber,
        swiftCode,
        reference,
      ].some(Boolean);

      if (!hasAnyValue) {
        return null;
      }

      if (requireComplete && (!bankName || !accountName || !accountNumber)) {
        return null;
      }

      return {
        id: String(item?.id || `bank_detail_${index + 1}`).trim(),
        bankName,
        logoUrl,
        accountName,
        accountNumber,
        branch,
        district,
        routingNumber,
        swiftCode,
        reference,
      };
    })
    .filter(Boolean);
};

export const getBankLogoDataUri = (bankName) => {
  const normalized = String(bankName || "").trim() || "Bank";
  const initials = normalized
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "BK";
  const [start, end] = pickColorPair(normalized);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <defs>
        <linearGradient id="g" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stop-color="${start}" />
          <stop offset="100%" stop-color="${end}" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#g)" />
      <text x="50%" y="54%" text-anchor="middle" font-size="24" font-family="Arial, sans-serif" font-weight="700" fill="white">${initials}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const getBankLogoSrc = (detail) =>
  String(detail?.logoUrl || "").trim() || getBankLogoDataUri(detail?.bankName);
