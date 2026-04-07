"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { BellRing, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useAdminDashboardCache } from "@/hooks/useAdminDashboardCache";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";

function formatDate(value) {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

const emptyForm = { title: "", message: "" };

export default function AdminNewsPage() {
  const { token } = useFirebaseAuth();
  const { getCache, setCache } = useAdminDashboardCache();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");

  const editingItem = useMemo(
    () => notifications.find((item) => item.id === editingId) || null,
    [editingId, notifications]
  );

  const loadNotifications = useCallback(async () => {
    if (!token) return;
    const cachedNotifications = getCache("admin-news:list");
    if (cachedNotifications) {
      setNotifications(cachedNotifications);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to load notifications");
      }
      setNotifications(data.notifications || []);
      setCache("admin-news:list", data.notifications || []);
    } catch (error) {
      console.error("LOAD ADMIN NEWS ERROR:", error);
      Swal.fire({ icon: "error", title: "Load failed", text: error.message || "Could not load news." });
    } finally {
      setLoading(false);
    }
  }, [getCache, setCache, token]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId("");
  };

  const handleSubmit = async () => {
    const title = form.title.trim();
    const message = form.message.trim();

    if (!title || !message) {
      Swal.fire({ icon: "warning", title: "Missing fields", text: "Title and message are required." });
      return;
    }

    setSaving(true);
    try {
      const isEditing = Boolean(editingId);
      const res = await fetch(isEditing ? `/api/admin/notifications/${editingId}` : "/api/admin/notifications", {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, message }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Save failed");
      }

      if (isEditing) {
        setNotifications((prev) => {
          const nextNotifications = prev.map((item) => (item.id === editingId ? data.notification : item));
          setCache("admin-news:list", nextNotifications);
          return nextNotifications;
        });
      } else {
        setNotifications((prev) => {
          const nextNotifications = [data.notification, ...prev];
          setCache("admin-news:list", nextNotifications);
          return nextNotifications;
        });
      }

      resetForm();
      Swal.fire({
        icon: "success",
        title: isEditing ? "Updated" : "Published",
        text: isEditing ? "Notification updated successfully." : "Notification published successfully.",
        timer: 1600,
      });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Save failed", text: error.message || "Could not save notification." });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({ title: item.title || "", message: item.message || "" });
  };

  const handleDelete = async (item) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete notification?",
      text: "This will remove it from every user dashboard.",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#475569",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/admin/notifications/${item.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Delete failed");
      }

      setNotifications((prev) => {
        const nextNotifications = prev.filter((entry) => entry.id !== item.id);
        setCache("admin-news:list", nextNotifications);
        return nextNotifications;
      });
      if (editingId === item.id) {
        resetForm();
      }
      Swal.fire({ icon: "success", title: "Deleted", text: "Notification removed.", timer: 1500 });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Delete failed", text: error.message || "Could not delete notification." });
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-[var(--dashboard-frame-border)] bg-[var(--dashboard-frame-bg)] p-6 shadow-[0_24px_50px_-34px_rgba(15,23,42,0.5)] sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-sky-300">
              <BellRing size={14} />
              Dashboard News
            </span>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-[var(--dashboard-text-strong)] sm:text-4xl">
              Publish Admin News
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--dashboard-text-muted)]">
              Admin dashboard theke shared notification publish, edit, ar delete koro. Published hole sob user dashboard e same news show korbe.
            </p>
          </div>
          <div className="dashboard-accent-surface inline-flex w-fit items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold">
            <BellRing size={16} />
            {notifications.length} News Item
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[0.95fr_1.25fr]">
        <div className="rounded-[2rem] border border-[var(--dashboard-frame-border)] bg-[var(--dashboard-frame-bg)] p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-[var(--dashboard-text-strong)]">
                {editingItem ? "Edit News" : "Publish News"}
              </h2>
              <p className="mt-1 text-xs font-medium text-[var(--dashboard-text-muted)]">
                {editingItem ? "Update the selected notification." : "Create a new dashboard-wide update."}
              </p>
            </div>
            {editingItem ? (
              <button
                type="button"
                onClick={resetForm}
                className="dashboard-muted-button rounded-2xl px-4 py-2 text-xs font-bold"
              >
                New Post
              </button>
            ) : null}
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-[var(--dashboard-text-faint)]">
                Title
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Write a short headline"
                className="dashboard-subpanel w-full rounded-2xl border px-4 py-4 text-sm font-semibold text-[var(--dashboard-text-strong)] outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-[var(--dashboard-text-faint)]">
                Message
              </label>
              <textarea
                rows={6}
                value={form.message}
                onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                placeholder="Explain the update users should see on their dashboard."
                className="dashboard-subpanel w-full rounded-[1.7rem] border px-4 py-4 text-sm leading-7 text-[var(--dashboard-text-strong)] outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="dashboard-accent-surface inline-flex w-full items-center justify-center gap-3 rounded-2xl px-5 py-4 text-sm font-black disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : editingItem ? <Pencil size={18} /> : <Plus size={18} />}
              {saving ? "Saving..." : editingItem ? "Update Notification" : "Publish Notification"}
            </button>
          </div>
        </div>

        <div className="rounded-[2rem] border border-[var(--dashboard-frame-border)] bg-[var(--dashboard-frame-bg)] p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-[var(--dashboard-text-strong)]">Published News</h2>
              <p className="mt-1 text-xs font-medium text-[var(--dashboard-text-muted)]">
                Latest updates currently available for all users.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="dashboard-subpanel flex min-h-[220px] items-center justify-center rounded-[1.8rem] px-4 py-10 text-sm font-bold text-[var(--dashboard-text-muted)]">
                <Loader2 size={18} className="mr-3 animate-spin" />
                Loading news...
              </div>
            ) : notifications.length ? (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[1.8rem] border border-[var(--dashboard-frame-border)] bg-[var(--dashboard-subpanel-bg)] px-5 py-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-black text-[var(--dashboard-text-strong)]">{item.title}</p>
                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">
                          Live
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-7 text-[var(--dashboard-text-muted)]">{item.message}</p>
                      <p className="mt-3 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--dashboard-text-faint)]">
                        Published {formatDate(item.publishedAt)}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="dashboard-muted-button inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs font-bold text-red-300 transition hover:bg-red-500/15"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="dashboard-subpanel rounded-[1.8rem] px-5 py-12 text-center">
                <p className="text-sm font-bold text-[var(--dashboard-text-strong)]">No news published yet</p>
                <p className="mt-2 text-xs text-[var(--dashboard-text-muted)]">
                  Publish your first notification from the form on the left.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
