"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import useAppAuth from "@/hooks/useAppAuth";
import { DEFAULT_USD_TO_BDT_RATE } from "@/lib/currency";

const DEFAULT_PERMISSIONS = {
  projectsAccess: false,
  transactionsAccess: false,
  affiliateAccess: false,
  metaAdAccess: false,
};

const SOCIAL_KEYS = [
  "website",
  "github",
  "twitter",
  "youtube",
  "dribbble",
  "behance",
  "pinterest",
  "whatsapp",
  "linkedin",
  "telegram",
  "instagram",
  "facebook",
];

const BASE_TABS = ["Overview", "Affiliate", "Meta Ads", "Profile"];

const safeNum = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const createTimelineItem = () => ({
  title: "",
  company: "",
  duration: "",
  description: "",
});

function normalizeTimeline(items) {
  if (!Array.isArray(items) || items.length === 0) return [createTimelineItem()];

  return items.map((item) => ({
    title: item?.title || "",
    company: item?.company || "",
    duration: item?.duration || "",
    description: item?.description || "",
  }));
}

export default function ManageUserModal({ user, onClose, onUpdated }) {
  const { token } = useAppAuth();
  const [activeTab, setActiveTab] = useState("Overview");

  const [role, setRole] = useState(user.role || "user");
  const [status, setStatus] = useState(user.status || "active");
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [walletBalance, setWalletBalance] = useState(safeNum(user.walletBalance));
  const [topupBalance, setTopupBalance] = useState(safeNum(user.topupBalance));
  const [totalReferrers, setTotalReferrers] = useState(safeNum(user.referralStats?.totalReferrers));
  const [totalReferIncome, setTotalReferIncome] = useState(safeNum(user.referralStats?.totalReferIncome));
  const [totalPayout, setTotalPayout] = useState(safeNum(user.referralStats?.totalPayout));
  const [level1DepositCount, setLevel1DepositCount] = useState(safeNum(user.level1DepositCount));
  const [permissions, setPermissions] = useState({
    ...DEFAULT_PERMISSIONS,
    ...(user.permissions || {}),
  });
  const [usdRate, setUsdRate] = useState(safeNum(user.metaAdsConfig?.usdRate, DEFAULT_USD_TO_BDT_RATE));
  const [allowBudgetIncrease, setAllowBudgetIncrease] = useState(user.metaAdsConfig?.allowBudgetIncrease ?? true);
  const [allowTopupAction, setAllowTopupAction] = useState(user.metaAdsConfig?.allowTopupAction ?? true);
  const [remainingBudgetOverride, setRemainingBudgetOverride] = useState(user.metaAdsConfig?.remainingBudgetOverride ?? "");

  const teamProfile = useMemo(() => user.teamMemberProfile || {}, [user.teamMemberProfile]);
  const [teamMemberUsername, setTeamMemberUsername] = useState(user.teamMemberUsername || "");
  const [teamAvatar, setTeamAvatar] = useState(teamProfile.avatar || user.photo || "");
  const [teamDisplayName, setTeamDisplayName] = useState(teamProfile.displayName || user.name || "");
  const [teamHeadline, setTeamHeadline] = useState(teamProfile.headline || "");
  const [teamCompany, setTeamCompany] = useState(teamProfile.company || "Neon Code");
  const [teamPhone, setTeamPhone] = useState(teamProfile.phone || "");
  const [teamPublicEmail, setTeamPublicEmail] = useState(teamProfile.publicEmail || user.email || "");
  const [teamLocation, setTeamLocation] = useState(teamProfile.location || "");
  const [teamWebsite, setTeamWebsite] = useState(teamProfile.website || "");
  const [teamDepartment, setTeamDepartment] = useState(teamProfile.department || "");
  const [teamEmployeeCode, setTeamEmployeeCode] = useState(teamProfile.employeeCode || "");
  const [teamAbout, setTeamAbout] = useState(teamProfile.about || "");
  const [teamSkills, setTeamSkills] = useState(Array.isArray(teamProfile.skills) ? teamProfile.skills.join(", ") : "");
  const [teamSocialLinks, setTeamSocialLinks] = useState({
    ...SOCIAL_KEYS.reduce((acc, key) => ({ ...acc, [key]: "" }), {}),
    ...(teamProfile.socialLinks || {}),
  });
  const [teamExperience, setTeamExperience] = useState(normalizeTimeline(teamProfile.experience));
  const [teamProjects, setTeamProjects] = useState(normalizeTimeline(teamProfile.projects));

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const tabs = role === "team_member" ? [...BASE_TABS, "Team Card"] : BASE_TABS;

  useEffect(() => {
    if (role !== "team_member" && activeTab === "Team Card") {
      setActiveTab("Profile");
    }
  }, [activeTab, role]);

  const togglePermission = (key) => {
    setPermissions((p) => ({ ...p, [key]: !p[key] }));
  };

  const updateTimelineField = (section, index, key, value) => {
    const setter = section === "experience" ? setTeamExperience : setTeamProjects;
    setter((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item))
    );
  };

  const addTimelineItem = (section) => {
    const setter = section === "experience" ? setTeamExperience : setTeamProjects;
    setter((current) => [...current, createTimelineItem()]);
  };

  const removeTimelineItem = (section, index) => {
    const setter = section === "experience" ? setTeamExperience : setTeamProjects;
    setter((current) => {
      const next = current.filter((_, itemIndex) => itemIndex !== index);
      return next.length ? next : [createTimelineItem()];
    });
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
            usdRate: safeNum(usdRate, DEFAULT_USD_TO_BDT_RATE),
            allowBudgetIncrease: Boolean(allowBudgetIncrease),
            allowTopupAction: Boolean(allowTopupAction),
            remainingBudgetOverride:
              remainingBudgetOverride === "" ? null : safeNum(remainingBudgetOverride, 0),
          },
          permissions: role === "admin" ? DEFAULT_PERMISSIONS : permissions,
          ...(role === "team_member"
            ? {
                teamMemberUsername,
                teamMemberProfile: {
                  avatar: teamAvatar,
                  displayName: teamDisplayName,
                  headline: teamHeadline,
                  company: teamCompany,
                  phone: teamPhone,
                  publicEmail: teamPublicEmail,
                  location: teamLocation,
                  website: teamWebsite,
                  department: teamDepartment,
                  employeeCode: teamEmployeeCode,
                  about: teamAbout,
                  skills: teamSkills,
                  socialLinks: teamSocialLinks,
                  experience: teamExperience,
                  projects: teamProjects,
                },
              }
            : {}),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm sm:p-4">
      <div className="max-h-[92vh] w-full max-w-6xl space-y-5 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.22)] sm:p-5 md:p-6 dark:border-slate-800 dark:bg-slate-950 dark:shadow-[0_30px_80px_-30px_rgba(2,6,23,0.7)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-50">User Dashboard Mirror Editor</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">UID: {user.userId}</p>
          </div>
          <button onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
            Close
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
                activeTab === tab
                  ? "border-sky-600 bg-sky-600 text-white dark:border-sky-500 dark:bg-sky-500"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Overview" && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Overview Tab Values</h3>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Affiliate Tab Values</h3>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <Field label="Completed Referred Users" value={level1DepositCount} onChange={setLevel1DepositCount} type="number" />
              <Field label="Total Referrers" value={totalReferrers} onChange={setTotalReferrers} type="number" />
              <Field label="Total Refer Income" value={totalReferIncome} onChange={setTotalReferIncome} type="number" />
              <Field label="Total Payout" value={totalPayout} onChange={setTotalPayout} type="number" />
            </div>
          </div>
        )}

        {activeTab === "Meta Ads" && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Meta Ads Tab Values</h3>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <Field label="Wallet Balance (USD)" value={walletBalance} onChange={setWalletBalance} type="number" />
              <Field label="USD Rate" value={usdRate} onChange={setUsdRate} type="number" />
              <Field label="Top Up Balance (USD)" value={topupBalance} onChange={setTopupBalance} type="number" />
              <Field label="Remaining Budget Override" value={remainingBudgetOverride} onChange={setRemainingBudgetOverride} type="number" />
              <Toggle label="Allow Increase Budget Button" value={allowBudgetIncrease} onChange={() => setAllowBudgetIncrease((v) => !v)} />
              <Toggle label="Allow Top Up Button" value={allowTopupAction} onChange={() => setAllowTopupAction((v) => !v)} />
              <Toggle label="Meta Ads Access Permission" value={permissions.metaAdAccess} onChange={() => togglePermission("metaAdAccess")} />
            </div>
          </div>
        )}

        {activeTab === "Profile" && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Profile / Access Values</h3>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <Field label="Name" value={name} onChange={setName} />
              <Field label="Email" value={email} onChange={setEmail} />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400">Role</p>
                <div className="flex flex-wrap gap-2">
                  {["admin", "manager", "team_member", "user"].map((r) => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                        role === r
                          ? "border-sky-600 bg-sky-600 text-white dark:border-sky-500 dark:bg-sky-500"
                          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400">Status</p>
                <div className="flex flex-wrap gap-2">
                  {["active", "pending", "inactive"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                        status === s
                          ? "border-sky-600 bg-sky-600 text-white dark:border-sky-500 dark:bg-sky-500"
                          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {role !== "admin" && (
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                <Toggle label="Projects Access" value={permissions.projectsAccess} onChange={() => togglePermission("projectsAccess")} />
                <Toggle label="Transactions Access" value={permissions.transactionsAccess} onChange={() => togglePermission("transactionsAccess")} />
                <Toggle label="Affiliate Access" value={permissions.affiliateAccess} onChange={() => togglePermission("affiliateAccess")} />
                <Toggle label="Meta Ad Access" value={permissions.metaAdAccess} onChange={() => togglePermission("metaAdAccess")} />
              </div>
            )}
          </div>
        )}

        {activeTab === "Team Card" && (
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Team Member Public Card</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                This card will be visible to other team members and stakeholders, including username.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <Field label="Username" value={teamMemberUsername} onChange={setTeamMemberUsername} />
              <Field label="Avatar URL" value={teamAvatar} onChange={setTeamAvatar} />
              <Field label="Display Name" value={teamDisplayName} onChange={setTeamDisplayName} />
              <Field label="Headline / Role" value={teamHeadline} onChange={setTeamHeadline} />
              <Field label="Company" value={teamCompany} onChange={setTeamCompany} />
              <Field label="Phone" value={teamPhone} onChange={setTeamPhone} />
              <Field label="Public Email" value={teamPublicEmail} onChange={setTeamPublicEmail} />
              <Field label="Location" value={teamLocation} onChange={setTeamLocation} />
              <Field label="Primary Website" value={teamWebsite} onChange={setTeamWebsite} />
              <Field label="Department" value={teamDepartment} onChange={setTeamDepartment} />
              <Field label="Employee Code" value={teamEmployeeCode} onChange={setTeamEmployeeCode} />
            </div>

            <TextArea label="About" value={teamAbout} onChange={setTeamAbout} rows={5} />
            <TextArea label="Skills (comma separated)" value={teamSkills} onChange={setTeamSkills} rows={3} />

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60">
              <p className="mb-4 text-sm font-bold text-slate-800 dark:text-slate-100">Social Links</p>
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {SOCIAL_KEYS.map((key) => (
                  <Field
                    key={key}
                    label={key}
                    value={teamSocialLinks[key] || ""}
                    onChange={(value) =>
                      setTeamSocialLinks((current) => ({ ...current, [key]: value }))
                    }
                  />
                ))}
              </div>
            </div>

            <TimelineEditor
              title="Experience"
              items={teamExperience}
              onChange={(index, key, value) => updateTimelineField("experience", index, key, value)}
              onAdd={() => addTimelineItem("experience")}
              onRemove={(index) => removeTimelineItem("experience", index)}
            />

            <TimelineEditor
              title="Projects"
              items={teamProjects}
              onChange={(index, key, value) => updateTimelineField("projects", index, key, value)}
              onAdd={() => addTimelineItem("projects")}
              onRemove={(index) => removeTimelineItem("projects", index)}
            />
          </div>
        )}

        {message.text ? (
          <p className={`text-sm font-medium ${message.type === "error" ? "text-red-600" : "text-green-600"}`}>
            {message.text}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
            Cancel
          </button>
          <button onClick={submit} disabled={loading} className="rounded-lg bg-sky-600 px-4 py-2 font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60 dark:bg-sky-500 dark:hover:bg-sky-400">
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
      <label className="text-xs font-bold capitalize text-slate-500 dark:text-slate-400">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-sky-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500"
      />
    </div>
  );
}

function TextArea({ label, value, onChange, rows = 4 }) {
  return (
    <div>
      <label className="text-xs font-bold capitalize text-slate-500 dark:text-slate-400">{label}</label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-sky-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500"
      />
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
      <span className="text-sm text-slate-700 dark:text-slate-200">{label}</span>
      <button onClick={onChange} className={`relative h-6 w-12 rounded-full transition ${value ? "bg-sky-600 dark:bg-sky-500" : "bg-slate-300 dark:bg-slate-700"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${value ? "right-0.5" : "left-0.5"}`} />
      </button>
    </div>
  );
}

function TimelineEditor({ title, items, onChange, onAdd, onRemove }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</p>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <Plus size={15} />
          Add {title === "Experience" ? "Experience" : "Project"}
        </button>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={`${title}-${index}`} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/70">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{title} #{index + 1}</p>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-2 py-1 text-xs font-bold text-red-500 sm:w-auto"
              >
                <Trash2 size={14} />
                Remove
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <Field
                label={title === "Experience" ? "Headline / Position" : "Project Name"}
                value={item.title}
                onChange={(value) => onChange(index, "title", value)}
              />
              <Field
                label={title === "Experience" ? "Company" : "Client / Company"}
                value={item.company}
                onChange={(value) => onChange(index, "company", value)}
              />
            </div>
            <div className="mt-4">
              <Field label="From - To / Year Range" value={item.duration} onChange={(value) => onChange(index, "duration", value)} />
            </div>
            <div className="mt-4">
              <TextArea label="Description" value={item.description} onChange={(value) => onChange(index, "description", value)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
