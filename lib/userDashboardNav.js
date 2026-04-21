import {
  BriefcaseBusiness,
  CreditCard,
  Crown,
  LifeBuoy,
  Share2,
  UserRound,
  WalletCards,
} from "lucide-react";

export const userDashboardMenuItems = [
  {
    name: "Our Services",
    icon: BriefcaseBusiness,
    href: "/user-dashboard/services",
    keywords: ["services", "discovery", "meeting", "booking"],
  },
  {
    name: "Meta Ads Account",
    icon: WalletCards,
    href: "/user-dashboard/meta-ads-account",
    keywords: ["meta", "ads", "account", "budget"],
  },
  // {
  //   name: "Freepik Premium",
  //   icon: Crown,
  //   href: "/user-dashboard/freepik-premium",
  //   keywords: ["freepik", "premium", "download"],
  // },
  {
    name: "Billing",
    icon: CreditCard,
    href: "/user-dashboard/payment-methods",
    keywords: ["payment", "wallet", "top up", "topup", "add money"],
  },
  {
    name: "Support Tickets",
    icon: LifeBuoy,
    href: "/user-dashboard/support",
    keywords: ["support", "ticket", "help"],
  },
  {
    name: "Profile",
    icon: UserRound,
    href: "/user-dashboard/profile",
    keywords: ["profile", "account", "settings", "history", "payment history", "live chat"],
  },
  {
    name: "Affiliate",
    icon: Share2,
    href: "/user-dashboard/affiliate",
    keywords: ["affiliate", "referral", "earnings"],
  },
];
