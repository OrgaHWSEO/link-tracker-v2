const { execSync, fork } = require('child_process');

// Build DATABASE_URL from DB_PASSWORD with proper URL encoding
const dbPassword = process.env.DB_PASSWORD || 'changeme';
const encodedPassword = encodeURIComponent(dbPassword);
const databaseUrl = `postgresql://linktracker:${encodedPassword}@db:5432/linktracker`;

process.env.DATABASE_URL = databaseUrl;
console.log('DATABASE_URL built from DB_PASSWORD.');

// Run prisma db push
try {
  console.log('Running prisma db push...');
  execSync(
    'node node_modules/prisma/build/index.js db push --skip-generate',
    { stdio: 'inherit', env: { ...process.env, HOME: '/tmp' } }
  );
  console.log('Database schema synced.');
} catch (e) {
  console.error('prisma db push failed:', e.message);
  process.exit(1);
}

// Start the Next.js server
console.log('Starting server...');
require('./server.js');
