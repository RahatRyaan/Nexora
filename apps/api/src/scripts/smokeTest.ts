import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { runSeed } from './seed.js';
import { createApp } from '../app.js';
import http from 'http';

const runSmokeTest = async (): Promise<void> => {
  console.log('================================================================');
  console.log('💨 RUNNING PRODUCTION SMOKE TEST & DEPLOYMENT HEALTH VERIFIER');
  console.log('================================================================');

  await connectDatabase();
  await runSeed();

  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(5092, () => {
      console.log('  Production Smoke Test Server listening on http://localhost:5092');
      resolve();
    });
  });

  const testFetch = async (path: string, options?: RequestInit): Promise<{ status: number; data: any; text: string }> => {
    const res = await fetch(`http://localhost:5092${path}`, options);
    const text = await res.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch {}
    return { status: res.status, data, text };
  };

  // Check 1: Health Endpoint
  console.log('\n[Check 1] Probing /api/v1/health...');
  const healthRes = await testFetch('/api/v1/health');
  console.log(`  Status: ${healthRes.status}, Body:`, healthRes.data);
  if (healthRes.status !== 200 || healthRes.data?.status !== 'healthy') {
    throw new Error('❌ Health check failed');
  }

  // Check 2: SPA Static HTML Serving
  console.log('\n[Check 2] Probing SPA root route GET / ...');
  const spaRes = await testFetch('/');
  console.log(`  Status: ${spaRes.status}, Length: ${spaRes.text.length} bytes`);
  if (spaRes.status !== 200 || !spaRes.text.includes('Nexora')) {
    throw new Error('❌ Production SPA HTML serving failed');
  }

  // Check 3: Authentication Endpoint
  console.log('\n[Check 3] Probing POST /api/v1/auth/login...');
  const authRes = await testFetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@acme-corp.com', password: 'AdminPassword123!' }),
  });
  console.log(`  Status: ${authRes.status}, User: ${authRes.data?.data?.user?.name}`);
  if (authRes.status !== 200 || !authRes.data?.data?.token) {
    throw new Error('❌ Production auth probe failed');
  }

  // Check 4: Stats Telemetry
  console.log('\n[Check 4] Probing GET /api/v1/stats/overview...');
  const statsRes = await testFetch('/api/v1/stats/overview');
  console.log(`  Status: ${statsRes.status}, KPI:`, statsRes.data?.data?.kpi);
  if (statsRes.status !== 200 || !statsRes.data?.data?.kpi) {
    throw new Error('❌ Production stats probe failed');
  }

  await new Promise<void>((resolve) => server.close(() => resolve()));
  await disconnectDatabase();

  console.log('\n================================================================');
  console.log('🎉 PRODUCTION SMOKE TEST PASSED 100%! READY FOR CLOUD SHIPMENT.');
  console.log('================================================================\n');
};

runSmokeTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Smoke test failed:', err);
    process.exit(1);
  });
