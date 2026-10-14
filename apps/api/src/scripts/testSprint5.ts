import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { runSeed } from './seed.js';
import { createApp } from '../app.js';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runTests = async (): Promise<void> => {
  console.log('========================================================');
  console.log('🧪 Starting Sprint 5 Verification & Automated Test Suite');
  console.log('========================================================');

  // Test 1: Seed DB
  console.log('\n[Test 1] Initializing Database & Seeding...');
  await connectDatabase();
  await runSeed();

  // Test 2: Boot HTTP Server
  console.log('\n[Test 2] Testing Auth & Stats APIs via HTTP Server...');
  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(5095, () => {
      console.log('  Test HTTP server listening on port 5095');
      resolve();
    });
  });

  const testFetch = async (endpoint: string, options?: RequestInit): Promise<any> => {
    const res = await fetch(`http://localhost:5095/api/v1${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    return (await res.json()) as any;
  };

  // POST /auth/login (Success)
  const loginRes = await testFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@acme-corp.com',
      password: 'AdminPassword123!',
    }),
  });
  console.log(`  POST /auth/login: success=${loginRes.success}, token issued=${!!loginRes.data?.token}`);
  if (!loginRes.success || !loginRes.data?.token) {
    throw new Error('❌ Login failed with seeded credentials');
  }

  // GET /auth/me
  const token = loginRes.data.token;
  const meRes: any = await fetch('http://localhost:5095/api/v1/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json());
  console.log(`  GET /auth/me: user=${meRes.data?.user?.name} (${meRes.data?.user?.role})`);
  if (!meRes.success || meRes.data?.user?.role !== 'ADMIN') {
    throw new Error('❌ GET /auth/me failed to authenticate token');
  }

  // GET /stats/overview
  const statsRes = await testFetch('/stats/overview');
  console.log(`  GET /stats/overview: total_tickets=${statsRes.data?.kpi?.total_tickets}, avg_confidence=${statsRes.data?.kpi?.average_confidence}, auto_resolved=${statsRes.data?.kpi?.auto_resolved_percentage}%`);
  if (!statsRes.success || statsRes.data?.kpi?.total_tickets < 3) {
    throw new Error('❌ GET /stats/overview returned invalid telemetry');
  }

  // Test 3: Verify Web Frontend Production Build Artifacts
  console.log('\n[Test 3] Verifying Web Console Production Build Artifacts...');
  const distPath = path.resolve(__dirname, '../../../web/dist/index.html');
  if (!fs.existsSync(distPath)) {
    throw new Error(`❌ Frontend build artifact missing at ${distPath}`);
  }
  const htmlContent = fs.readFileSync(distPath, 'utf-8');
  if (!htmlContent.includes('Nexora')) {
    throw new Error('❌ Frontend HTML missing Nexora title');
  }
  console.log(`  ✅ Frontend index.html verified (${htmlContent.length} bytes)`);

  await new Promise<void>((resolve) => server.close(() => resolve()));
  await disconnectDatabase();

  console.log('\n========================================================');
  console.log('🎉 ALL SPRINT 5 AUTOMATED VERIFICATION TESTS PASSED!');
  console.log('========================================================\n');
};

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test suite failed:', err);
    process.exit(1);
  });
