export async function collectMemory(si) {
  const memory = await si.mem();
  const used = memory.active || memory.used || 0;
  const total = memory.total || 1;
  const usedPercent = Number(((used / total) * 100).toFixed(2));

  return {
    total: memory.total,
    used,
    free: memory.free,
    cached: memory.cached || 0,
    buffers: memory.buffers || 0,
    active: memory.active || 0,
    swapUsed: memory.swaptotal ? memory.swaptotal - memory.swapfree : 0,
    swapFree: memory.swapfree || 0,
    usedPercent,
    usagePercent: usedPercent,
  };
}
