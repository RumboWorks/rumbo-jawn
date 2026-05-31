// PM2 process definitions. Must be .cjs because the root package uses "type": "module".
module.exports = {
  apps: [
    {
      name: 'rumbo-web',
      script: './apps/platform-web/src/index.js',
      env: {
        NODE_ENV: 'development',
        PORT: 4000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
    },
    {
      name: 'rumbo-worker',
      script: './apps/worker/src/index.js',
      node_args: '--require ./polyfills.cjs',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
