"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import { Crown, Wallet, Image as ImageIcon, Video } from "lucide-react";
import CurrencyAmount from "@/components/CurrencyAmount";
import { convertBdtToUsd, formatBdt, resolveUsdToBdtRate } from "@/lib/currency";

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString();
};

export default function FreepikPremiumPage() {
  const { token } = useFirebaseAuth();
  const [loading, setLoading] = useState(true);
  const [buyingPlan, setBuyingPlan] = useState("");
  const [downloading, setDownloading] = useState(false);

  const [plans, setPlans] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [credits, setCredits] = useState(0);
  const [subscription, setSubscription] = useState(null);
  const [usdToBdtRate, setUsdToBdtRate] = useState(150);

  const [assetUrl, setAssetUrl] = useState("");
  const [assetType, setAssetType] = useState("image");

  const authHeaders = useMemo(
    () =>
      token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    [token]
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/freepik/plans", {
        headers: {
          ...authHeaders,
        },
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to load Freepik plans");
      }
      setPlans(json.plans || []);
      setWalletBalance(Number(json.walletBalance || 0));
      setCredits(Number(json.freepikCredits || 0));
      setSubscription(json.subscription || null);
      setUsdToBdtRate(resolveUsdToBdtRate(json.usdToBdtRate));
    } catch (error) {
      Swal.fire("Error", error.message || "Could not load data", "error");
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    loadData();
  }, [loadData, token]);

  const handleBuyPlan = async (planId) => {
    try {
      setBuyingPlan(planId);
      const res = await fetch("/api/freepik/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ planId }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Plan purchase failed");
      }

      setWalletBalance(Number(json.data?.walletBalance || 0));
      setCredits(Number(json.data?.freepikCredits || 0));
      setSubscription(json.data?.subscription || null);
      Swal.fire("Success", json.message || "Plan activated", "success");
    } catch (error) {
      Swal.fire("Error", error.message || "Plan purchase failed", "error");
    } finally {
      setBuyingPlan("");
    }
  };

  const handleDownload = async () => {
    try {
      if (!assetUrl.trim()) {
        return Swal.fire("Error", "Please enter a Freepik asset link", "error");
      }

      setDownloading(true);
      const res = await fetch("/api/freepik/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          assetUrl: assetUrl.trim(),
          assetType,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Download failed");
      }

      setCredits(Number(json.data?.remainingCredits || 0));
      if (json.data?.downloadUrl) {
        window.open(json.data.downloadUrl, "_blank", "noopener,noreferrer");
      }
      Swal.fire("Success", json.message || "Download started", "success");
    } catch (error) {
      Swal.fire("Error", error.message || "Download failed", "error");
    } finally {
      setDownloading(false);
    }
  };

  const rate = resolveUsdToBdtRate(usdToBdtRate);

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen text-gray-800 space-y-8">
      <div className="border-b pb-3">
        <h1 className="text-3xl font-extrabold text-blue-600">Freepik Premium</h1>
        <p className="text-gray-500 mt-1">Buy a plan from wallet and use credits for downloads.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Wallet size={16} />
            Wallet Balance
          </div>
          <CurrencyAmount
            value={walletBalance}
            usdToBdtRate={usdToBdtRate}
            primaryClassName="mt-2 text-2xl font-bold"
            secondaryClassName="mt-1 text-sm text-gray-500"
          />
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Crown size={16} />
            Freepik Credits
          </div>
          <p className="text-2xl font-bold mt-2">{credits}</p>
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <p className="text-sm text-gray-500">Current Plan</p>
          <p className="text-lg font-bold mt-2">{subscription?.planName || "No active plan"}</p>
          <p className="text-xs text-gray-500 mt-1">Expires: {formatDate(subscription?.expiresAt)}</p>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Choose Plan</h2>
        {loading ? (
          <p className="text-gray-500">Loading plans...</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {plans.map((plan) => {
              const planPriceUsd = convertBdtToUsd(plan.price, rate);

              return (
                <div key={plan.id} className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <span className="text-sm font-semibold text-blue-700">{plan.durationDays} days</span>
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-gray-900">{planPriceUsd > 0 ? `$${planPriceUsd.toFixed(2)}` : "$0.00"}</p>
                  <p className="mt-1 text-sm font-medium text-gray-500">{formatBdt(plan.price)}</p>
                </div>
                <p className="text-sm text-gray-500">{plan.description}</p>
                <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                  {(plan.features || []).map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <button
                  onClick={() => handleBuyPlan(plan.id)}
                  disabled={buyingPlan === plan.id}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 font-semibold disabled:opacity-60"
                >
                  {buyingPlan === plan.id ? "Buying..." : `Buy ${plan.name}`}
                </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-2xl font-bold">Download From Freepik Link</h2>
        <p className="text-sm text-gray-500">
          Credit cost: <span className="font-semibold">Image = 1</span>, <span className="font-semibold">Video = 2</span>
        </p>

        <input
          value={assetUrl}
          onChange={(e) => setAssetUrl(e.target.value)}
          type="url"
          placeholder="Paste Freepik image/video link"
          className="w-full rounded-lg border px-4 py-3"
        />

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setAssetType("image")}
            className={`px-4 py-2 rounded-lg border text-sm font-semibold flex items-center gap-2 ${
              assetType === "image" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700"
            }`}
          >
            <ImageIcon size={16} />
            Image (1 credit)
          </button>
          <button
            type="button"
            onClick={() => setAssetType("video")}
            className={`px-4 py-2 rounded-lg border text-sm font-semibold flex items-center gap-2 ${
              assetType === "video" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700"
            }`}
          >
            <Video size={16} />
            Video (2 credits)
          </button>
        </div>

        <button
          onClick={handleDownload}
          disabled={downloading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-6 py-2 font-semibold disabled:opacity-60"
        >
          {downloading ? "Processing..." : "Download Now"}
        </button>
      </section>
    </div>
  );
}
