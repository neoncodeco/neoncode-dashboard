"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Check,
  Copy,
  Sparkles,
} from "lucide-react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import CurrencyAmount from "@/components/CurrencyAmount";
import MetaSpendingOverview from "@/components/MetaSpendingOverview";
import { formatUsd, resolveUsdToBdtRate } from "@/lib/currency";
import MobileWalletCard from "@/components/MobileWalletCard";

const chartPalette = ["#99D85A", "#8ED868", "#73C8FF", "#45CF9B", "#A4E05F", "#67A3FF", "#7A8DF3"];

function StatCard({
  title,
  value,
  usdToBdtRate,
  actions,
  meta,
  variant = "default",
  logoSrc,
  profileImage,
}) {
  const accentClass =
    variant === "accent"
      ? "from-[rgba(183,223,105,0.24)] to-[rgba(183,223,105,0.08)]"
      : variant === "muted"
      ? "from-[rgba(255,255,255,0.05)] to-[rgba(255,255,255,0.02)]"
      : "from-[rgba(122,146,201,0.12)] to-[rgba(255,255,255,0.02)]";

  return (
    <div className={`dashboard-subpanel relative overflow-hidden rounded-[28px] bg-gradient-to-br ${accentClass} p-4 sm:p-5`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] dashboard-text-faint">
            {title}
          </p>
          {meta ? <p className="mt-1 text-[11px] font-semibold dashboard-text-muted">{meta}</p> : null}
        </div>
        <div className="flex items-center gap-1.5 opacity-80">
          <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-[var(--dashboard-frame-border)] bg-[var(--dashboard-panel-soft)]">
            {logoSrc ? <Image src={logoSrc} alt="Neon Code" width={18} height={18} className="h-[18px] w-[18px] object-contain" /> : null}
          </span>
          <span className="-ml-4 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-[var(--dashboard-frame-border)] bg-[var(--dashboard-panel-soft)]">
            {profileImage ? (
              <Image src={profileImage} alt="Profile" width={32} height={32} className="h-full w-full object-cover" />
            ) : (
              <span className="text-[10px] font-black dashboard-text-muted">NC</span>
            )}
          </span>
        </div>
      </div>
      <CurrencyAmount
        value={value}
        usdToBdtRate={usdToBdtRate}
        primaryClassName="mt-2 text-[2rem] font-black leading-none dashboard-text-strong"
        secondaryClassName="mt-1 text-[11px] font-semibold dashboard-text-muted"
      />

      {actions ? <div className="mt-5">{actions}</div> : null}
    </div>
  );
}

function StatusRow({ label, value, tone = "success" }) {
  const toneClass =
    tone === "warn"
      ? "bg-[var(--dashboard-warn-soft)] text-[#efb45d]"
      : tone === "danger"
      ? "bg-[var(--dashboard-danger-soft)] text-[#ff8b8b]"
      : "bg-[var(--dashboard-success-soft)] text-[var(--dashboard-accent)]";

  return (
    <div className="dashboard-subpanel flex items-center justify-between p-3">
      <div className="flex items-center gap-3">
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${toneClass}`}>
          <Sparkles size={16} />
        </span>
        <div>
          <p className="text-sm font-semibold dashboard-text-strong">{label}</p>
          <p className="text-xs dashboard-text-muted">{value}</p>
        </div>
      </div>
      <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${toneClass}`}>
        {tone === "warn" ? "Setup Required" : "Active"}
      </span>
    </div>
  );
}

// function MobileWalletCard({
//   userData,
//   usdToBdtRate,
//   totalPayout,
// }) {
//   return (
//     <div className="mx-auto w-full max-w-[320px] rounded-[30px] border border-[var(--dashboard-frame-border)] bg-[linear-gradient(180deg,var(--dashboard-frame-bg),var(--dashboard-panel-bg))] p-4 shadow-[var(--dashboard-phone-shadow)]">
//       <div className="dashboard-subpanel rounded-[24px] border border-[var(--dashboard-frame-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-5">
//         <p className="text-[11px] font-black uppercase tracking-[0.18em] dashboard-text-faint">
//           Current Balance
//         </p>
//         <CurrencyAmount
//           value={userData.walletBalance}
//           usdToBdtRate={usdToBdtRate}
//           primaryClassName="mt-2 text-[1.95rem] font-black leading-none dashboard-text-strong"
//           secondaryClassName="mt-1 text-[11px] font-semibold dashboard-text-muted"
//         />

//         <div className="mt-5 grid grid-cols-2 gap-4">
//           <div>
//             <p className="text-[10px] font-black uppercase tracking-[0.16em] dashboard-text-faint">
//               Topup
//             </p>
//             <p className="mt-1 text-[1rem] font-black leading-none dashboard-text-strong">
//               {formatUsd(Number(userData.topupBalance || 0))}
//             </p>
//           </div>
//           <div>
//             <p className="text-[10px] font-black uppercase tracking-[0.16em] dashboard-text-faint">
//               Payout
//             </p>
//             <p className="mt-1 text-[1rem] font-black leading-none dashboard-text-strong">
//               {formatUsd(totalPayout)}
//             </p>
//           </div>
//         </div>

//         <div className="mt-5 grid grid-cols-2 gap-2.5">
//           <Link
//             href="/user-dashboard/payment-methods"
//             className="dashboard-accent-surface rounded-2xl px-3 py-3 text-center text-sm font-bold"
//           >
//             Send Money
//           </Link>
//           <Link
//             href="/user-dashboard/payment-methods"
//             className="dashboard-muted-button rounded-2xl px-3 py-3 text-center text-sm font-bold"
//           >
//             Add Money
//           </Link>
//         </div>
//       </div>
//     </div>
//   );
// }

export default function OverviewPage() {
  const { userData, token } = useFirebaseAuth();
  const [copiedReferral, setCopiedReferral] = React.useState(false);
  const [topupHistory, setTopupHistory] = React.useState([]);
  const [lastTopupDate, setLastTopupDate] = React.useState("");

  React.useEffect(() => {
    if (!token) return;

    let active = true;

    const loadTopupHistory = async () => {
      try {
        const res = await fetch("/api/payment/payhistory", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const json = await res.json();
        if (!res.ok || !json?.ok || !active) return;

        const aggregated = (json.data || [])
          .filter((item) => item.status === "approved")
          .reduce((acc, item) => {
            const label = new Date(item.date).toLocaleDateString("en-GB", {
              weekday: "short",
            });
            acc[label] = (acc[label] || 0) + Number(item.amount || 0);
            return acc;
          }, {});

        const approvedItems = (json.data || [])
          .filter((item) => item.status === "approved" && item.date)
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        if (approvedItems[0]?.date) {
          setLastTopupDate(
            new Date(approvedItems[0].date).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          );
        }

        const historyData = Object.entries(aggregated)
          .slice(-7)
          .map(([name, value], index) => ({
            name,
            value,
            fill: chartPalette[index % chartPalette.length],
          }));

        setTopupHistory(historyData);
      } catch (error) {
        console.error("Failed to load topup history:", error);
      }
    };

    void loadTopupHistory();

    return () => {
      active = false;
    };
  }, [token]);

  if (!userData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-[var(--dashboard-accent)]" />
      </div>
    );
  }

  const stats = userData.referralStats || {};
  const usdToBdtRate = resolveUsdToBdtRate(userData?.currencyConfig?.usdToBdtRate);
  const appBaseUrl =
    typeof window !== "undefined" ? window.location.origin : "https://app.neoncode.co";
  const referralLink = `${appBaseUrl}/ref/${userData?.referralCode || ""}`;
  const totalPayout = Number(stats.totalPayout || 0);
  const totalReferrers = Number(stats.totalReferrers || 0);
  const totalReferIncome = Number(stats.totalReferIncome || 0);
  const totalTopup = Number(userData.topupBalance || 0);
  const totalWallet = Number(userData.walletBalance || 0);
  const profileId = userData?.referralCode || userData?.userId?.slice(-6) || "585D93";
  const chartData = [
    { name: "Wallet", value: totalWallet, fill: "#B7DF69" },
    { name: "Topup", value: totalTopup, fill: "#8ED868" },
    { name: "Affiliate", value: totalReferIncome, fill: "#73C8FF" },
    { name: "Payout", value: totalPayout, fill: "#67A3FF" },
  ];
  const mobileSummaryItems = [
    {
      label: "Referral Income",
      value: formatUsd(totalReferIncome),
      meta: `${totalReferrers} referrer${totalReferrers === 1 ? "" : "s"}`,
    },
    {
      label: "Last Topup",
      value: lastTopupDate || "No topup yet",
      meta: "Recent approved payment",
    },
  ];

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopiedReferral(true);
      window.setTimeout(() => setCopiedReferral(false), 2200);
    } catch (error) {
      console.error("Failed to copy referral link:", error);
    }
  };

  return (
    <div className="space-y-4 p-3 sm:p-4">
      <div className="lg:hidden">
        <section className="dashboard-subpanel overflow-hidden rounded-[24px] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] dashboard-text-faint">
                Overview
              </p>
              <h1 className="mt-1 text-[1.65rem] font-black leading-none dashboard-text-strong">
                {userData?.name || userData?.displayName || "Client"}
              </h1>
              <p className="mt-2 text-xs dashboard-text-muted">
                Wallet, payout, and activity in one compact view.
              </p>
            </div>
            <Link
              href="/user-dashboard/payment-methods"
              className="dashboard-accent-surface inline-flex min-h-11 items-center rounded-[16px] px-4 text-xs font-black"
            >
              Top Up
            </Link>
          </div>
        </section>

        <MobileWalletCard
          userData={userData}
          usdToBdtRate={usdToBdtRate}
          totalPayout={totalPayout}
        />
      </div>

      <section className="hidden lg:block">
        <div className="grid gap-4 lg:grid-cols-3">
          <StatCard
            title="Wallet Balance"
            value={userData.walletBalance}
            usdToBdtRate={usdToBdtRate}
            meta={`Client ID ${profileId}`}
            variant="accent"
            logoSrc="/Neon Studio icon.png"
            profileImage={userData?.photo || ""}
          />
          <StatCard
            title="Topup Balance"
            value={userData.topupBalance}
            usdToBdtRate={usdToBdtRate}
            meta={lastTopupDate ? `Last topup ${lastTopupDate}` : "Ready for ad spend and wallet load"}
            variant="muted"
            logoSrc="/Neon Studio icon.png"
            profileImage={userData?.photo || ""}
          />
          <StatCard
            title="Total Payout"
            value={totalPayout}
            usdToBdtRate={usdToBdtRate}
            meta="Payout and transfer actions"
            logoSrc="/Neon Studio icon.png"
            profileImage={userData?.photo || ""}
            actions={
              <div className="grid gap-2 sm:grid-cols-3">
                <Link
                  href="/user-dashboard/payment-methods"
                  className="dashboard-accent-surface rounded-2xl px-4 py-3 text-center text-sm font-bold"
                >
                  Send Money
                </Link>
                <Link
                  href="/user-dashboard/payment-methods"
                  className="dashboard-muted-button rounded-2xl px-4 py-3 text-center text-sm font-bold"
                >
                  Add Money
                </Link>
                <Link
                  href="/user-dashboard/history"
                  className="dashboard-muted-button rounded-2xl px-4 py-3 text-center text-sm font-bold"
                >
                  Withdraw
                </Link>
              </div>
            }
          />
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-3 md:mb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[1.65rem] font-semibold tracking-tight dashboard-text-strong">
              Activity Analytics
            </h2>
            <p className="mt-1 text-sm dashboard-text-muted">
              Wallet, topup and affiliate performance overview.
            </p>
          </div>

          <div className="hidden flex-wrap items-center gap-2 sm:flex">
            <button type="button" className="dashboard-accent-surface rounded-2xl px-4 py-2 text-sm font-bold">
              Weekly
            </button>
            <button type="button" className="dashboard-muted-button rounded-2xl px-4 py-2 text-sm font-bold">
              Monthly
            </button>
            <button
              type="button"
              onClick={copyReferralLink}
              className="dashboard-accent-surface inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold"
            >
              {copiedReferral ? <Check size={16} /> : <Copy size={16} />}
              {copiedReferral ? "Copied" : "Copy Link"}
            </button>
          </div>
        </div>

        <div className="dashboard-analytics-grid h-[250px] rounded-[22px] bg-[var(--dashboard-panel-soft)] p-3 sm:h-[320px] sm:p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 6, left: -16, bottom: 4 }}>
              <CartesianGrid vertical={false} strokeDasharray="4 7" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "var(--dashboard-text-muted)", fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--dashboard-text-muted)", fontSize: 11 }} />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
                formatter={(value) => [formatUsd(Number(value || 0)), "Amount"]}
              />
              <Bar dataKey="value" radius={[10, 10, 4, 4]} barSize={34}>
                {chartData.map((entry, index) => (
                  <Cell key={`${entry.name}-${index}`} fill={entry.fill || chartPalette[index % chartPalette.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <MetaSpendingOverview className="mt-4" />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="dashboard-subpanel p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-[1.3rem] font-semibold tracking-tight dashboard-text-strong">
                Earn with Invites
              </h3>
              <p className="text-sm dashboard-text-muted">
                Your payout-ready earning channels.
              </p>
            </div>
            <button type="button" className="dashboard-accent-surface rounded-2xl px-4 py-2 text-sm font-bold">
              Invite
            </button>
          </div>

          <div className="space-y-3">
            <StatusRow label="bKash Payout" value="Available for payout requests" />
            <StatusRow label="Nagad Payout" value="Complete setup to receive transfers" tone="warn" />
          </div>
        </section>

        <section className="dashboard-subpanel flex flex-col justify-between p-4 sm:p-5">
          <div className="mb-6 flex items-center gap-3">
            <span className="dashboard-accent-surface inline-flex h-12 w-12 items-center justify-center rounded-2xl">
              <Image
                src="/neon-code-logo.jpg"
                alt="Neon Code logo"
                width={26}
                height={26}
                className="h-[26px] w-[26px] object-contain"
              />
            </span>
            <div>
              <h3 className="text-[1.3rem] font-semibold tracking-tight dashboard-text-strong">
                Account Status
              </h3>
              <p className="text-sm dashboard-text-muted">
                Securely monitored by Neon Code Guard.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="dashboard-subpanel p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] dashboard-text-faint">
                Last Updated
              </p>
              <p className="mt-2 text-xl font-black dashboard-text-strong">
                {new Date(userData.updatedAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })}
              </p>
            </div>
            <div className="dashboard-subpanel p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] dashboard-text-faint">
                Member Since
              </p>
              <p className="mt-2 text-xl font-black dashboard-text-strong">
                {new Date(userData.createdAt).toLocaleDateString("en-GB", {
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
