import mysql, { PoolConnection } from 'mysql2/promise';
import bcrypt from 'bcryptjs';

// Hardcoded production DB config — env override not used on server
const DB_CONFIG = {
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: 'Tiger@123',
  database: 'graphia',
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
      // Connect without selecting DB first — ensures DB gets created if missing
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
          mobile     VARCHAR(20),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Add mobile column if it doesn't exist (for existing tables)
      try {
        await conn.execute('ALTER TABLE users ADD COLUMN mobile VARCHAR(20)');
      } catch (err: any) {
        // Column might already exist, ignore error
        if (err.code !== 'ER_DUP_FIELDNAME') {
          console.warn('[DB] Note on mobile column:', err.message);
        }
      }

      await conn.execute(`
        CREATE TABLE IF NOT EXISTS reports (
          id          INT AUTO_INCREMENT PRIMARY KEY,
          user_id     INT NOT NULL,
          grade       VARCHAR(50),
          report_text LONGTEXT,
          probability VARCHAR(50),
          is_high_probability BOOLEAN DEFAULT FALSE,
          student_name VARCHAR(100),
          student_age VARCHAR(10),
          contact_info VARCHAR(200),
          created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      await conn.execute(`
        CREATE TABLE IF NOT EXISTS payments (
          id              INT AUTO_INCREMENT PRIMARY KEY,
          user_id         INT NOT NULL,
          amount          DECIMAL(10, 2) NOT NULL,
          currency        VARCHAR(10) DEFAULT 'USD',
          status          ENUM('completed', 'pending', 'failed') DEFAULT 'pending',
          payment_method  VARCHAR(50),
          description     TEXT,
          payment_date    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Create admin user if not exists
      const adminExists = await query('SELECT id FROM users WHERE email = ?', ['admin@graphiacheck.in']);
      if (adminExists.length === 0) {
        const adminPassword = await bcrypt.hash('Admin@123', 10);
        await conn.execute(
          'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
          ['Admin', 'admin@graphiacheck.in', adminPassword]
        );
        console.log('[DB] Admin user created ✓');
      }

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
