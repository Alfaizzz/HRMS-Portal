const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');
const SEED_PATH = path.join(DATA_DIR, 'seedData.json');

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(SEED_PATH)) {
    throw new Error('Missing seedData.json');
  }

  if (!fs.existsSync(DB_PATH)) {
    fs.copyFileSync(SEED_PATH, DB_PATH);
  }
}

function readData() {
  ensureDataFiles();
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeData(data) {
  ensureDataFiles();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

module.exports = {
  readData,
  writeData,
  ensureDataFiles,
  DB_PATH,
};
