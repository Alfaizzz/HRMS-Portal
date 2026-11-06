const fs = require('fs');
const path = require('path');
const { query } = require('./db');

async function initializeDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return false;
  }

  try {
    const schemaPath = path.join(__dirname, '..', 'postgres_schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    await query(sql);
    console.log('PostgreSQL schema initialized successfully.');
    return true;
  } catch (error) {
    console.error('PostgreSQL initialization failed:', error.message);
    return false;
  }
}

module.exports = { initializeDatabase };
