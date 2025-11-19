import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'postgres',
  password: process.env.POSTGRES_PASSWORD || '',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  ssl: process.env.POSTGRES_HOST !== 'localhost' 
    ? { rejectUnauthorized: false } 
    : undefined
});

export const initDB = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY,
        token_in VARCHAR(50),
        token_out VARCHAR(50),
        amount DECIMAL,
        status VARCHAR(20),
        dex VARCHAR(20),
        tx_hash VARCHAR(100),
        execution_price DECIMAL,
        error TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Database initialized');
  } catch (err) {
    console.error('DB Init Error:', err);
  } finally {
    client.release();
  }
};

export default pool;