module.exports = {
  apps: [
    {
      name: 'portfolio-api-v2',
      script: 'index.js',
      cwd: '/home/ubuntu/apps/newakhilesh/server/portfolio-api',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
      },
      error_file: '/home/ubuntu/logs/api-v2-error.log',
      out_file: '/home/ubuntu/logs/api-v2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
