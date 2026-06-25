"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Cpu,
  HardDrive,
  Loader2,
  Network,
  RefreshCw,
  Server,
  Timer,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatBytes,
  formatDateTime,
  formatPercent,
  formatSpeed,
  formatUptime,
  useVpsAlerts,
  useVpsHistory,
  useVpsLive,
} from "@/hooks/useVpsMonitoring";

const HISTORY_RANGES = [
  { key: "1h", label: "1 Hour" },
  { key: "24h", label: "24 Hours" },
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
];

function MetricCard({ label, value, hint, icon: Icon, tone = "sky" }) {
  const tones = {
    sky: "border-sky-200 bg-sky-50 text-sky-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    violet: "border-violet-200 bg-violet-50 text-violet-700",
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-2 text-2xl font-black text-gray-900">{value}</p>
          {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${tones[tone] || tones.sky}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
      <h3 className="mb-4 text-sm font-black tracking-tight text-gray-900">{title}</h3>
      {children}
    </div>
  );
}

function HistoryChart({ data, dataKey, color, suffix = "%" }) {
  if (!data?.length) {
    return (
      <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-gray-200 text-sm text-gray-500">
        No history yet
      </div>
    );
  }

  const chartData = data.map((point) => ({
    ...point,
    label: new Date(point.timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
  }));

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={`vps-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 8" vertical={false} stroke="#e5e7eb" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} width={40} />
          <Tooltip formatter={(value) => [`${Number(value || 0).toFixed(1)}${suffix}`, dataKey]} />
          <Area type="monotone" dataKey={dataKey} stroke={color} fill={`url(#vps-${dataKey})`} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function VpsMonitoringDashboard() {
  const [selectedServerId, setSelectedServerId] = useState("");
  const [historyRange, setHistoryRange] = useState("24h");

  const { data: liveList = [], isLoading, refetch, isFetching } = useVpsLive(selectedServerId || null);

  const servers = useMemo(() => liveList, [liveList]);

  const activeServerId = selectedServerId || servers[0]?.serverId || "";
  const snapshot = servers.find((item) => item.serverId === activeServerId) || servers[0] || null;

  const { data: historyData, isLoading: historyLoading } = useVpsHistory(activeServerId, historyRange);
  const { data: alerts = [] } = useVpsAlerts(activeServerId);

  const historyPoints = historyData?.points || [];
  const online = Boolean(snapshot?.online);
  const cpu = snapshot?.cpu || {};
  const memory = snapshot?.memory || {};
  const storage = snapshot?.storage || {};
  const network = snapshot?.network || {};
  const system = snapshot?.system || {};
  const pm2Apps = snapshot?.pm2 || [];
  const processes = snapshot?.processes || [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">VPS Monitoring</h1>
          <p className="mt-0.5 text-sm text-gray-500">Real-time Contabo server health and resource usage</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {servers.length > 1 ? (
            <select
              value={activeServerId}
              onChange={(e) => setSelectedServerId(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700"
            >
              {servers.map((server) => (
                <option key={server.serverId} value={server.serverId}>
                  {server.hostname || server.serverId}
                </option>
              ))}
            </select>
          ) : null}
          <button
            type="button"
            onClick={() => void refetch()}
            className="admin-secondary-button inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold"
          >
            <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {isLoading && !snapshot ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-20 text-sm text-gray-500">
          <Loader2 size={16} className="animate-spin" />
          Loading VPS metrics...
        </div>
      ) : !snapshot ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
          <Server size={28} className="mx-auto mb-3 text-gray-300" />
          <p className="font-semibold text-gray-700">No VPS data yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Install the monitor agent on your Contabo VPS and set <code className="text-xs">VPS_INGEST_SECRET</code> on both sides.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="dashboard-accent-surface flex h-12 w-12 items-center justify-center rounded-2xl">
                  <Server size={20} />
                </div>
                <div>
                  <p className="text-lg font-black text-gray-900">{snapshot.hostname || snapshot.serverId}</p>
                  <p className="text-xs text-gray-500">
                    {snapshot.provider || "Contabo"} · {snapshot.publicIp || "—"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
                    online ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${online ? "bg-emerald-500" : "bg-rose-500"}`} />
                  {online ? "Online" : "Offline"}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1 text-xs font-bold text-gray-600">
                  <Timer size={12} />
                  Uptime {formatUptime(system.uptime)}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1 text-xs font-bold text-gray-600">
                  Updated {formatDateTime(snapshot.receivedAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="CPU" value={formatPercent(cpu.usage ?? cpu.usagePercent)} hint={`${cpu.cores || "—"} cores`} icon={Cpu} tone="sky" />
            <MetricCard label="RAM" value={formatPercent(memory.usedPercent)} hint={`${formatBytes(memory.used)} / ${formatBytes(memory.total)}`} icon={Activity} tone="emerald" />
            <MetricCard label="Disk" value={formatPercent(storage.usedPercent)} hint={`${formatBytes(storage.used)} used`} icon={HardDrive} tone="amber" />
            <MetricCard label="Network" value={formatSpeed(network.rxSec)} hint={`↑ ${formatSpeed(network.txSec)}`} icon={Network} tone="violet" />
          </div>

          {alerts.length ? (
            <Section title="Active Alerts">
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div
                    key={String(alert._id)}
                    className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5"
                  >
                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
                    <div>
                      <p className="text-sm font-bold text-amber-900">{alert.message}</p>
                      <p className="text-xs text-amber-700">{formatDateTime(alert.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {HISTORY_RANGES.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setHistoryRange(item.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  historyRange === item.key
                    ? "dashboard-accent-surface border-transparent"
                    : "border border-gray-200 bg-white text-gray-600"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Section title="CPU History">
              {historyLoading ? (
                <div className="flex h-56 items-center justify-center text-sm text-gray-500">
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Loading...
                </div>
              ) : (
                <HistoryChart data={historyPoints} dataKey="cpu" color="#0ea5e9" />
              )}
            </Section>
            <Section title="Memory History">
              {historyLoading ? (
                <div className="flex h-56 items-center justify-center text-sm text-gray-500">Loading...</div>
              ) : (
                <HistoryChart data={historyPoints} dataKey="memory" color="#10b981" />
              )}
            </Section>
            <Section title="Disk History">
              <HistoryChart data={historyPoints} dataKey="disk" color="#f59e0b" />
            </Section>
            <Section title="Network History">
              <HistoryChart
                data={historyPoints.map((p) => ({ ...p, rx: p.network?.rxSec || 0 }))}
                dataKey="rx"
                color="#8b5cf6"
                suffix="/s"
              />
            </Section>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Section title="CPU Details">
              <div className="grid gap-2 sm:grid-cols-2">
                <Info label="Model" value={cpu.model || "—"} />
                <Info label="Speed" value={cpu.speed ? `${cpu.speed} GHz` : "—"} />
                <Info label="Load Avg" value={(cpu.loadAvg || []).map((v) => Number(v).toFixed(2)).join(" / ") || "—"} />
                <Info label="Processes" value={cpu.processCount || "—"} />
              </div>
              {(cpu.perCore || []).length ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {cpu.perCore.map((core, index) => (
                    <div key={index} className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs">
                      <span className="font-bold text-gray-500">Core {index + 1}</span>
                      <p className="mt-1 font-black text-gray-900">{formatPercent(core)}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </Section>

            <Section title="Memory & Swap">
              <div className="grid gap-2 sm:grid-cols-2">
                <Info label="Used" value={formatBytes(memory.used)} />
                <Info label="Free" value={formatBytes(memory.free)} />
                <Info label="Cached" value={formatBytes(memory.cached)} />
                <Info label="Swap Used" value={formatBytes(memory.swapUsed)} />
              </div>
            </Section>
          </div>

          <Section title="Storage Partitions">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-3 py-2">Mount</th>
                    <th className="px-3 py-2">FS</th>
                    <th className="px-3 py-2">Size</th>
                    <th className="px-3 py-2">Used</th>
                    <th className="px-3 py-2">Usage</th>
                  </tr>
                </thead>
                <tbody>
                  {(storage.partitions || []).map((part) => (
                    <tr key={`${part.mount}-${part.fs}`} className="border-b border-gray-50">
                      <td className="px-3 py-2 font-semibold text-gray-900">{part.mount}</td>
                      <td className="px-3 py-2 text-gray-600">{part.fs}</td>
                      <td className="px-3 py-2 text-gray-600">{formatBytes(part.size)}</td>
                      <td className="px-3 py-2 text-gray-600">{formatBytes(part.used)}</td>
                      <td className="px-3 py-2 font-bold text-gray-900">{formatPercent(part.usedPercent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <div className="grid gap-4 xl:grid-cols-2">
            <Section title="PM2 Applications">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                      <th className="px-3 py-2">App</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">CPU</th>
                      <th className="px-3 py-2">RAM</th>
                      <th className="px-3 py-2">Restarts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pm2Apps.length ? (
                      pm2Apps.map((app) => (
                        <tr key={app.name} className="border-b border-gray-50">
                          <td className="px-3 py-2 font-semibold text-gray-900">{app.name}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                                String(app.status).toLowerCase() === "online"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-rose-50 text-rose-700"
                              }`}
                            >
                              {app.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-gray-600">{formatPercent(app.cpu)}</td>
                          <td className="px-3 py-2 text-gray-600">{formatBytes(app.memory)}</td>
                          <td className="px-3 py-2 text-gray-600">{app.restarts ?? 0}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                          No PM2 apps detected
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="Top Processes">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                      <th className="px-3 py-2">PID</th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">CPU</th>
                      <th className="px-3 py-2">RAM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processes.length ? (
                      processes.map((proc) => (
                        <tr key={proc.pid} className="border-b border-gray-50">
                          <td className="px-3 py-2 text-gray-600">{proc.pid}</td>
                          <td className="px-3 py-2 font-semibold text-gray-900">{proc.name}</td>
                          <td className="px-3 py-2 text-gray-600">{formatPercent(proc.cpu)}</td>
                          <td className="px-3 py-2 text-gray-600">{formatBytes(proc.memory)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-3 py-6 text-center text-gray-500">
                          No process data
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>

          <Section title="System Information">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <Info label="OS" value={system.os || "—"} />
              <Info label="Kernel" value={system.kernel || "—"} />
              <Info label="Platform" value={system.platform || "—"} />
              <Info label="Architecture" value={system.arch || "—"} />
              <Info label="Timezone" value={system.timezone || "—"} />
              <Info label="Disk IO Read" value={formatSpeed(snapshot.diskIo?.readSpeed)} />
              <Info label="Disk IO Write" value={formatSpeed(snapshot.diskIo?.writeSpeed)} />
              <Info label="CPU Temp" value={snapshot.health?.cpuTemp ? `${snapshot.health.cpuTemp}°C` : "—"} />
              <Info label="Disk Health" value={snapshot.health?.diskHealth || "—"} />
            </div>
          </Section>
        </>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-gray-900">{value}</p>
    </div>
  );
}
