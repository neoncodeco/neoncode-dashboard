module.exports = {
  apps: [
    {
      name: "neon-vps-monitor-agent",
      script: "agent.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "200M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
