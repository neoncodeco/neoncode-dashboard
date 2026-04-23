"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Lazy-loads FingerprintJS and returns the visitorId when requested (e.g. on form submit).
 */
export default function useFingerprint() {
  const agentRef = useRef(null);
  const [loadingFingerprint, setLoadingFingerprint] = useState(false);

  const getFingerprint = useCallback(async () => {
    try {
      setLoadingFingerprint(true);
      const FingerprintJS = (await import("@fingerprintjs/fingerprintjs")).default;
      if (!agentRef.current) {
        agentRef.current = await FingerprintJS.load();
      }
      const result = await agentRef.current.get();
      return String(result?.visitorId || "").trim().slice(0, 255);
    } catch (error) {
      console.error("Fingerprint failed:", error);
      return "";
    } finally {
      setLoadingFingerprint(false);
    }
  }, []);

  return { getFingerprint, loadingFingerprint };
}
