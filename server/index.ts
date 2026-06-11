import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { initDB } from './config/db.js';

const PORT = process.env.PORT || 3001;

async function start() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`[Server] Backend running on http://localhost:${PORT}`);
    console.log(`[Server] Health check: http://localhost:${PORT}/health`);
  });
}

start().catch((err) => {
  console.error('[Server] Failed to start:', err);
  process.exit(1);
});
