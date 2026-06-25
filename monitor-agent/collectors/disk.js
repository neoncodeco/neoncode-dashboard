export async function collectDisk(si) {
  const [fsSize, fsUsage, blockDevices] = await Promise.all([
    si.fsSize(),
    si.fsSize(),
    si.blockDevices(),
  ]);

  const main = fsSize[0] || {};
  const total = fsSize.reduce((sum, item) => sum + (item.size || 0), 0);
  const used = fsSize.reduce((sum, item) => sum + (item.used || 0), 0);
  const free = fsSize.reduce((sum, item) => sum + (item.available || 0), 0);
  const usedPercent = total > 0 ? Number(((used / total) * 100).toFixed(2)) : 0;

  const partitions = fsUsage.map((item) => ({
    fs: item.fs,
    mount: item.mount,
    type: item.type,
    size: item.size,
    used: item.used,
    available: item.available,
    usedPercent: Number(item.use || 0),
  }));

  return {
    total,
    used,
    free,
    usedPercent,
    usagePercent: usedPercent,
    partitions,
    blockDevices: (blockDevices || []).slice(0, 8).map((item) => ({
      name: item.name,
      type: item.type,
      size: item.size,
      mount: item.mount,
    })),
    mainMount: main.mount || "/",
  };
}
