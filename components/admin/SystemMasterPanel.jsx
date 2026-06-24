"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Swal from "sweetalert2";
import {
  Activity,
  ArrowLeft,
  Building2,
  ChevronRight,
  ExternalLink,
  KeyRound,
  LayoutDashboard,
  LayoutGrid,
  Link2,
  Loader2,
  Megaphone,
  Plus,
  Save,
  Search,
  Server,
  Settings,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useApiQuery, useInvalidateApi } from "@/hooks/useApiQuery";
import { queryKeys } from "@/lib/queryKeys";
import useAppAuth from "@/hooks/useAppAuth";
import { expandAdAccountRequests } from "@/lib/adAccountRequests";
import { SectionCard, statusPill } from "@/components/admin/userDetailShared";
import { formatStatusLabel } from "@/lib/displayFormatters";

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f43f5e"];

const BM_DETAIL_TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "configuration", label: "Configuration", icon: Settings },
  { id: "slots", label: "Ad Slots", icon: LayoutGrid },
  { id: "users", label: "Linked Users", icon: Users },
];

const SWAL_PRIMARY = { confirmButtonColor: "#2563eb", cancelButtonColor: "#6b7280" };
const SWAL_DANGER = { confirmButtonColor: "#dc2626", cancelButtonColor: "#6b7280" };

function bmDisplayName(bm, index) {
  return bm?.bmName?.trim() || `BM ${index + 1}`;
}

function findBmForMetaId(bmConfigs, metaId) {
  const normalized = String(metaId || "").trim();
  if (!normalized) return null;

  for (let index = 0; index < bmConfigs.length; index += 1) {
    const bm = bmConfigs[index];
    const hasSlot = (bm.slots || []).some((slot) => String(slot?.metaId || "").trim() === normalized);
    if (hasSlot) {
      return { index, name: bmDisplayName(bm, index), businessId: bm.businessId || "" };
    }
  }
  return null;
}

function dedupeClients(clients) {
  const seen = new Set();
  return clients.filter((client) => {
    const key = client.userUid || client.userEmail || client.id;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function searchAdAccounts(query, bmConfigs, clientRequests) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const expanded = expandAdAccountRequests(clientRequests);
  const results = new Map();

  const ensureResult = (metaId, accountName = "") => {
    const key = metaId || `name:${accountName.toLowerCase()}`;
    if (!results.has(key)) {
      results.set(key, {
        metaId: metaId || "",
        accountName: accountName || "",
        clients: [],
        bm: metaId ? findBmForMetaId(bmConfigs, metaId) : null,
      });
    }
    return results.get(key);
  };

  expanded.forEach((client) => {
    const metaId = String(client.MetaAccountID || "").trim();
    const accountName = String(client.accountName || "").trim();
    if (!metaId && !accountName) return;

    const matchesMeta = metaId.toLowerCase().includes(q);
    const matchesName = accountName.toLowerCase().includes(q);
    if (!matchesMeta && !matchesName) return;

    const entry = ensureResult(metaId, accountName || client.accountName || "");
    if (accountName && !entry.accountName) entry.accountName = accountName;
    entry.clients.push(client);
    if (metaId && !entry.bm) entry.bm = findBmForMetaId(bmConfigs, metaId);
  });

  bmConfigs.forEach((bm, index) => {
    (bm.slots || []).forEach((slot) => {
      const metaId = String(slot?.metaId || "").trim();
      if (!metaId || !metaId.toLowerCase().includes(q)) return;
      const entry = ensureResult(metaId);
      if (!entry.bm) {
        entry.bm = { index, name: bmDisplayName(bm, index), businessId: bm.businessId || "" };
      }
    });
  });

  return Array.from(results.values())
    .map((item) => ({ ...item, clients: dedupeClients(item.clients) }))
    .sort((a, b) => {
      const aUsers = a.clients.length;
      const bUsers = b.clients.length;
      if (aUsers !== bUsers) return bUsers - aUsers;
      return (a.metaId || a.accountName).localeCompare(b.metaId || b.accountName);
    })
    .slice(0, 12);
}

function computeBmStats(bmConfigs, clientRequests) {
  const expanded = expandAdAccountRequests(clientRequests);

  const perBm = bmConfigs.map((bm, index) => {
    const slots = Array.isArray(bm.slots) ? bm.slots : [];
    const filledSlots = slots.filter((slot) => String(slot?.metaId || "").trim());
    const metaIds = new Set(filledSlots.map((slot) => String(slot.metaId).trim()));

    const linkedClients = expanded.filter((req) => metaIds.has(String(req.MetaAccountID || "").trim()));
    const uniqueUsers = new Set(
      linkedClients.map((client) => client.userUid || client.userEmail).filter(Boolean)
    );

    return {
      index,
      name: bm.bmName?.trim() || `BM ${index + 1}`,
      businessId: bm.businessId || "",
      adAccountCount: filledSlots.length,
      userCount: uniqueUsers.size,
      slotCount: slots.length,
      linkedClients,
    };
  });

  const allUsers = new Set();
  perBm.forEach((bm) => {
    bm.linkedClients.forEach((client) => {
      const key = client.userUid || client.userEmail;
      if (key) allUsers.add(key);
    });
  });

  const chartData = perBm
    .map((bm) => ({
      name: bm.name,
      shortName: bm.name.length > 14 ? `${bm.name.slice(0, 14)}…` : bm.name,
      adAccounts: bm.adAccountCount,
      users: bm.userCount,
      value: bm.adAccountCount + bm.userCount,
    }))
    .filter((item) => item.value > 0);

  return {
    totalBMs: bmConfigs.length,
    totalAdAccounts: perBm.reduce((sum, bm) => sum + bm.adAccountCount, 0),
    totalUsers: allUsers.size,
    perBm,
    chartData,
  };
}

function MetricTile({ label, value, hint, icon: Icon, accent }) {
  return (
    <div
      className="rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3"
      style={{ borderLeftWidth: 3, borderLeftColor: accent }}
    >
      <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
        <Icon size={14} style={{ color: accent }} />
        {label}
      </div>
      <p className="text-xl font-black tracking-tight text-gray-900">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}

function BmDistributionChart({ data }) {
  if (!data.length) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 text-xs font-semibold text-gray-400">
        Map ad slots to see BM distribution
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="shortName"
              innerRadius={52}
              outerRadius={78}
              paddingAngle={3}
              stroke="#fff"
              strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const item = payload[0].payload;
                return (
                  <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg">
                    <p className="font-bold text-gray-900">{item.name}</p>
                    <p className="mt-1 text-gray-500">Ad accounts: {item.adAccounts}</p>
                    <p className="text-gray-500">Users: {item.users}</p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 space-y-2">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between gap-3 text-[11px]">
            <span className="flex min-w-0 items-center gap-2 font-semibold text-gray-600">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: CHART_COLORS[index % CHART_COLORS.length] }}
              />
              <span className="truncate">{item.name}</span>
            </span>
            <span className="shrink-0 font-bold text-gray-400">
              {item.adAccounts} ads · {item.users} users
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileAvatar() {
  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-sky-500 to-indigo-600 shadow-sm">
      <Building2 size={28} className="text-white" />
    </div>
  );
}

function ClientRow({ client }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
      {client.photoURL ? (
        <Image
          src={client.photoURL}
          alt="profile"
          width={40}
          height={40}
          className="h-10 w-10 rounded-full border-2 border-sky-100 object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-xs font-bold text-white">
          {client.accountName?.charAt(0).toUpperCase() || <User size={16} />}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-gray-900">{client.accountName || "Unnamed"}</p>
        <p className="truncate text-xs text-gray-500">{client.userEmail}</p>
        {client.MetaAccountID ? (
          <p className="mt-0.5 font-mono text-[10px] text-gray-400">Meta · {client.MetaAccountID}</p>
        ) : null}
      </div>
    </div>
  );
}

function ConnectedUserCard({ client }) {
  const status = String(client.status || client.parentStatus || "pending").toLowerCase();
  const userHref = client.userUid ? `/admin-dashboard/users/${encodeURIComponent(client.userUid)}` : null;

  const inner = (
    <>
      {client.photoURL ? (
        <Image
          src={client.photoURL}
          alt="profile"
          width={44}
          height={44}
          className="h-11 w-11 rounded-full border-2 border-sky-100 object-cover"
        />
      ) : (
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-sm font-bold text-white">
          {client.accountName?.charAt(0).toUpperCase() || <User size={18} />}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-bold text-gray-900">{client.accountName || "Unnamed account"}</p>
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${statusPill(status)}`}>
            {formatStatusLabel(status)}
          </span>
        </div>
        <p className="truncate text-xs text-gray-500">{client.userEmail || "No email"}</p>
        {client.userUid ? (
          <p className="mt-0.5 font-mono text-[10px] text-gray-400">UID · {client.userUid}</p>
        ) : null}
      </div>
      {userHref ? <ExternalLink size={14} className="shrink-0 text-sky-400" /> : null}
    </>
  );

  if (userHref) {
    return (
      <Link
        href={userHref}
        className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 transition hover:border-sky-200 hover:bg-sky-50/40 hover:shadow-sm"
      >
        {inner}
      </Link>
    );
  }

  return <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3">{inner}</div>;
}

function AdAccountSearchResult({ result, onOpenBm }) {
  const title = result.accountName || "Ad account";
  const metaLabel = result.metaId || "No Meta ID";

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-100 bg-gradient-to-r from-sky-50/70 to-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
            <Megaphone size={20} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-gray-900">{title}</p>
            <p className="mt-0.5 font-mono text-xs text-gray-500">Meta ID · {metaLabel}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {result.bm ? (
                <button
                  type="button"
                  onClick={() => onOpenBm(result.bm.index)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700 transition hover:bg-indigo-100"
                >
                  <Building2 size={11} />
                  {result.bm.name}
                </button>
              ) : (
                <span className="rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase text-amber-700">
                  Not mapped on any BM
                </span>
              )}
              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-700">
                {result.clients.length} user{result.clients.length === 1 ? "" : "s"} connected
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5">
        {result.clients.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {result.clients.map((client, index) => (
              <ConnectedUserCard key={client.userUid || client.userEmail || client.id || index} client={client} />
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50/60 px-4 py-6 text-sm text-gray-500">
            <Users size={18} className="shrink-0 text-gray-300" />
            No user profiles connected to this ad account yet.
          </div>
        )}
      </div>
    </div>
  );
}

function AdAccountSearchPanel({ bmConfigs, clientRequests, onOpenBm }) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const results = useMemo(
    () => searchAdAccounts(query, bmConfigs, clientRequests),
    [query, bmConfigs, clientRequests]
  );

  const trimmed = query.trim();
  const showResults = trimmed.length >= 2;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-sky-50/25 to-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
              <Search size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Ad account lookup</h2>
              <p className="text-xs text-gray-500">Search Meta ID or account name to see connected users</p>
            </div>
          </div>
          {showResults ? (
            <span className="text-xs font-semibold text-sky-600">
              {results.length} match{results.length === 1 ? "" : "es"}
            </span>
          ) : null}
        </div>

        <div
          className={`relative flex items-center gap-3 rounded-xl border bg-white px-4 py-3 transition ${
            focused ? "border-sky-300 shadow-sm ring-2 ring-sky-100" : "border-gray-200"
          }`}
        >
          <Megaphone size={18} className="shrink-0 text-sky-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search by Meta Account ID or ad account name…"
            className="w-full bg-transparent text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          ) : null}
        </div>
      </div>

      {showResults ? (
        <div className="space-y-4 px-5 py-5 sm:px-6">
          {results.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-6 py-10 text-center">
              <Search size={28} className="mx-auto mb-3 text-gray-300" />
              <p className="font-semibold text-gray-700">No ad accounts found</p>
              <p className="mt-1 text-sm text-gray-500">
                Try another Meta ID or account name. At least 2 characters required.
              </p>
            </div>
          ) : (
            results.map((result) => (
              <AdAccountSearchResult
                key={result.metaId || result.accountName}
                result={result}
                onOpenBm={onOpenBm}
              />
            ))
          )}
        </div>
      ) : (
        <div className="px-5 py-4 sm:px-6">
          <p className="text-xs text-gray-400">
            Example: paste a Meta Account ID like <span className="font-mono text-gray-500">1045752564393311</span> or type an account name.
          </p>
        </div>
      )}
    </div>
  );
}

export default function SystemMasterPanel() {
  const { token } = useAppAuth();
  const invalidate = useInvalidateApi();
  const [bmConfigs, setBmConfigs] = useState([{ bmName: "", businessId: "", token: "", slots: [] }]);
  const [clientRequests, setClientRequests] = useState([]);
  const [selectedBmIndex, setSelectedBmIndex] = useState(null);
  const [detailTab, setDetailTab] = useState("overview");
  const [loading, setLoading] = useState(null);

  const { data: settingsData, isLoading: settingsLoading } = useApiQuery(
    queryKeys.admin.settings(),
    "/api/admin/settings",
    { staleTime: 60_000 }
  );

  const { data: requestsData, isLoading: requestsLoading } = useApiQuery(
    queryKeys.admin.metaAds(),
    "/api/admin/ads-request/list",
    { staleTime: 60_000, select: (json) => (json.ok ? json.data || [] : []) }
  );

  const initialLoading = settingsLoading || requestsLoading;

  useEffect(() => {
    if (settingsData?.bmConfigs) {
      setBmConfigs(settingsData.bmConfigs);
    }
  }, [settingsData]);

  useEffect(() => {
    if (requestsData) {
      setClientRequests(requestsData);
    }
  }, [requestsData]);

  const stats = useMemo(() => computeBmStats(bmConfigs, clientRequests), [bmConfigs, clientRequests]);

  const selectedMetrics = selectedBmIndex !== null ? stats.perBm[selectedBmIndex] : null;

  const uniqueLinkedClients = useMemo(() => {
    if (!selectedMetrics) return [];
    const seen = new Set();
    return selectedMetrics.linkedClients.filter((client) => {
      const key = client.userUid || client.userEmail || client.id;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [selectedMetrics]);

  const loadSystemData = useCallback(async () => {
    await Promise.all([
      invalidate(queryKeys.admin.settings()),
      invalidate(queryKeys.admin.metaAds()),
    ]);
  }, [invalidate]);

  const getAllClientsForMetaId = (metaId) => {
    const normalizedMetaId = metaId?.trim();
    if (!normalizedMetaId) return [];
    return expandAdAccountRequests(clientRequests).filter((req) => req.MetaAccountID?.trim() === normalizedMetaId);
  };

  const openBmDetail = (index) => {
    setSelectedBmIndex(index);
    setDetailTab("overview");
  };

  const openBmFromSearch = (index) => {
    openBmDetail(index);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const syncSelectedIndexAfterRemove = useCallback((removedIndex) => {
    if (selectedBmIndex === removedIndex) setSelectedBmIndex(null);
    else if (selectedBmIndex !== null && selectedBmIndex > removedIndex) {
      setSelectedBmIndex(selectedBmIndex - 1);
    }
  }, [selectedBmIndex]);

  const persistBmConfigs = useCallback(
    async (nextConfigs) => {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bmConfigs: nextConfigs }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Could not save settings.");
      setBmConfigs(nextConfigs);
      invalidate(queryKeys.admin.settings());
      return json;
    },
    [invalidate, token]
  );

  const handleAddBm = () => {
    const next = [...bmConfigs, { bmName: "", businessId: "", token: "", slots: [] }];
    setBmConfigs(next);
    setSelectedBmIndex(next.length - 1);
    setDetailTab("configuration");
    void Swal.fire({
      icon: "success",
      title: "BM added",
      text: "Fill in the details and click Save changes.",
      timer: 2200,
      showConfirmButton: false,
    });
  };

  const confirmRemoveBm = async (index) => {
    const bm = bmConfigs[index];
    const name = bmDisplayName(bm, index);
    const result = await Swal.fire({
      title: "Remove Business Manager?",
      html: `Are you sure you want to delete <strong>${name}</strong>?<br/><span style="font-size:13px;color:#6b7280">This action cannot be undone.</span>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, remove",
      cancelButtonText: "Cancel",
      ...SWAL_DANGER,
    });
    if (!result.isConfirmed) return;

    const nextConfigs = bmConfigs.filter((_, idx) => idx !== index);
    try {
      await persistBmConfigs(nextConfigs);
      syncSelectedIndexAfterRemove(index);
      await Swal.fire({
        icon: "success",
        title: "BM removed",
        text: `"${name}" has been deleted.`,
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: err?.message || "Could not remove Business Manager.",
        ...SWAL_PRIMARY,
      });
    }
  };

  const handleBMChange = (index, field, value) => {
    const newConfigs = [...bmConfigs];
    newConfigs[index][field] = value;
    setBmConfigs(newConfigs);
  };

  const handleAddSlot = (bmIndex) => {
    const newConfigs = [...bmConfigs];
    if (!newConfigs[bmIndex].slots) newConfigs[bmIndex].slots = [];
    newConfigs[bmIndex].slots.push({ metaId: "" });
    setBmConfigs(newConfigs);
    void Swal.fire({
      icon: "info",
      title: "Slot added",
      text: "Enter the Meta Account ID and save your changes.",
      timer: 2000,
      showConfirmButton: false,
    });
  };

  const confirmRemoveSlot = async (bmIndex, slotIndex) => {
    const slot = bmConfigs[bmIndex]?.slots?.[slotIndex];
    const metaLabel = slot?.metaId?.trim() ? `Meta ID ${slot.metaId.trim()}` : "this empty slot";
    const result = await Swal.fire({
      title: "Remove ad slot?",
      html: `Are you sure you want to remove <strong>${metaLabel}</strong>?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, remove",
      cancelButtonText: "Cancel",
      ...SWAL_DANGER,
    });
    if (!result.isConfirmed) return;

    const nextConfigs = bmConfigs.map((bm, i) => {
      if (i !== bmIndex) return bm;
      return { ...bm, slots: (bm.slots || []).filter((_, si) => si !== slotIndex) };
    });

    try {
      await persistBmConfigs(nextConfigs);
      await Swal.fire({
        icon: "success",
        title: "Slot removed",
        text: "The ad slot has been deleted.",
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: err?.message || "Could not remove ad slot.",
        ...SWAL_PRIMARY,
      });
    }
  };

  const handleSlotChange = (bmIndex, slotIndex, value) => {
    const newConfigs = [...bmConfigs];
    newConfigs[bmIndex].slots[slotIndex].metaId = value;
    setBmConfigs(newConfigs);
  };

  const confirmSaveBm = async (bmIndex) => {
    const bm = bmConfigs[bmIndex];
    const name = bmDisplayName(bm, bmIndex);
    const result = await Swal.fire({
      title: "Save changes?",
      html: `Update configuration for <strong>${name}</strong>?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Save",
      cancelButtonText: "Cancel",
      ...SWAL_PRIMARY,
    });
    if (!result.isConfirmed) return;
    await handleUpdateBM(bmIndex);
  };

  const handleUpdateBM = async (bmIndex) => {
    const name = bmDisplayName(bmConfigs[bmIndex], bmIndex);
    setLoading(bmIndex);
    try {
      await persistBmConfigs(bmConfigs);
      await Swal.fire({
        icon: "success",
        title: "Saved successfully",
        text: `"${name}" configuration has been updated.`,
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "Save failed",
        text: err?.message || "Could not update Business Manager.",
        ...SWAL_PRIMARY,
      });
    } finally {
      setLoading(null);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const selectedBm = selectedBmIndex !== null ? bmConfigs[selectedBmIndex] : null;
  const displayName = selectedBm?.bmName?.trim() || (selectedBmIndex !== null ? `BM ${selectedBmIndex + 1}` : "");
  const tokenPreview = selectedBm?.token
    ? `${selectedBm.token.slice(0, 12)}…${selectedBm.token.slice(-6)}`
    : "Not configured";

  if (selectedBm && selectedBmIndex !== null) {
    return (
      <div className="space-y-6 pb-8">
        <AdAccountSearchPanel
          bmConfigs={bmConfigs}
          clientRequests={clientRequests}
          onOpenBm={openBmFromSearch}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => setSelectedBmIndex(null)}
            className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-gray-900"
          >
            <ArrowLeft size={16} />
            Back to all BMs
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAddBm}
              className="admin-secondary-button inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold"
            >
              <Plus size={16} />
              Add BM
            </button>
            <button
              type="button"
              onClick={() => confirmRemoveBm(selectedBmIndex)}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-100"
            >
              <Trash2 size={16} />
              Remove
            </button>
            <button
              type="button"
              onClick={() => confirmSaveBm(selectedBmIndex)}
              disabled={loading === selectedBmIndex}
              className="admin-accent-button inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-50"
            >
              {loading === selectedBmIndex ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Saving…
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save changes
                </>
              )}
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-sky-50/40 to-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-4">
              <ProfileAvatar />
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-black tracking-tight text-gray-900 sm:text-2xl">{displayName}</h1>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-600">
                    <Activity size={12} />
                    Active
                  </span>
                  <span className="rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-700">
                    Business Manager
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {selectedBm.businessId ? `Business ID · ${selectedBm.businessId}` : "Business ID not set"}
                </p>
                <p className="mt-1 font-mono text-[11px] text-gray-400">
                  Node · #{String(selectedBmIndex + 1).padStart(2, "0")}
                </p>
              </div>
            </div>

            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 xl:max-w-xl">
              <MetricTile
                label="Ad accounts"
                value={selectedMetrics?.adAccountCount || 0}
                hint="Mapped Meta IDs"
                icon={Megaphone}
                accent="#3b82f6"
              />
              <MetricTile
                label="Linked users"
                value={selectedMetrics?.userCount || 0}
                hint="Profiles on this BM"
                icon={Users}
                accent="#10b981"
              />
              <MetricTile
                label="Total slots"
                value={selectedBm?.slots?.length || 0}
                hint="Configured slots"
                icon={LayoutGrid}
                accent="#8b5cf6"
              />
            </div>
          </div>
        </div>

        <nav className="flex flex-wrap gap-2">
          {BM_DETAIL_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = detailTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDetailTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "border-sky-200 bg-sky-50 text-sky-700 shadow-sm"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {detailTab === "overview" && (
          <div className="space-y-4">
            <SectionCard title="BM summary" icon={Building2}>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">BM name</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{displayName}</p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Business ID</p>
                  <p className="mt-1 font-mono text-xs font-semibold text-gray-900 break-all">
                    {selectedBm.businessId || "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Access token</p>
                  <p className="mt-1 font-mono text-xs font-semibold text-gray-900">{tokenPreview}</p>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Ad slot mapping"
              icon={LayoutGrid}
              action={
                <button
                  type="button"
                  onClick={() => setDetailTab("slots")}
                  className="text-xs font-bold text-sky-600 hover:text-sky-700"
                >
                  Manage slots →
                </button>
              }
            >
              {(selectedBm.slots || []).length === 0 ? (
                <p className="text-sm text-gray-500">No ad slots configured yet. Add slots to map Meta account IDs.</p>
              ) : (
                <div className="space-y-2">
                  {(selectedBm.slots || []).map((slot, slotIndex) => {
                    const matched = getAllClientsForMetaId(slot.metaId);
                    return (
                      <div
                        key={slotIndex}
                        className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-xs font-black text-sky-600">
                            {String(slotIndex + 1).padStart(2, "0")}
                          </span>
                          <div className="min-w-0">
                            <p className="font-mono text-xs font-semibold text-gray-900">
                              {slot.metaId?.trim() || "Empty slot"}
                            </p>
                            <p className="text-[11px] text-gray-500">
                              {matched.length > 0 ? `${matched.length} profile(s) linked` : "No profiles linked"}
                            </p>
                          </div>
                        </div>
                        <Link2 size={14} className="shrink-0 text-gray-300" />
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>

            {uniqueLinkedClients.length > 0 ? (
              <SectionCard
                title="Linked profiles"
                icon={Users}
                action={
                  <button
                    type="button"
                    onClick={() => setDetailTab("users")}
                    className="text-xs font-bold text-sky-600 hover:text-sky-700"
                  >
                    View all →
                  </button>
                }
              >
                <div className="grid gap-3 md:grid-cols-2">
                  {uniqueLinkedClients.slice(0, 4).map((client, i) => (
                    <ClientRow key={client.id || client.userEmail || i} client={client} />
                  ))}
                </div>
              </SectionCard>
            ) : null}
          </div>
        )}

        {detailTab === "configuration" && (
          <SectionCard title="BM configuration" icon={KeyRound}>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    BM name
                  </label>
                  <input
                    placeholder="e.g. Gorilla Digital 1022"
                    value={selectedBm.bmName}
                    onChange={(e) => handleBMChange(selectedBmIndex, "bmName", e.target.value)}
                    className="w-full rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-sky-200"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Business ID
                  </label>
                  <input
                    placeholder="Meta Business Manager ID"
                    value={selectedBm.businessId}
                    onChange={(e) => handleBMChange(selectedBmIndex, "businessId", e.target.value)}
                    className="w-full rounded-xl px-4 py-3 font-mono text-sm outline-none focus:ring-2 focus:ring-sky-200"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Access token
                </label>
                <textarea
                  value={selectedBm.token}
                  onChange={(e) => handleBMChange(selectedBmIndex, "token", e.target.value)}
                  rows={4}
                  placeholder="EAA access token…"
                  className="w-full resize-none rounded-xl px-4 py-3 font-mono text-xs outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>
            </div>
          </SectionCard>
        )}

        {detailTab === "slots" && (
          <SectionCard
            title="Attached ad slots"
            icon={LayoutGrid}
            action={
              <button
                type="button"
                onClick={() => handleAddSlot(selectedBmIndex)}
                className="admin-secondary-button inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold"
              >
                <Plus size={14} />
                Add slot
              </button>
            }
          >
            {(selectedBm.slots || []).length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-6 py-10 text-center">
                <LayoutGrid size={28} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-semibold text-gray-600">No ad slots yet</p>
                <p className="mt-1 text-xs text-gray-400">Add a slot and map a Meta account ID to link user profiles.</p>
                <button
                  type="button"
                  onClick={() => handleAddSlot(selectedBmIndex)}
                  className="admin-accent-button mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold"
                >
                  <Plus size={16} />
                  Add first slot
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {(selectedBm.slots || []).map((slot, slotIndex) => {
                  const matchedClients = getAllClientsForMetaId(slot.metaId);
                  return (
                    <div key={slotIndex} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                      <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sm font-black text-sky-600">
                            {String(slotIndex + 1).padStart(2, "0")}
                          </span>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Meta ID mapping</p>
                            <div className="mt-1 flex items-center gap-2">
                              <Link2 size={14} className="shrink-0 text-sky-500" />
                              <input
                                placeholder="Meta Account ID"
                                value={slot.metaId}
                                onChange={(e) => handleSlotChange(selectedBmIndex, slotIndex, e.target.value)}
                                className="w-full max-w-xs rounded-lg px-3 py-1.5 font-mono text-xs outline-none focus:ring-2 focus:ring-sky-200"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {matchedClients.length > 0 ? (
                            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-600">
                              {matchedClients.length} linked
                            </span>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => confirmRemoveSlot(selectedBmIndex, slotIndex)}
                            className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      {matchedClients.length > 0 ? (
                        <div className="grid gap-2 p-4 md:grid-cols-2">
                          {matchedClients.map((client, clientIndex) => (
                            <ClientRow key={clientIndex} client={client} />
                          ))}
                        </div>
                      ) : (
                        <p className="px-4 py-3 text-xs italic text-gray-400">No profile connected to this slot yet</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        )}

        {detailTab === "users" && (
          <SectionCard title="All linked profiles" icon={Users}>
            {uniqueLinkedClients.length === 0 ? (
              <p className="text-sm text-gray-500">
                No profiles linked yet. Map Meta account IDs in Ad Slots to connect user profiles.
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {uniqueLinkedClients.map((client, i) => (
                  <ClientRow key={client.id || client.userEmail || i} client={client} />
                ))}
              </div>
            )}
          </SectionCard>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">System Master Panel</h1>
          <p className="mt-1 text-sm text-gray-500">
            Configure Business Managers, review distribution, and map ad account slots.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddBm}
          className="admin-accent-button inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold"
        >
          <Plus size={16} />
          Add New BM
        </button>
      </div>

      <AdAccountSearchPanel
        bmConfigs={bmConfigs}
        clientRequests={clientRequests}
        onOpenBm={openBmFromSearch}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <div className="space-y-3 xl:col-span-3">
          {bmConfigs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 px-6 py-12 text-center">
              <Building2 size={32} className="mx-auto mb-3 text-gray-300" />
              <p className="font-semibold text-gray-600">No Business Managers configured</p>
              <p className="mt-1 text-sm text-gray-400">Add your first BM to get started.</p>
            </div>
          ) : (
            bmConfigs.map((bm, bmIndex) => {
              const metrics = stats.perBm[bmIndex];
              const name = bm.bmName?.trim() || `BM ${bmIndex + 1}`;
              return (
                <div
                  key={bmIndex}
                  role="button"
                  tabIndex={0}
                  onClick={() => openBmDetail(bmIndex)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openBmDetail(bmIndex);
                    }
                  }}
                  className="group flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-sky-200 hover:shadow-md sm:p-5"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-sm">
                      <Building2 size={20} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-bold text-gray-900 sm:text-lg">{name}</h2>
                      <p className="mt-0.5 font-mono text-[11px] text-gray-400">
                        {bm.businessId || "No business ID"} · {metrics?.slotCount || 0} slots
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full border border-sky-100 bg-sky-50 px-2.5 py-0.5 text-[10px] font-bold uppercase text-sky-700">
                          {metrics?.adAccountCount || 0} ad accounts
                        </span>
                        <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                          {metrics?.userCount || 0} users
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmRemoveBm(bmIndex);
                      }}
                      className="rounded-lg p-2 text-gray-400 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                    <ChevronRight size={20} className="text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-sky-500" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
              <Server size={14} />
              Network statistics
            </h3>
            <div className="mt-4 space-y-3">
              <MetricTile
                label="Total BMs"
                value={stats.totalBMs}
                hint="Configured nodes"
                icon={Building2}
                accent="#3b82f6"
              />
              <MetricTile
                label="Total ad accounts"
                value={stats.totalAdAccounts}
                hint="Mapped Meta IDs"
                icon={Megaphone}
                accent="#10b981"
              />
              <MetricTile
                label="Total users"
                value={stats.totalUsers}
                hint="Linked profiles"
                icon={Users}
                accent="#8b5cf6"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">BM distribution</h3>
            <p className="mt-1 text-[11px] leading-5 text-gray-500">
              Which BM holds the most ad accounts and linked users.
            </p>
            <div className="mt-4">
              <BmDistributionChart data={stats.chartData} />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-sky-50/60 to-white p-5 text-center shadow-sm">
            <Activity size={24} className="mx-auto mb-2 text-sky-500" />
            <h4 className="text-sm font-bold text-gray-900">Live mapping engine</h4>
            <p className="mt-1 text-[11px] leading-relaxed text-gray-500">
              Meta IDs are matched against ad account requests in real time for profile linking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
