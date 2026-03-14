import { FREEPIK_PLANS } from "@/lib/freepikPlans";

const freepikSummary = FREEPIK_PLANS.map(
  (plan) => `${plan.name}: BDT ${plan.price}, ${plan.credits} credits, ${plan.durationDays} days`
).join(" | ");

const REPLY_RULES = [
  {
    keywords: ["hello", "hi", "hey", "assalamu", "salam"],
    replies: {
      en: "Hello. I am the Neon Code support assistant. I can help with Meta Ads account requests, payments, Freepik Premium, affiliate questions, and support tickets.",
      bn: "হ্যালো। আমি Neon Code সাপোর্ট অ্যাসিস্ট্যান্ট। আমি Meta Ads account, payment, Freepik Premium, affiliate আর support ticket নিয়ে সাহায্য করতে পারি।",
    },
  },
  {
    keywords: ["meta", "ads", "ad account", "business manager", "bm"],
    replies: {
      en: "For Meta Ads account requests, please use the 'Meta Ads Account' page in your dashboard. You can submit a new request there and track status from the dashboard.",
      bn: "Meta Ads account request করতে dashboard-এর 'Meta Ads Account' page ব্যবহার করুন। সেখান থেকে নতুন request submit করতে পারবেন এবং status dashboard থেকেই track করতে পারবেন।",
    },
  },
  {
    keywords: ["freepik", "credit", "download", "asset", "image", "video"],
    replies: {
      en: `Freepik Premium works with wallet balance and credits. Current plan summary: ${freepikSummary}. Image download costs 1 credit and video download costs 2 credits. You can paste a valid Freepik asset link in the dashboard and submit the download request.`,
      bn: `Freepik Premium wallet balance আর credit দিয়ে কাজ করে। Current plan summary: ${freepikSummary}. Image download-এ 1 credit আর video download-এ 2 credit লাগে। Dashboard-এ valid Freepik asset link paste করে download request দিতে পারবেন।`,
    },
  },
  {
    keywords: ["payment", "pay", "wallet", "balance", "deposit", "topup", "add money"],
    replies: {
      en: "The payment section supports two methods: UddoktaPay automatic gateway and Manual Bank Payment. When a payment is completed and verified, the wallet balance should update.",
      bn: "Payment section-এ দুইটা method আছে: UddoktaPay automatic gateway আর Manual Bank Payment। Payment complete আর verify হলে wallet balance update হওয়ার কথা।",
    },
  },
  {
    keywords: ["bank", "manual", "screenshot", "transaction"],
    replies: {
      en: "For Manual Bank Payment, you need to transfer funds and upload the transaction screenshot. The team reviews it before updating your balance.",
      bn: "Manual Bank Payment-এর জন্য bank transfer করে transaction screenshot upload করতে হবে। Team review করার পর balance update হবে।",
    },
  },
  {
    keywords: ["uddokta", "gateway", "automatic"],
    replies: {
      en: "UddoktaPay is the automatic payment gateway. If payment completes and verification succeeds, your balance should update automatically.",
      bn: "UddoktaPay হলো automatic payment gateway। Payment complete আর verification successful হলে balance automatically update হওয়ার কথা।",
    },
  },
  {
    keywords: ["history", "payment history", "transactions", "logs"],
    replies: {
      en: "You can review previous payments, statuses, and transaction details from the history or payment history section in your dashboard.",
      bn: "Dashboard-এর history বা payment history section থেকে previous payment, status আর transaction details দেখতে পারবেন।",
    },
  },
  {
    keywords: ["affiliate", "commission", "referral", "withdraw"],
    replies: {
      en: "The affiliate section shows referral performance and payout details. Withdraw requests are processed after approval.",
      bn: "Affiliate section-এ referral performance আর payout details দেখা যায়। Withdraw request approval-এর পর process হয়।",
    },
  },
  {
    keywords: ["support", "ticket", "problem", "issue", "help"],
    replies: {
      en: "If the issue is urgent, you can also create a support ticket from the Support section in your dashboard. Live chat messages can still be reviewed by the team.",
      bn: "Issue urgent হলে dashboard-এর Support section থেকে support ticket create করতে পারেন। Live chat-এর message-ও team review করতে পারবে।",
    },
  },
  {
    keywords: ["human", "agent", "admin", "real person", "team member"],
    replies: {
      en: "Understood. I will keep this as an open support conversation so the admin team can reply manually here.",
      bn: "বুঝেছি। আমি এটাকে open support conversation হিসেবেই রাখছি, যেন admin team এখানেই manual reply দিতে পারে।",
    },
  },
];

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function looksBanglish(normalized) {
  const markers = [
    "ami",
    "apni",
    "tumi",
    "bujhla",
    "lagbe",
    "korte",
    "korbo",
    "hobe",
    "ase",
    "ache",
    "valo",
    "bangla",
    "payment",
    "dashboard",
  ];

  return markers.reduce(
    (count, marker) => count + (normalized.includes(marker) ? 1 : 0),
    0
  ) >= 2;
}

export function resolveReplyLanguage(text, preferredLanguage = "auto") {
  if (preferredLanguage === "bn" || preferredLanguage === "en") {
    return preferredLanguage;
  }

  const raw = String(text || "");
  if (/[\u0980-\u09FF]/.test(raw)) {
    return "bn";
  }

  const normalized = normalizeText(raw);
  if (looksBanglish(normalized)) {
    return "bn";
  }

  return "en";
}

export function generateAutoReply(text, preferredLanguage = "auto") {
  const normalized = normalizeText(text);
  if (!normalized) return null;

  const language = resolveReplyLanguage(text, preferredLanguage);
  let bestMatch = null;

  for (const rule of REPLY_RULES) {
    const score = rule.keywords.reduce(
      (total, keyword) => total + (normalized.includes(keyword) ? 1 : 0),
      0
    );

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { score, reply: rule.replies[language] };
    }
  }

  if (bestMatch?.score > 0) {
    return bestMatch.reply;
  }

  if (language === "bn") {
    return "আমি আপনার request note করেছি। এটা account, payment, Freepik, affiliate বা support issue-এর মধ্যে হলে আরেকটু detail দিন। দরকার হলে admin team manual reply দেবে।";
  }

  return "I have noted your request. If this is about account access, payment, Freepik, affiliate, or another dashboard support issue, please share a bit more detail. The admin team can also reply manually if needed.";
}

export function getSupportSystemPrompt() {
  return `
You are Neon Code's support assistant inside the user dashboard live chat.

Business scope:
- Meta Ads account requests and status guidance
- Payment methods: UddoktaPay automatic gateway and Manual Bank Payment
- Wallet balance and payment verification guidance
- Freepik Premium plans, credits, and asset download guidance
- Affiliate and withdrawal guidance
- Support ticket and dashboard usage guidance

Rules:
- Answer only about Neon Code dashboard services and support flows.
- Do not invent policies, pricing, delivery time, or guarantees that are not in the provided context.
- If the question is outside site support scope, politely say you can help only with dashboard-related services and suggest contacting admin support.
- Keep answers concise, practical, and support-oriented.
- If user asks in Bangla or Banglish, answer in Bangla script.
- If preferred language is bn, answer in Bangla script.
- If preferred language is en, answer in English.
- If user asks something you are unsure about, say that a human admin will confirm the exact details.

Known service facts:
- Meta Ads requests are handled from the dashboard Meta Ads Account page.
- Payment methods available: UddoktaPay and Manual Bank Payment.
- Manual payment requires transaction proof upload and admin review.
- Freepik plans summary: ${freepikSummary}.
- Freepik image download costs 1 credit; video download costs 2 credits.
- Payment success should update wallet balance after verification.
- Users can create support tickets from the dashboard Support section.
`.trim();
}
