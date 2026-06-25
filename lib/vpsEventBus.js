const listeners = new Set();

export function subscribeVpsMetrics(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function publishVpsMetrics(payload) {
  for (const listener of listeners) {
    try {
      listener(payload);
    } catch (error) {
      console.error("VPS SSE listener error:", error);
    }
  }
}
