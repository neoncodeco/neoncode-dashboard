"use client";

import { Lock } from "lucide-react";

export default function ReadOnlyNotice({ className = "" }) {
  return (
    <div
      className={`absolute inset-0 z-40 flex items-start justify-center bg-[rgba(6,11,24,0.56)] backdrop-blur-[2px] ${className}`.trim()}
    >
      <div className="mx-4 mt-24 max-w-xl rounded-[28px] border border-[var(--dashboard-frame-border)] bg-[var(--dashboard-frame-bg)] p-5 text-center shadow-2xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--dashboard-panel-soft)]">
          <Lock size={18} className="dashboard-text-strong" />
        </div>
        <h3 className="mt-4 text-lg font-black dashboard-text-strong">Read-Only Account</h3>
        <p className="mt-2 text-sm dashboard-text-muted">
          Your account has been restricted by admin. You can browse pages from the sidebar, but new actions and submissions are disabled.
        </p>
      </div>
    </div>
  );
}
