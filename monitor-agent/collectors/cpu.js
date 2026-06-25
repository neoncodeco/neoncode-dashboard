import os from "node:os";

export async function collectCpu(si) {
  const [load, cpu, cpuCurrent, processes] = await Promise.all([
    si.currentLoad(),
    si.cpu(),
    si.cpuCurrentSpeed(),
    si.processes(),
  ]);

  return {
    usage: Number(load.currentLoad?.toFixed(2) || 0),
    usagePercent: Number(load.currentLoad?.toFixed(2) || 0),
    perCore: (load.cpus || []).map((core) => Number(core.load?.toFixed(2) || 0)),
    loadAvg: os.loadavg(),
    processCount: processes.all || 0,
    speed: cpuCurrent.avg || cpu.speed || 0,
    model: cpu.brand || cpu.model || "Unknown",
    cores: cpu.cores || os.cpus().length,
  };
}
