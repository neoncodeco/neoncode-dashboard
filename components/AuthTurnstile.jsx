"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { Turnstile } from "@marsidev/react-turnstile";

const AuthTurnstile = forwardRef(function AuthTurnstile({ onTokenChange, className, action }, ref) {
  const innerRef = useRef(null);
  useImperativeHandle(ref, () => ({
    reset: () => innerRef.current?.reset(),
  }));

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) return null;

  return (
    <div className={className}>
      <Turnstile
        ref={innerRef}
        siteKey={siteKey}
        options={{ theme: "dark", action }}
        onSuccess={(t) => onTokenChange?.(t)}
        onExpire={() => {
          onTokenChange?.("");
          innerRef.current?.reset();
        }}
        onError={() => {
          onTokenChange?.("");
          innerRef.current?.reset();
        }}
      />
    </div>
  );
});

export default AuthTurnstile;
