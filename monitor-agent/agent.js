import si from "systeminformation";
import os from "node:os";
import { collectCpu } from "./collectors/cpu.js";
import { collectMemory } from "./collectors/memory.js";
import { collectDisk } from "./collectors/disk.js";
import { collectNetwork } from "./collectors/network.js";
import { collectPm2 } from "./collectors/pm2.js";
import { collectProcesses } from "./collectors/processes.js";
import { collectSystem, collectDiskIo, collectHealth } from "./collectors/system.js";
import { getAgentConfig, postMetrics, validateAgentConfig } from "./services/api.js";

async function collectSnapshot() {
  const config = getAgentConfig();
  const [cpu, memory, storage, network, system, pm2Apps, processes, diskIo] = await Promise.all([
    collectCpu(si),
    collectMemory(si),
    collectDisk(si),
    collectNetwork(si),
    collectSystem(si),
    collectPm2(),
    collectProcesses(si),
    collectDiskIo(si),
  ]);

  const health = await collectHealth(si, memory, storage);

  return {
    serverId: config.serverId,
    hostname: system.hostname || os.hostname(),
    provider: "Contabo",
    publicIp: config.publicIp,
    timestamp: new Date().toISOString(),
    cpu,
    memory,
    storage,
    network,
    system,
    pm2: pm2Apps,
    processes,
    diskIo,
    health,
  };
}

async function tick() {
  const payload = await collectSnapshot();
  await postMetrics(payload);
  console.log(`[vps-agent] sent metrics for ${payload.serverId} at ${payload.timestamp}`);
}

async function main() {
  const config = getAgentConfig();
  const missing = validateAgentConfig(config);
  if (missing.length) {
    console.error(`[vps-agent] Missing env: ${missing.join(", ")}`);
    process.exit(1);
  }

  console.log(`[vps-agent] starting — ${config.serverId} → ${config.ingestUrl} every ${config.intervalMs}ms`);

  const run = async () => {
    try {
      await tick();
    } catch (error) {
      console.error("[vps-agent] tick failed:", error.message);
    }
  };

  await run();
  setInterval(run, config.intervalMs);
}

main().catch((error) => {
  console.error("[vps-agent] fatal:", error);
  process.exit(1);
});
