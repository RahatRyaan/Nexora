import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { runSeed } from './seed.js';
import { ErpSyncService } from '../services/erp/syncService.js';
import { ErpConnectorFactory } from '../services/erp/connectorFactory.js';
import { MockConnector } from '../services/erp/mockConnector.js';
import { OdooConnector } from '../services/erp/odooConnector.js';
import { Account, Contact, Deal, Ticket, Invoice } from '../models/index.js';
import { createApp } from '../app.js';
import http from 'http';
import { ErpProvider } from '@nexora/core';

const runTests = async (): Promise<void> => {
  console.log('========================================================');
  console.log('🧪 Starting Sprint 2 Verification & Automated Test Suite');
  console.log('========================================================');

  // Test 1: Seed DB & Verify Initial State
  console.log('\n[Test 1] Seeding database for ERP Sync testing...');
  await connectDatabase();
  await runSeed();

  // Test 2: Verify Connectors
  console.log('\n[Test 2] Testing Connector Factory & Implementations...');
  const mockConn = new MockConnector();
  const mockTest = await mockConn.testConnection();
  console.log(`- Mock Connector Test: ${mockTest.message}`);
  if (!mockTest.success) throw new Error('Mock connector test failed');

  const odooConn = new OdooConnector({
    provider: ErpProvider.ODOO,
    host: 'https://demo.odoo.com',
    db: 'demo',
  });
  console.log('- OdooConnector instantiated cleanly with XML-RPC/JSON-RPC protocols.');

  // Test 3: Run Bi-Directional ERP Sync
  console.log('\n[Test 3] Testing ErpSyncService (Bi-directional Sync)...');
  const syncStats = await ErpSyncService.syncOrganization();
  console.log(`- Sync Duration: ${syncStats.duration_ms}ms`);
  console.log(`- Partners Synced: ${syncStats.partners_synced}`);
  console.log(`- Invoices Synced: ${syncStats.invoices_synced}`);
  console.log(`- Tickets Synced:  ${syncStats.tickets_synced}`);
  console.log(`- Deals Synced:    ${syncStats.deals_synced}`);
  console.log(`- Sync Errors:     ${syncStats.errors.length}`);

  if (syncStats.partners_synced < 4 || syncStats.invoices_synced < 4) {
    throw new Error('❌ ERP Sync failed: expected synced entities count mismatch');
  }

  // Test 4: Verify Shared Data Fabric Health Scores & Cross-Pod Aggregations
  console.log('\n[Test 4] Verifying Shared Data Fabric 360 Aggregations...');
  const apexAccount = await Account.findOne({ erp_id: '101' });
  if (!apexAccount) throw new Error('Account 101 not found after sync');

  console.log(`- Apex Health Score: ${apexAccount.health_score} (Open Deals: ${apexAccount.open_deals_count}, Open Tickets: ${apexAccount.open_tickets_count}, Overdue Invoices: ${apexAccount.overdue_invoices_count})`);
  if (apexAccount.health_score < 0 || apexAccount.health_score > 100) {
    throw new Error('❌ Account health score out of bounds');
  }

  // Test 5: Test REST API Endpoints for /api/v1/erp
  console.log('\n[Test 5] Testing ERP REST API Endpoints via HTTP Server...');
  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(5098, () => {
      console.log('  Test HTTP server listening on port 5098');
      resolve();
    });
  });

  const testFetch = async (endpoint: string, options?: RequestInit): Promise<any> => {
    const res = await fetch(`http://localhost:5098/api/v1${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status} on ${endpoint}: ${errText}`);
    }
    return (await res.json()) as any;
  };

  // GET /erp/status
  const statusRes = await testFetch('/erp/status');
  console.log(`  GET /erp/status: provider=${statusRes.data.provider}, status=${statusRes.data.status}`);
  if (statusRes.data.status !== 'connected') throw new Error('GET /erp/status returned non-connected status');

  // POST /erp/test-connection
  const testConnRes = await testFetch('/erp/test-connection', {
    method: 'POST',
    body: JSON.stringify({ provider: 'mock', host: 'http://localhost:5050' }),
  });
  console.log(`  POST /erp/test-connection: ${testConnRes.data.message}`);

  // PUT /erp/field-mappings
  const fieldMapRes = await testFetch('/erp/field-mappings', {
    method: 'PUT',
    body: JSON.stringify({
      field_mappings: {
        partner_name: 'legal_company_name',
        partner_email: 'primary_billing_email',
      },
    }),
  });
  console.log(`  PUT /erp/field-mappings: mapped ${Object.keys(fieldMapRes.data).length} fields`);

  // POST /erp/write-back/dry-run (Safety Validation)
  const dryRunRes = await testFetch('/erp/write-back/dry-run', {
    method: 'POST',
    body: JSON.stringify({
      action_type: 'ISSUE_REFUND',
      record_id: 201,
      amount: 150,
      reason: 'SLA shipping delay compensation',
    }),
  });
  console.log(`  POST /erp/write-back/dry-run: ${dryRunRes.data.message} (dry_run=${dryRunRes.data.dry_run})`);
  if (!dryRunRes.data.dry_run || dryRunRes.data.success !== true) {
    throw new Error('Write-back dry-run failed safety validation');
  }

  // POST /erp/sync (On-demand trigger)
  const manualSyncRes = await testFetch('/erp/sync', { method: 'POST', body: JSON.stringify({}) });
  console.log(`  POST /erp/sync: ${manualSyncRes.message} (Synced ${manualSyncRes.data.partners_synced} partners in ${manualSyncRes.data.duration_ms}ms)`);

  await new Promise<void>((resolve) => server.close(() => resolve()));
  await disconnectDatabase();

  console.log('\n========================================================');
  console.log('🎉 ALL SPRINT 2 AUTOMATED VERIFICATION TESTS PASSED!');
  console.log('========================================================\n');
};

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test suite failed:', err);
    process.exit(1);
  });
