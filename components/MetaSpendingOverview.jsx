"use client";

import React from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Building2, TrendingUp } from "lucide-react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import { formatUsd, toSafeNumber } from "@/lib/currency";

const normalizeAdAccountId = (value) => String(value || "").replace(/^act_/, "").trim();

const isFetchableMetaAccount = (account) => {
  const status = String(account?.status || "").toLowerCase();
  const cleanId = normalizeAdAccountId(account?.MetaAccountID);
  return status === "active" && /^\d{8,}$/.test(cleanId);
};

const formatChartUsd = (value) => {
  const amount = toSafeNumber(value);

  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
  if (amount >= 100) return `$${Math.round(amount)}`;
  if (amount >= 1) return `$${amount.toFixed(2)}`;
  return `$${amount.toFixed(2)}`;
};

const formatAccountLabel = (value) => {
  const label = String(value || "").trim();
  return label.length > 14 ? `${label.slice(0, 14)}...` : label;
};

export default function MetaSpendingOverview({ className = "" }) {
  const gradientId = React.useId().replace(/:/g, "");
  const { token } = useFirebaseAuth();
  const [performanceData, setPerformanceData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const chartData = React.useMemo(
    () =>
      [...performanceData]
        .sort((a, b) => b.spend - a.spend)
        .map((item) => ({
          ...item,
          shortName: formatAccountLabel(item.name),
        })),
    [performanceData]
  );

  const maxSpend = React.useMemo(
    () => chartData.reduce((max, item) => Math.max(max, toSafeNumber(item.spend)), 0),
    [chartData]
  );

  React.useEffect(() => {
    if (!token) return;

    let active = true;

    const loadData = async () => {
      try {
        const res = await fetch("/api/ads-request/list", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const json = await res.json();
        if (!res.ok || !json?.ok || !active) return;

        const accounts = Array.isArray(json.data) ? json.data.filter(isFetchableMetaAccount) : [];
        const nextData = await Promise.all(
          accounts.map(async (account) => {
            const cleanAdId = normalizeAdAccountId(account.MetaAccountID);

            try {
              const balanceRes = await fetch(`/api/ads-request/balance?ad_account_id=${cleanAdId}`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store",
              });
              const balanceJson = await balanceRes.json();
              if (!balanceRes.ok) return null;

              return {
                name: account.accountName || String(account.MetaAccountID || "").slice(-5),
                spend: toSafeNumber(balanceJson.amountSpent),
              };
            } catch {
              return null;
            }
          })
        );

        if (!active) return;
        setPerformanceData(nextData.filter(Boolean));
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadData();

    return () => {
      active = false;
    };
  }, [token]);

  return (
    <section className={`dashboard-subpanel relative overflow-hidden rounded-[24px] p-4 sm:p-5 ${className}`.trim()}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
        <span className="dashboard-subpanel inline-flex h-11 w-11 items-center justify-center rounded-2xl">
          <TrendingUp size={18} className="dashboard-text-muted" />
        </span>
        <div>
          <h3 className="dashboard-text-strong text-lg font-black">Spending Overview</h3>
          <p className="dashboard-text-muted text-xs">Live spend tracking across synced accounts</p>
        </div>
        </div>
        {!loading && performanceData.length > 0 ? (
          <div className="dashboard-chip shrink-0 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em]">
            {performanceData.length} Active Accounts
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="dashboard-subpanel flex h-[240px] items-center justify-center rounded-[20px] dashboard-text-muted">
          Loading spending data...
        </div>
      ) : chartData.length > 0 ? (
        <div className="dashboard-analytics-grid h-[280px] rounded-[20px] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] px-3 pb-3 pt-1 sm:px-4 sm:pb-4 sm:pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 10, bottom: 2 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8ab4ff" stopOpacity={0.38} />
                  <stop offset="95%" stopColor="#8ab4ff" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="rgba(122, 146, 201, 0.28)" />
              <XAxis
                dataKey="shortName"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--dashboard-text-muted)", fontSize: 11, fontWeight: 700 }}
                dy={10}
              />
              <YAxis
                width={72}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--dashboard-text-muted)", fontSize: 11 }}
                domain={[0, Math.max(maxSpend, 1)]}
                tickFormatter={formatChartUsd}
              />
              <Tooltip
                formatter={(value) => [formatUsd(Number(value || 0)), "Spend"]}
                labelFormatter={(label, payload) => payload?.[0]?.payload?.name || label}
                contentStyle={{
                  borderRadius: "16px",
                  border: "1px solid rgba(138,180,255,0.22)",
                  background: "rgba(10,18,35,0.94)",
                  color: "#dbe8ff",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
                }}
                itemStyle={{ color: "#dbe8ff" }}
                labelStyle={{ color: "#8ea5cf", fontWeight: 700 }}
              />
              <Area
                type="monotone"
                dataKey="spend"
                stroke="#8ab4ff"
                strokeWidth={3}
                fillOpacity={1}
                fill={`url(#${gradientId})`}
                animationDuration={900}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="dashboard-subpanel flex h-[240px] flex-col items-center justify-center rounded-[20px] text-center">
          <Building2 size={30} className="dashboard-text-faint" />
          <p className="dashboard-text-strong mt-4 font-bold">No synced performance data yet</p>
          <p className="dashboard-text-muted mt-2 max-w-xs text-sm">
            Once an account is active with a valid Meta account ID, its live spend data will appear here.
          </p>
        </div>
      )}
    </section>
  );
}
