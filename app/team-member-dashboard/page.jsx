"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Download,
  ExternalLink,
  ImagePlus,
  Loader2,
  Plus,
  QrCode,
  Save,
  ShieldCheck,
  Trash2,
  UploadCloud,
  UserRoundSearch,
} from "lucide-react";
import {
  FaBehance,
  FaDribbble,
  FaFacebookF,
  FaGithub,
  FaGlobe,
  FaInstagram,
  FaLinkedinIn,
  FaPinterestP,
  FaTelegramPlane,
  FaTwitter,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";

const SOCIAL_FIELDS = [
  { key: "website", label: "Website", placeholder: "https://yourwebsite.com", icon: FaGlobe },
  { key: "github", label: "GitHub", placeholder: "https://github.com/username", icon: FaGithub },
  { key: "twitter", label: "Twitter / X", placeholder: "https://x.com/username", icon: FaTwitter },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@channel", icon: FaYoutube },
  { key: "dribbble", label: "Dribbble", placeholder: "https://dribbble.com/username", icon: FaDribbble },
  { key: "behance", label: "Behance", placeholder: "https://behance.net/username", icon: FaBehance },
  { key: "pinterest", label: "Pinterest", placeholder: "https://pinterest.com/username", icon: FaPinterestP },
  { key: "whatsapp", label: "WhatsApp", placeholder: "https://wa.me/8801XXXXXXXXX", icon: FaWhatsapp },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/username", icon: FaLinkedinIn },
  { key: "telegram", label: "Telegram", placeholder: "https://t.me/username", icon: FaTelegramPlane },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/username", icon: FaInstagram },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/username", icon: FaFacebookF },
];

const createTimelineItem = () => ({
  title: "",
  company: "",
  duration: "",
  description: "",
});

function skillsToText(items) {
  return Array.isArray(items) ? items.join(", ") : "";
}

function createInitialForm(userData) {
  return {
    username: "",
    displayName: userData?.name || "",
    headline: "",
    company: "Neon Code",
    phone: "",
    publicEmail: userData?.email || "",
    location: "",
    website: "",
    department: "",
    employeeCode: "",
    about: "",
    avatar: userData?.photo || "",
    skillsText: "",
    experience: [createTimelineItem()],
    projects: [createTimelineItem()],
    socialLinks: SOCIAL_FIELDS.reduce((acc, item) => ({ ...acc, [item.key]: "" }), {}),
  };
}

function normalizeTimeline(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return [createTimelineItem()];
  }

  return items.map((item) => ({
    title: item?.title || "",
    company: item?.company || "",
    duration: item?.duration || "",
    description: item?.description || "",
  }));
}

export default function TeamMemberDashboardPage() {
  const { token, userData, refreshUser } = useFirebaseAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [form, setForm] = useState(createInitialForm(userData));
  const [profileState, setProfileState] = useState({
    usernameLocked: false,
    publicUrl: "",
    qrUrl: "",
  });

  useEffect(() => {
    if (!token) return;

    const loadProfile = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/team-member/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load profile");

        const profile = json?.data?.profile || {};
        setForm({
          username: json?.data?.username || "",
          displayName: profile.displayName || userData?.name || "",
          headline: profile.headline || "",
          company: profile.company || "Neon Code",
          phone: profile.phone || "",
          publicEmail: profile.publicEmail || userData?.email || "",
          location: profile.location || "",
          website: profile.website || "",
          department: profile.department || "",
          employeeCode: profile.employeeCode || "",
          about: profile.about || "",
          avatar: profile.avatar || userData?.photo || "",
          skillsText: skillsToText(profile.skills),
          experience: normalizeTimeline(profile.experience),
          projects: normalizeTimeline(profile.projects),
          socialLinks: {
            ...SOCIAL_FIELDS.reduce((acc, item) => ({ ...acc, [item.key]: "" }), {}),
            ...(profile.socialLinks || {}),
          },
        });
        setProfileState({
          usernameLocked: Boolean(json?.data?.usernameLocked),
          publicUrl: json?.data?.publicUrl || "",
          qrUrl: json?.data?.qrUrl || "",
        });
      } catch (error) {
        setStatus({ type: "error", message: error.message || "Failed to load profile" });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [token, userData?.email, userData?.name, userData?.photo]);

  const previewUsername = useMemo(() => form.username.trim().toLowerCase(), [form.username]);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateSocialField = (key, value) => {
    setForm((current) => ({
      ...current,
      socialLinks: { ...current.socialLinks, [key]: value },
    }));
  };

  const updateTimelineField = (section, index, key, value) => {
    setForm((current) => ({
      ...current,
      [section]: current[section].map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      ),
    }));
  };

  const addTimelineItem = (section) => {
    setForm((current) => ({
      ...current,
      [section]: [...current[section], createTimelineItem()],
    }));
  };

  const removeTimelineItem = (section, index) => {
    setForm((current) => {
      const nextItems = current[section].filter((_, itemIndex) => itemIndex !== index);
      return {
        ...current,
        [section]: nextItems.length ? nextItems : [createTimelineItem()],
      };
    });
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setStatus({ type: "", message: "" });

    try {
      const uploadData = new FormData();
      uploadData.append("image", file);

      const res = await fetch("/api/upload/screenshot", {
        method: "POST",
        body: uploadData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Image upload failed");

      setForm((current) => ({ ...current, avatar: json.url || current.avatar }));
      setStatus({ type: "success", message: "Image uploaded. Save profile to publish it." });
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Image upload failed" });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!token) return;

    setSaving(true);
    setStatus({ type: "", message: "" });

    try {
      const res = await fetch("/api/team-member/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: form.username,
          profile: {
            displayName: form.displayName,
            headline: form.headline,
            company: form.company,
            phone: form.phone,
            publicEmail: form.publicEmail,
            location: form.location,
            website: form.website,
            department: form.department,
            employeeCode: form.employeeCode,
            about: form.about,
            avatar: form.avatar,
            socialLinks: form.socialLinks,
            skills: form.skillsText,
            experience: form.experience,
            projects: form.projects,
          },
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Save failed");

      setProfileState({
        usernameLocked: Boolean(json?.data?.usernameLocked),
        publicUrl: json?.data?.publicUrl || "",
        qrUrl: json?.data?.qrUrl || "",
      });
      setForm((current) => ({ ...current, username: json?.data?.username || current.username }));
      await refreshUser();
      setStatus({ type: "success", message: "Premium public profile saved successfully." });
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Save failed" });
    } finally {
      setSaving(false);
    }
  };

  const downloadQr = async () => {
    if (!profileState.qrUrl || !previewUsername) return;

    try {
      const res = await fetch(profileState.qrUrl);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${previewUsername || "team-member"}-qr.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      setStatus({ type: "error", message: "QR download failed. Try opening the QR image directly." });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-sky-300" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent px-3 py-4 sm:px-4 sm:py-6 md:px-6 lg:px-8 md:py-8">
      <div className="mx-auto grid max-w-7xl gap-5 lg:gap-6 xl:grid-cols-[0.95fr_1.85fr] xl:gap-8">
        <section className="rounded-[2rem] border border-sky-300/15 bg-[linear-gradient(180deg,rgba(7,18,37,0.95),rgba(8,16,30,0.92))] p-4 shadow-[0_25px_80px_rgba(0,0,0,0.45)] sm:p-6 sm:rounded-[2.3rem]">
          <div className="rounded-[1.6rem] border border-sky-400/15 bg-[radial-gradient(circle_at_top,rgba(48,102,255,0.2),rgba(8,14,27,0.96)_65%)] p-4 sm:p-6 sm:rounded-[2rem]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-sky-100/55">Verified Team Card</p>
                <h1 className="mt-3 text-2xl font-black text-white sm:text-3xl">{form.displayName || "Team Member"}</h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-sky-100/70">{form.headline || "Your public-facing Neon identity card."}</p>
              </div>
              <div className="w-fit rounded-2xl bg-emerald-400/15 px-3 py-2 text-xs font-bold text-emerald-200">
                <ShieldCheck size={14} className="inline-block" /> Verified
              </div>
            </div>

            <div className="mt-6 flex flex-col items-center gap-4">
              <div className="relative">
                <img
                  src={form.avatar || userData?.photo || "https://i.ibb.co/kgp65LMf/profile-avater.png"}
                  alt={form.displayName || "Team member"}
                  className="h-36 w-36 rounded-[1.6rem] border border-sky-400/25 object-cover shadow-[0_0_70px_rgba(55,125,255,0.2)] sm:h-44 sm:w-44 sm:rounded-[2rem]"
                />
                <label className="absolute -bottom-3 right-1 flex cursor-pointer items-center gap-2 rounded-2xl bg-sky-400 px-3 py-2 text-[11px] font-black text-slate-950 shadow-lg sm:right-3 sm:px-4 sm:text-xs">
                  {uploadingImage ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
                  Upload
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>

              <div className="w-full rounded-[1.5rem] border border-sky-400/15 bg-slate-950/70 p-4 text-center sm:rounded-[1.8rem] sm:p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-sky-100/50">Profile Route</p>
                <p className="mt-3 break-all text-base font-bold text-white sm:text-lg">
                 https://neoncode.co/teammember/{previewUsername || "your-username"}
                </p>
                <p className="mt-2 text-sm text-sky-100/62">
                  Username stays locked after the first successful save, so your ID card QR can stay unchanged.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[1.6rem] border border-sky-400/15 bg-slate-950/70 p-4 sm:rounded-[2rem] sm:p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <QrCode size={18} />
              Fixed QR
            </div>
            {profileState.qrUrl ? (
              <>
                <img src={profileState.qrUrl} alt="Public profile QR" className="mt-4 w-full rounded-[1.6rem] bg-white p-4" />
                <p className="mt-3 text-sm leading-6 text-sky-100/68">
                  This QR stays the same for your ID card. You can still update the profile data anytime and the scanned page will show the latest info.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={downloadQr}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-sky-400 px-4 py-3 text-sm font-black text-slate-950"
                  >
                    <Download size={16} />
                    Download QR
                  </button>
                  <Link
                    href={profileState.publicUrl}
                    target="_blank"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-sky-400/25 px-4 py-3 text-sm font-bold text-sky-100"
                  >
                    Open public card
                    <ExternalLink size={15} />
                  </Link>
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm text-sky-100/70">Save your unique username first. QR will be generated automatically.</p>
            )}
          </div>
        </section>

        <form onSubmit={handleSave} className="rounded-[2rem] border border-sky-300/15 bg-[linear-gradient(180deg,rgba(7,18,37,0.95),rgba(8,16,30,0.92))] p-4 shadow-[0_25px_80px_rgba(0,0,0,0.45)] sm:p-6 sm:rounded-[2.3rem]">
          <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-sky-100/55">Premium Team Builder</p>
              <h2 className="mt-2 text-xl font-black text-white sm:text-2xl">Design Your Public Identity</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-sky-100/70">
                For experience and projects, use `Add More` below to add as many entries as you need.
              </p>
            </div>
            <button
              type="submit"
              disabled={saving || uploadingImage}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-400 px-6 py-3 text-sm font-black text-slate-950 disabled:opacity-70 sm:w-auto"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>

          <div className="grid gap-4 xl:grid-cols-2 xl:gap-5">
            <Field
              label="Unique Username"
              value={form.username}
              onChange={(value) => updateField("username", value)}
              placeholder="Your unique username for public profile URL"
              disabled={profileState.usernameLocked}
              helper={profileState.usernameLocked ? "Username locked permanently." : "Only letters, numbers, underscore and dash."}
            />
            <Field label="Display Name" value={form.displayName} onChange={(value) => updateField("displayName", value)} />
            <Field label="Headline / Role" value={form.headline} onChange={(value) => updateField("headline", value)} />
            <Field label="Company" value={form.company} onChange={(value) => updateField("company", value)} />
            <Field label="Phone" value={form.phone} onChange={(value) => updateField("phone", value)} />
            <Field label="Public Email" value={form.publicEmail} onChange={(value) => updateField("publicEmail", value)} />
            <Field label="Location" value={form.location} onChange={(value) => updateField("location", value)} />
            <Field label="Primary Website" value={form.website} onChange={(value) => updateField("website", value)} />
            <Field label="Department" value={form.department} onChange={(value) => updateField("department", value)} />
            <Field label="Employee Code" value={form.employeeCode} onChange={(value) => updateField("employeeCode", value)} />
          </div>

          <div className="mt-8 rounded-[1.6rem] border border-sky-400/12 bg-slate-950/55 p-4 sm:rounded-[2rem] sm:p-5">
            <div className="mb-5 flex items-center gap-2 text-sm font-bold text-white">
              <UploadCloud size={18} />
              Social Media Links
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              {SOCIAL_FIELDS.map((item) => (
                <SocialField
                  key={item.key}
                  label={item.label}
                  value={form.socialLinks[item.key] || ""}
                  onChange={(value) => updateSocialField(item.key, value)}
                  placeholder={item.placeholder}
                  icon={item.icon}
                />
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:gap-5">
            <TextArea
              label="About"
              value={form.about}
              onChange={(value) => updateField("about", value)}
              rows={5}
              placeholder="Write a premium public introduction"
            />
            <TextArea
              label="Skills"
              value={form.skillsText}
              onChange={(value) => updateField("skillsText", value)}
              rows={3}
              placeholder="JavaScript, React, Next.js, Node.js"
            />
          </div>

          <TimelineEditor
            title="Experience"
            subtitle="Prottek experience e headline/title, company, year range, ar description dao."
            items={form.experience}
            onChange={(index, key, value) => updateTimelineField("experience", index, key, value)}
            onAdd={() => addTimelineItem("experience")}
            onRemove={(index) => removeTimelineItem("experience", index)}
            addLabel="Add Experience"
          />

          <TimelineEditor
            title="Projects"
            subtitle="Prottek project e project name, client/company, year range, ar short description dao."
            items={form.projects}
            onChange={(index, key, value) => updateTimelineField("projects", index, key, value)}
            onAdd={() => addTimelineItem("projects")}
            onRemove={(index) => removeTimelineItem("projects", index)}
            addLabel="Add Project"
          />

          {status.message ? (
            <div
              className={`mt-6 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm ${
                status.type === "success" ? "bg-emerald-500/15 text-emerald-200" : "bg-red-500/15 text-red-200"
              }`}
            >
              {status.type === "success" ? <CheckCircle2 size={18} /> : <UserRoundSearch size={18} />}
              {status.message}
            </div>
          ) : null}
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder = "", disabled = false, helper = "" }) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-sky-100/55">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full min-w-0 rounded-2xl border border-sky-400/20 bg-slate-950/70 px-4 py-3 text-sm text-white disabled:cursor-not-allowed disabled:opacity-65"
      />
      {helper ? <span className="mt-2 block text-xs text-sky-100/50">{helper}</span> : null}
    </label>
  );
}

function TextArea({ label, value, onChange, rows, placeholder }) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-sky-100/55">{label}</span>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full min-w-0 rounded-[1.5rem] border border-sky-400/20 bg-slate-950/70 px-4 py-3 text-sm text-white"
      />
    </label>
  );
}

function SocialField({ label, value, onChange, placeholder, icon: Icon }) {
  return (
    <label className="block min-w-0 rounded-[1.35rem] border border-sky-400/12 bg-slate-950/55 p-4 sm:rounded-[1.5rem]">
      <span className="mb-3 flex min-w-0 items-center gap-3 text-sm font-bold text-white">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-500/12 text-sky-300">
          <Icon size={18} />
        </span>
        <span className="truncate">{label}</span>
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full min-w-0 rounded-2xl border border-sky-400/18 bg-slate-950/70 px-4 py-3 text-sm text-white"
      />
      <span className="mt-2 block text-[11px] text-sky-100/42">Link your {label} profile</span>
    </label>
  );
}

function TimelineEditor({ title, subtitle, items, onChange, onAdd, onRemove, addLabel }) {
  return (
    <section className="mt-8 rounded-[1.6rem] border border-sky-400/12 bg-slate-950/55 p-4 sm:rounded-[2rem] sm:p-5">
      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h3 className="text-lg font-black text-white">{title}</h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-sky-100/60">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-sky-400/20 px-4 py-2 text-sm font-bold text-sky-100 sm:w-auto"
        >
          <Plus size={16} />
          {addLabel}
        </button>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={`${title}-${index}`} className="rounded-[1.35rem] border border-sky-400/12 bg-slate-950/65 p-4 sm:rounded-[1.6rem]">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-bold text-white">{title} #{index + 1}</p>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-red-200 hover:bg-red-500/10 sm:w-auto"
              >
                <Trash2 size={14} />
                Remove
              </button>
            </div>

            <div className="grid gap-4 2xl:grid-cols-2">
              <Field
                label={title === "Experience" ? "Headline / Position" : "Project Name"}
                value={item.title}
                onChange={(value) => onChange(index, "title", value)}
                placeholder={title === "Experience" ? "Senior Frontend Engineer" : "Neon CRM Platform"}
              />
              <Field
                label={title === "Experience" ? "Company" : "Client / Company"}
                value={item.company}
                onChange={(value) => onChange(index, "company", value)}
                placeholder={title === "Experience" ? "Neon Code" : "Internal / Neon Code"}
              />
            </div>

            <div className="mt-4">
              <Field
                label="From - To / Year Range"
                value={item.duration}
                onChange={(value) => onChange(index, "duration", value)}
                placeholder="Jan 2023 - Present"
              />
            </div>

            <div className="mt-4">
              <TextArea
                label="Description"
                value={item.description}
                onChange={(value) => onChange(index, "description", value)}
                rows={4}
                placeholder={
                  title === "Experience"
                    ? "What did you do in this role?"
                    : "What was this project about and what was your contribution?"
                }
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
