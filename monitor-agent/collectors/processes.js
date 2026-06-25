export async function collectProcesses(si) {
  const processes = await si.processes();
  const list = (processes.list || [])
    .filter((item) => item.pid)
    .sort((a, b) => (b.cpu || 0) - (a.cpu || 0))
    .slice(0, 10)
    .map((item) => ({
      pid: item.pid,
      name: item.name || item.command || "unknown",
      cpu: Number(item.cpu?.toFixed(2) || 0),
      memory: item.mem || item.memRss || 0,
      user: item.user || "",
      command: item.command || item.name || "",
    }));

  return list;
}
