let previousNetwork = null;

export async function collectNetwork(si) {
  const [networkStats, networkInterfaces] = await Promise.all([
    si.networkStats(),
    si.networkInterfaces(),
  ]);

  const primary =
    networkStats.find((item) => item.operstate === "up" && !item.internal) || networkStats[0] || {};

  const rxBytes = primary.rx_bytes || 0;
  const txBytes = primary.tx_bytes || 0;
  const now = Date.now();

  let rxSec = 0;
  let txSec = 0;
  if (previousNetwork && previousNetwork.iface === primary.iface) {
    const deltaSec = Math.max((now - previousNetwork.at) / 1000, 0.001);
    rxSec = Math.max(0, (rxBytes - previousNetwork.rxBytes) / deltaSec);
    txSec = Math.max(0, (txBytes - previousNetwork.txBytes) / deltaSec);
  }

  previousNetwork = {
    iface: primary.iface,
    rxBytes,
    txBytes,
    at: now,
  };

  return {
    iface: primary.iface || "unknown",
    rxSec: Number(rxSec.toFixed(2)),
    txSec: Number(txSec.toFixed(2)),
    downloadSpeed: Number(rxSec.toFixed(2)),
    uploadSpeed: Number(txSec.toFixed(2)),
    rxTotal: rxBytes,
    txTotal: txBytes,
    totalDownload: rxBytes,
    totalUpload: txBytes,
    packets: (primary.rx_packets || 0) + (primary.tx_packets || 0),
    errors: (primary.rx_errors || 0) + (primary.tx_errors || 0),
    dropped: (primary.rx_dropped || 0) + (primary.tx_dropped || 0),
    interfaces: (networkInterfaces || []).slice(0, 6).map((item) => ({
      iface: item.iface,
      ip4: item.ip4,
      type: item.type,
      speed: item.speed,
    })),
  };
}
