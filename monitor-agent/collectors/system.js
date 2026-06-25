export async function collectSystem(si) {
  const [osInfo, time, versions] = await Promise.all([si.osInfo(), si.time(), si.versions()]);

  return {
    hostname: osInfo.hostname,
    os: `${osInfo.distro || osInfo.platform} ${osInfo.release || ""}`.trim(),
    kernel: osInfo.kernel,
    platform: osInfo.platform,
    arch: osInfo.arch,
    bootTime: time.uptime ? new Date(Date.now() - time.uptime * 1000).toISOString() : null,
    uptime: time.uptime || 0,
    timezone: time.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    node: versions.node,
  };
}

export async function collectDiskIo(si) {
  const disks = await si.disksIO();
  const primary = disks[0] || {};
  return {
    readSpeed: primary.rIO_sec || primary.rIO || 0,
    writeSpeed: primary.wIO_sec || primary.wIO || 0,
    ioWait: primary.tIO_sec || 0,
  };
}

export async function collectHealth(si, memory, storage) {
  let cpuTemp = null;
  try {
    const temp = await si.cpuTemperature();
    cpuTemp = temp.main || temp.cores?.[0] || null;
  } catch {
    cpuTemp = null;
  }

  const memoryPressure = memory.usedPercent || 0;
  const diskHealth = storage.usedPercent >= 90 ? "critical" : storage.usedPercent >= 80 ? "warning" : "healthy";

  return {
    cpuTemp,
    memoryPressure,
    diskHealth,
  };
}
