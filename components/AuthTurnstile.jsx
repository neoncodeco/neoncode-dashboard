"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";

const AuthTurnstile = forwardRef(function AuthTurnstile({ onTokenChange, className, action }, ref) {
  const innerRef = useRef(null);
  const [widgetError, setWidgetError] = useState("");
  const [remountKey, setRemountKey] = useState(0);

  useImperativeHandle(ref, () => ({
    reset: () => {
      setWidgetError("");
      onTokenChange?.("");
      setRemountKey((k) => k + 1);
    },
  }));

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  if (!siteKey) return null;

  const handleRetry = () => {
    setWidgetError("");
    onTokenChange?.("");
    setRemountKey((k) => k + 1);
  };

  return (
    <div className={className}>
      {widgetError ? (
        <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
          <p className="font-medium">{widgetError}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-2 font-semibold text-amber-950 underline hover:no-underline"
          >
            Retry security check
          </button>
        </div>
      ) : null}
      {!widgetError ? (
        <Turnstile
          key={remountKey}
          ref={innerRef}
          siteKey={siteKey}
          options={{ theme: "dark", action }}
          onSuccess={(t) => {
            setWidgetError("");
            onTokenChange?.(t);
          }}
          onExpire={() => {
            onTokenChange?.("");
            setWidgetError("Security check expired. Click retry below.");
          }}
          onError={() => {
            // Do NOT call reset() here — causes infinite reload loop on error 110200
            onTokenChange?.("");
            setWidgetError(
              "Security check failed. If this keeps happening, add your domain in Cloudflare Turnstile → Hostname Management (error 110200 = domain not authorized)."
            );
          }}
        />
      ) : null}
    </div>
  );
});

export default AuthTurnstile;
