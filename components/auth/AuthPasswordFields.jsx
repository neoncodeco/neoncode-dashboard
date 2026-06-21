"use client";

import { Check, Eye, EyeOff, LockKeyhole, X } from "lucide-react";

function getPasswordChecks(password) {
  const value = String(password || "");
  return {
    length: value.length >= 6,
    letter: /[A-Za-z]/.test(value),
    number: /\d/.test(value),
  };
}

export default function AuthPasswordFields({
  password,
  confirmPassword,
  onPasswordChange,
  onConfirmPasswordChange,
  showPassword = false,
  onToggleShowPassword,
  passwordLabel = "Password",
  confirmLabel = "Confirm Password",
  passwordPlaceholder = "Create a secure password",
  confirmPlaceholder = "Re-enter your password",
}) {
  const checks = getPasswordChecks(password);
  const strengthScore = Object.values(checks).filter(Boolean).length;
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-[#d2e4d3]/48 sm:text-xs">
          {passwordLabel}
        </span>
        <div className="group relative overflow-hidden rounded-[16px] border border-white/10 bg-white/[0.04] transition duration-300 focus-within:border-[#d8ff30]/35 focus-within:shadow-[0_0_0_1px_rgba(216,255,48,0.15),0_0_30px_rgba(0,255,213,0.12)]">
          <div className="relative flex items-center">
            <div className="pl-4 text-[#d8ff30]/86">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder={passwordPlaceholder}
              autoComplete="new-password"
              className="h-14 w-full bg-transparent px-4 py-3 text-[15px] text-[#f6ffea] outline-none placeholder:text-[#cad8ca]/36 sm:text-base"
            />
            {onToggleShowPassword ? (
              <button
                type="button"
                onClick={onToggleShowPassword}
                className="mr-4 rounded-full p-1 text-[#d6ead6]/66 transition hover:text-[#f3ffe4]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            ) : null}
          </div>
        </div>
      </label>

      {password.length > 0 ? (
        <div className="rounded-[14px] border border-white/8 bg-white/[0.03] px-4 py-3">
          <div className="mb-3 flex gap-1.5">
            {[1, 2, 3].map((level) => (
              <span
                key={level}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  strengthScore >= level ? "bg-[#d8ff30]" : "bg-white/10"
                }`}
              />
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <PasswordCheckItem ok={checks.length} label="6+ characters" />
            <PasswordCheckItem ok={checks.letter} label="Contains letter" />
            <PasswordCheckItem ok={checks.number} label="Contains number" />
          </div>
        </div>
      ) : null}

      <label className="block">
        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-[#d2e4d3]/48 sm:text-xs">
          {confirmLabel}
        </span>
        <div
          className={`group relative overflow-hidden rounded-[16px] border bg-white/[0.04] transition duration-300 focus-within:shadow-[0_0_0_1px_rgba(216,255,48,0.15),0_0_30px_rgba(0,255,213,0.12)] ${
            passwordsMismatch
              ? "border-[#ff6d6d]/35 focus-within:border-[#ff6d6d]/45"
              : passwordsMatch
                ? "border-[#9ddb52]/35 focus-within:border-[#9ddb52]/45"
                : "border-white/10 focus-within:border-[#d8ff30]/35"
          }`}
        >
          <div className="relative flex items-center">
            <div className="pl-4 text-[#d8ff30]/86">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => onConfirmPasswordChange(e.target.value)}
              placeholder={confirmPlaceholder}
              autoComplete="new-password"
              className="h-14 w-full bg-transparent px-4 py-3 text-[15px] text-[#f6ffea] outline-none placeholder:text-[#cad8ca]/36 sm:text-base"
            />
            {confirmPassword.length > 0 ? (
              <div className="mr-4">
                {passwordsMatch ? (
                  <Check className="h-5 w-5 text-[#9ddb52]" />
                ) : (
                  <X className="h-5 w-5 text-[#ff8f8f]" />
                )}
              </div>
            ) : null}
          </div>
        </div>
        {passwordsMismatch ? (
          <p className="mt-2 text-xs text-[#ffb4b4]">Passwords do not match.</p>
        ) : passwordsMatch ? (
          <p className="mt-2 text-xs text-[#c8f7a2]">Passwords match.</p>
        ) : null}
      </label>
    </div>
  );
}

function PasswordCheckItem({ ok, label }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${ok ? "text-[#c8f7a2]" : "text-[#d3e0d2]/55"}`}>
      {ok ? <Check className="h-3.5 w-3.5" /> : <span className="h-3.5 w-3.5 rounded-full border border-white/15" />}
      {label}
    </span>
  );
}
