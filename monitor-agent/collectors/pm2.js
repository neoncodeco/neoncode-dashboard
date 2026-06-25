import pm2 from "pm2";
import pidusage from "pidusage";

function pm2Connect() {
  return new Promise((resolve, reject) => {
    pm2.connect((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function pm2List() {
  return new Promise((resolve, reject) => {
    pm2.list((error, list) => {
      if (error) reject(error);
      else resolve(list || []);
    });
  });
}

export async function collectPm2() {
  try {
    await pm2Connect();
    const list = await pm2List();
    const stats = await Promise.all(
      list.map(async (app) => {
        let cpu = 0;
        let memory = 0;
        if (app.pid) {
          try {
            const usage = await pidusage(app.pid);
            cpu = Number(usage.cpu?.toFixed(2) || 0);
            memory = usage.memory || 0;
          } catch {
            // process may have exited between list and pidusage
          }
        }

        return {
          name: app.name,
          status: app.pm2_env?.status || "unknown",
          cpu,
          memory,
          uptime: app.pm2_env?.pm_uptime || 0,
          restarts: app.pm2_env?.restart_time || 0,
          pid: app.pid || null,
        };
      })
    );
    pm2.disconnect();
    return stats;
  } catch (error) {
    try {
      pm2.disconnect();
    } catch {
      // ignore
    }
    return [];
  }
}
