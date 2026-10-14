import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { runSeed } from './seed.js';
import {
  Organization,
  User,
  Account,
  Contact,
  Deal,
  Ticket,
  Invoice,
  Transaction,
  AgentAction,
  AuditLog,
} from '../models/index.js';
import { mockErpInstance } from '../mock-erp/server.js';
import { createApp } from '../app.js';
import http from 'http';

const runTests = async (): Promise<void> => {
  console.log('========================================================');
  console.log('🧪 Starting Sprint 1 Verification & Automated Test Suite');
  console.log('========================================================');

  // Test 1: Connect to Database & Run Seed
  console.log('\n[Test 1] Testing Database Connection & Seeding...');
  await connectDatabase();
  await runSeed();

  // Test 2: Verify Seed Counts & Data Integrity
  console.log('\n[Test 2] Verifying Mongoose Schemas & Database State...');
  const [
    orgCount,
    userCount,
    accountCount,
    contactCount,
    dealCount,
    ticketCount,
    invoiceCount,
    txCount,
    actionCount,
    auditCount,
  ] = await Promise.all([
    Organization.countDocuments(),
    User.countDocuments(),
    Account.countDocuments(),
    Contact.countDocuments(),
    Deal.countDocuments(),
    Ticket.countDocuments(),
    Invoice.countDocuments(),
    Transaction.countDocuments(),
    AgentAction.countDocuments(),
    AuditLog.countDocuments(),
  ]);

  console.log(`- Organizations: ${orgCount}`);
  console.log(`- Users:         ${userCount}`);
  console.log(`- Accounts:      ${accountCount}`);
  console.log(`- Contacts:      ${contactCount}`);
  console.log(`- Deals:         ${dealCount}`);
  console.log(`- Tickets:       ${ticketCount}`);
  console.log(`- Invoices:      ${invoiceCount}`);
  console.log(`- Transactions:  ${txCount}`);
  console.log(`- Agent Actions: ${actionCount}`);
  console.log(`- Audit Logs:    ${auditCount}`);

  if (orgCount < 1 || accountCount < 3 || ticketCount < 3 || invoiceCount < 3) {
    throw new Error('❌ Schema verification failed: expected seeded records missing');
  }
  console.log('✅ Schema & seed counts verified successfully!');

  // Test 3: Verify Mock ERP Server
  console.log('\n[Test 3] Verifying Mock ERP Server...');
  const partners = mockErpInstance.getPartners();
  const invoices = mockErpInstance.getInvoices();
  const tickets = mockErpInstance.getTickets();
  console.log(`- Mock ERP Partners: ${partners.length}`);
  console.log(`- Mock ERP Invoices: ${invoices.length}`);
  console.log(`- Mock ERP Tickets:  ${tickets.length}`);

  if (partners.length < 4 || invoices.length < 4 || tickets.length < 3) {
    throw new Error('❌ Mock ERP state missing initial datasets');
  }

  // Test write-back simulation
  const writeRes = mockErpInstance.issueRefundCredit(201, 150, 'Carrier Delay compensation');
  console.log(`- Mock Write-back: ${writeRes.message}`);
  if (!writeRes.success || writeRes.updated_fields.amount_residual !== 4050) {
    throw new Error('❌ Mock ERP write-back failed');
  }
  console.log('✅ Mock ERP server verified successfully!');

  // Test 4: Boot In-Memory API & Verify REST Endpoints
  console.log('\n[Test 4] Testing REST API Routes via HTTP Server...');
  const app = createApp();
  const server = http.createServer(app);
  
  await new Promise<void>((resolve) => {
    server.listen(5099, () => {
      console.log('  Test HTTP server listening on port 5099');
      resolve();
    });
  });

  const testFetch = async (endpoint: string): Promise<any> => {
    const res = await fetch(`http://localhost:5099/api/v1${endpoint}`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} on ${endpoint}`);
    }
    return (await res.json()) as any;
  };

  const healthRes = await testFetch('/health');
  console.log(`  GET /health: ${healthRes.status} (${healthRes.system})`);

  const accountsRes = await testFetch('/accounts');
  console.log(`  GET /accounts: returned ${accountsRes.count} accounts`);

  const ticketsRes = await testFetch('/tickets');
  console.log(`  GET /tickets: returned ${ticketsRes.count} tickets`);

  const invoicesRes = await testFetch('/invoices');
  console.log(`  GET /invoices: returned ${invoicesRes.count} invoices`);

  const mockPartnersRes = await testFetch('/mock-erp/partners');
  console.log(`  GET /mock-erp/partners: returned ${mockPartnersRes.count} mock partners`);

  await new Promise<void>((resolve) => server.close(() => resolve()));
  await disconnectDatabase();

  console.log('\n========================================================');
  console.log('🎉 ALL SPRINT 1 AUTOMATED VERIFICATION TESTS PASSED!');
  console.log('========================================================\n');
};

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test suite failed:', err);
    process.exit(1);
  });
