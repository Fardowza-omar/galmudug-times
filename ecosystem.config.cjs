module.exports = {
  apps: [{
    name: 'galmudug-times',
    script: 'server.js',
    cwd: './api',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
