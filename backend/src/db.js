const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

const pool = connectionString ? new Pool({ connectionString }) : null;

async function query(text, params = []) {
  if (!pool) {
    throw new Error('DATABASE_URL is not configured. Configure Postgres before using database queries.');
  }

  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

module.exports = { pool, query };
