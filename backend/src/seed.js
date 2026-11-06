const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, 'data', 'seedData.json');
const dbPath = path.join(__dirname, 'data', 'db.json');

if (!fs.existsSync(seedPath)) {
  throw new Error('Seed file not found');
}

fs.copyFileSync(seedPath, dbPath);
console.log('Seed database restored from seedData.json');
