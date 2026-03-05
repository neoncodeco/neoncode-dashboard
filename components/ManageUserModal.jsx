"use client";

import { useState } from "react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";

const DEFAULT_PERMISSIONS = {
  projectsAccess: false,
  transactionsAccess: false,
  affiliateAccess: false,
  metaAdAccess: false,
};

const safeNum = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const tabs = ["Overview", "Affiliate", "Meta Ads", "Profile"];

export default function ManageUserModal({ user, onClose, onUpdated }) {
  const { token } = useFirebaseAuth();
  const [activeTab, setActiveTab] = useState("Overview");

  const [role, setRole] = useState(user.role || "user");
  const [status, setStatus] = useState(user.status || "active");
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [walletBalance, setWalletBalance] = useState(safeNum(user.walletBalance));
  const [topupBalance, setTopupBalance] = useState(safeNum(user.topupBalance));
  const [totalReferrers, setTotalReferrers] = useState(
    safeNum(user.referralStats?.totalReferrers)
  );
  const [totalReferIncome, setTotalReferIncome] = useState(
    safeNum(user.referralStats?.totalReferIncome)
  );
  const [totalPayout, setTotalPayout] = useState(
    safeNum(user.referralStats?.totalPayout)
  );
  const [level1DepositCount, setLevel1DepositCount] = useState(
    safeNum(user.level1DepositCount)
  );
  const [permissions, setPermissions] = useState({
    ...DEFAULT_PERMISSIONS,
    ...(user.permissions || {}),
  });
  const [usdRate, setUsdRate] = useState(safeNum(user.metaAdsConfig?.usdRate, 150));
  const [allowBudgetIncrease, setAllowBudgetIncrease] = useState(
    user.metaAdsConfig?.allowBudgetIncrease ?? true
  );
  const [allowTopupAction, setAllowTopupAction] = useState(
    user.metaAdsConfig?.allowTopupAction ?? true
  );
  const [remainingBudgetOverride, setRemainingBudgetOverride] = useState(
    user.metaAdsConfig?.remainingBudgetOverride ?? ""
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const togglePermission = (key) => {
    setPermissions((p) => ({ ...p, [key]: !p[key] }));
  };

  const submit = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/admin/users/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.userId,
          name,
          email,
          role,
          status,
          walletBalance: safeNum(walletBalance),
          topupBalance: safeNum(topupBalance),
          referralStats: {
            totalReferrers: safeNum(totalReferrers),
            totalReferIncome: safeNum(totalReferIncome),
            totalPayout: safeNum(totalPayout),
          },
          level1DepositCount: safeNum(level1DepositCount),
          metaAdsConfig: {
            usdRate: safeNum(usdRate, 150),
            allowBudgetIncrease: Boolean(allowBudgetIncrease),
            allowTopupAction: Boolean(allowTopupAction),
            remainingBudgetOverride:
              remainingBudgetOverride === "" ? null : safeNum(remainingBudgetOverride, 0),
          },
          permissions: role === "admin" ? DEFAULT_PERMISSIONS : permissions,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Update failed");

      onUpdated();
      onClose();
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Update failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-black text-gray-900">User Dashboard Mirror Editor</h2>
            <p className="text-xs text-gray-500 mt-1">UID: {user.userId}</p>
          </div>
          <button onClick={onClose} className="px-3 py-1.5 border rounded-lg text-sm">
            Close
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-bold border ${
                activeTab === tab ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Overview" && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-800">Overview Tab Values</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Wallet Balance (USD)" value={walletBalance} onChange={setWalletBalance} type="number" />
              <Field label="Topup Balance (USD)" value={topupBalance} onChange={setTopupBalance} type="number" />
              <Field label="Total Referrers" value={totalReferrers} onChange={setTotalReferrers} type="number" />
              <Field label="Refer Income (USD)" value={totalReferIncome} onChange={setTotalReferIncome} type="number" />
              <Field label="Total Payout (USD)" value={totalPayout} onChange={setTotalPayout} type="number" />
            </div>
          </div>
        )}

        {activeTab === "Affiliate" && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-800">Affiliate Tab Values</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Completed Referred Users (level1DepositCount)"
                value={level1DepositCount}
                onChange={setLevel1DepositCount}
                type="number"
              />
              <Field label="Total Referrers" value={totalReferrers} onChange={setTotalReferrers} type="number" />
              <Field label="Total Refer Income" value={totalReferIncome} onChange={setTotalReferIncome} type="number" />
              <Field label="Total Payout" value={totalPayout} onChange={setTotalPayout} type="number" />
            </div>
          </div>
        )}

        {activeTab === "Meta Ads" && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-800">Meta Ads Tab Values</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Wallet Balance (USD)"
                value={walletBalance}
                onChange={setWalletBalance}
                type="number"
              />
              <Field label="USD Rate" value={usdRate} onChange={setUsdRate} type="number" />
              <Field
                label="Top Up Balance (USD)"
                value={topupBalance}
                onChange={setTopupBalance}
                type="number"
              />
              <Field
                label="Remaining Budget Override (blank হলে auto হিসাব)"
                value={remainingBudgetOverride}
                onChange={setRemainingBudgetOverride}
                type="number"
              />
              <Toggle
                label="Allow Increase Budget Button"
                value={allowBudgetIncrease}
                onChange={() => setAllowBudgetIncrease((v) => !v)}
              />
              <Toggle
                label="Allow Top Up Button"
                value={allowTopupAction}
                onChange={() => setAllowTopupAction((v) => !v)}
              />
              <Toggle
                label="Meta Ads Access Permission"
                value={permissions.metaAdAccess}
                onChange={() => togglePermission("metaAdAccess")}
              />
            </div>
          </div>
        )}

        {activeTab === "Profile" && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-800">Profile / Access Values</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Name" value={name} onChange={setName} />
              <Field label="Email" value={email} onChange={setEmail} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-bold text-gray-500 mb-2">Role</p>
                <div className="flex gap-2">
                  {["admin", "manager", "user"].map((r) => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className={`px-3 py-2 rounded-lg text-sm border ${
                        role === r ? "border-black bg-black text-white" : "border-gray-300"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 mb-2">Status</p>
                <div className="flex gap-2">
                  {["active", "pending", "inactive"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={`px-3 py-2 rounded-lg text-sm border ${
                        status === s ? "border-black bg-black text-white" : "border-gray-300"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {role !== "admin" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Toggle
                  label="Projects Access"
                  value={permissions.projectsAccess}
                  onChange={() => togglePermission("projectsAccess")}
                />
                <Toggle
                  label="Transactions Access"
                  value={permissions.transactionsAccess}
                  onChange={() => togglePermission("transactionsAccess")}
                />
                <Toggle
                  label="Affiliate Access"
                  value={permissions.affiliateAccess}
                  onChange={() => togglePermission("affiliateAccess")}
                />
                <Toggle
                  label="Meta Ad Access"
                  value={permissions.metaAdAccess}
                  onChange={() => togglePermission("metaAdAccess")}
                />
              </div>
            )}
          </div>
        )}

        {message.text ? (
          <p className={`text-sm font-medium ${message.type === "error" ? "text-red-600" : "text-green-600"}`}>
            {message.text}
          </p>
        ) : null}

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="px-4 py-2 bg-black text-white rounded-lg disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save All Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="text-xs font-bold text-gray-500">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
      />
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between border rounded-xl px-3 py-2">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        onClick={onChange}
        className={`w-12 h-6 rounded-full relative transition ${value ? "bg-black" : "bg-gray-300"}`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition ${value ? "right-0.5" : "left-0.5"}`}
        />
      </button>
    </div>
  );
}
