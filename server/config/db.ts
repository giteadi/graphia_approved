import mysql, { PoolConnection } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'graphia',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

function createPool() {
  return mysql.createPool(DB_CONFIG);
}

export let pool = createPool();

// Query helper — auto-recreates pool on connection errors
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows as T[];
  } catch (err: any) {
    console.error('[DB] Query error:', err.message);
    if (
      err.code === 'PROTOCOL_CONNECTION_LOST' ||
      err.code === 'ECONNRESET' ||
      err.code === 'ECONNREFUSED'
    ) {
      console.warn('[DB] Recreating pool after connection loss...');
      pool = createPool();
    }
    throw err;
  }
}

// Init — auto-creates database + tables, retries forever if MySQL is down
export async function initDB() {
  let retries = 0;

  while (true) {
    let conn: PoolConnection | undefined;
    try {
      // Connect without database first to ensure DB exists
      const tempConn = await mysql.createConnection({
        host: DB_CONFIG.host,
        port: DB_CONFIG.port,
        user: DB_CONFIG.user,
        password: DB_CONFIG.password,
      });
      await tempConn.execute(
        `CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
      console.log(`[DB] Database '${DB_CONFIG.database}' ensured ✓`);
      await tempConn.end();

      // Recreate pool now that DB exists
      pool = createPool();
      conn = await pool.getConnection();
      console.log('[DB] Connected ✓');

      await conn.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id         INT AUTO_INCREMENT PRIMARY KEY,
          name       VARCHAR(100) NOT NULL,
          email      VARCHAR(150) NOT NULL UNIQUE,
          password   VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await conn.execute(`
        CREATE TABLE IF NOT EXISTS reports (
          id          INT AUTO_INCREMENT PRIMARY KEY,
          user_id     INT NOT NULL,
          grade       VARCHAR(50),
          report_text LONGTEXT,
          created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      console.log('[DB] Tables ready ✓');
      break;
    } catch (err: any) {
      retries++;
      console.error(`[DB] Connection failed (attempt ${retries}). Retrying in 5s...`, err.message);
      await new Promise(r => setTimeout(r, 5000));
      pool = createPool();
    } finally {
      conn?.release();
    }
  }
}
