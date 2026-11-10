'use strict';
const mongoose = require('mongoose');
const { port } = require('./config/env');
const { connectDb } = require('./config/db');
const app = require('./app');

(async () => {
  await connectDb();
  const server = app.listen(port, () => console.log(`Gateway listening on :${port}`));

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down`);
    server.close(async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
})().catch((err) => {
  console.error('Startup failed:', err);
  process.exit(1);
});
