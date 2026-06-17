import {
  BriefcaseBusiness,
  CreditCard,
  Headset,
  History,
  LayoutDashboard,
  LifeBuoy,
  Share2,
  UserRound,
  WalletCards,
} from "lucide-react";
import { AFFILIATE_UI_ENABLED } from "@/lib/featureFlags";
import { userDashboardRoutes } from "@/lib/userDashboardRoutes";

const referralsNavItem = {
  name: "Referrals",
  icon: Share2,
  href: userDashboardRoutes.referrals,
  keywords: ["referral", "referrals", "affiliate", "earnings", "commission"],
};

export const userDashboardMainNavItems = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    href: userDashboardRoutes.dashboard,
    keywords: ["dashboard", "overview", "home", "summary"],
  },
  {
    name: "Services",
    icon: BriefcaseBusiness,
    href: userDashboardRoutes.services,
    keywords: ["services", "solutions", "catalog", "discovery", "meeting"],
  },
  {
    name: "Ad Accounts",
    icon: WalletCards,
    href: userDashboardRoutes.adAccounts,
    keywords: ["ad accounts", "meta", "ads", "business manager", "budget"],
  },
  {
    name: "Billing",
    icon: CreditCard,
    href: userDashboardRoutes.billing,
    keywords: ["billing", "payment", "wallet", "top up", "topup", "add funds"],
  },
];

export const userDashboardAccountNavItems = [
  {
    name: "Support",
    icon: LifeBuoy,
    href: userDashboardRoutes.support,
    keywords: ["support", "ticket", "help", "issue"],
  },
  {
    name: "Activity",
    icon: History,
    href: userDashboardRoutes.activity,
    keywords: ["activity", "history", "logs", "payment history", "transactions"],
  },
  ...(AFFILIATE_UI_ENABLED ? [referralsNavItem] : []),
  {
    name: "Account",
    icon: UserRound,
    href: userDashboardRoutes.account,
    keywords: ["account", "profile", "settings", "verification", "live chat"],
  },
];

export const userDashboardMenuItems = [
  ...userDashboardMainNavItems,
  ...userDashboardAccountNavItems,
];

export const userDashboardPrimaryMobileItems = [...userDashboardMainNavItems];

export const userDashboardMoreMenuItems = [
  {
    name: "Activity",
    icon: History,
    href: userDashboardRoutes.activity,
  },
  {
    name: "Support",
    icon: LifeBuoy,
    href: userDashboardRoutes.support,
  },
  {
    name: "Live Chat",
    icon: Headset,
    href: userDashboardRoutes.accountChat,
  },
  ...(AFFILIATE_UI_ENABLED
    ? [
        {
          name: "Referrals",
          icon: Share2,
          href: userDashboardRoutes.referrals,
        },
      ]
    : []),
  {
    name: "Account",
    icon: UserRound,
    href: userDashboardRoutes.account,
  },
];
