import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { runSeed } from './seed.js';
import { SalesAgentPod } from '../agents/salesPod.js';
import { FinanceAgentPod } from '../agents/financePod.js';
import { CrossPodOrchestrator } from '../agents/crossPodOrchestrator.js';
import { Account, Deal, Invoice, AgentAction } from '../models/index.js';
import { createApp } from '../app.js';
import http from 'http';
import { InvoiceMatchStatus } from '@nexora/core';

const runTests = async (): Promise<void> => {
  console.log('========================================================');
  console.log('🧪 Starting Sprint 6 Verification & Automated Test Suite');
  console.log('========================================================');

  // Test 1: Seed DB
  console.log('\n[Test 1] Initializing Database & Seeding...');
  await connectDatabase();
  await runSeed();

  const apexAccount = await Account.findOne({ erp_id: '101' });
  const omniInvoice = await Invoice.findOne({ erp_id: '203' });
  if (!apexAccount || !omniInvoice) throw new Error('Seeded records missing');

  // Test 2: Sales Agent Pod (Autonomous SDR)
  console.log('\n[Test 2] Testing Sales Agent Pod - Lead Enrichment & Sequence Generation...');
  const salesResult = await SalesAgentPod.enrichAndGenerateOutreach({
    company_name: 'Quantum BioTech Labs',
    contact_name: 'Dr. Evelyn Reed',
    contact_email: 'evelyn.reed@quantumbio.com',
    industry: 'Biotechnology & Pharmaceuticals',
  });

  console.log(`- Lead Intent Score: ${salesResult.outreach.intent_score}`);
  console.log(`- Deal Stage:        ${salesResult.deal.stage} (Value: $${salesResult.deal.value})`);
  console.log(`- Email Sequence:    ${salesResult.outreach.email_sequence.length} steps generated`);
  console.log(`- Queued Action ID:  ${salesResult.action_queued._id} (${salesResult.action_queued.action_type})`);

  if (salesResult.outreach.intent_score < 0.80 || salesResult.outreach.email_sequence.length < 2) {
    throw new Error('❌ Sales SDR Pod failed to compute intent score or generate outreach');
  }
  console.log('✅ Sales Agent Pod verified!');

  // Test 3: Finance Agent Pod (3-Way Matching & Discrepancy Flagging)
  console.log('\n[Test 3] Testing Finance Agent Pod - 3-Way Invoice Matching...');
  const matchResult = await FinanceAgentPod.evaluateThreeWayMatch({
    invoice_id: omniInvoice._id.toString(),
    po_number: 'PO-OMNI-7711',
    po_amount: 13500,
    receipt_amount: 13500,
    invoice_amount: 14500, // $1,000 tax mismatch
    tax_rate_contracted: 8.5,
    tax_rate_invoiced: 12.0,
  });

  console.log(`- Match Status:      ${matchResult.evaluation.match_status}`);
  console.log(`- Variance:          ${matchResult.evaluation.variance_percentage}%`);
  console.log(`- Discrepancies:     ${matchResult.evaluation.discrepancies.length} found`);
  console.log(`- Action Queued:     ${matchResult.action_queued.action_type}`);

  if (matchResult.evaluation.match_status !== InvoiceMatchStatus.MISMATCH_PO) {
    throw new Error('❌ Finance Pod failed to detect invoice PO discrepancy');
  }
  console.log('✅ Finance 3-way matching verified!');

  // Test 4: Finance Hard Safety Constraint (Autonomous Payment Prohibition)
  console.log('\n[Test 4] Testing Hard Invariant Rule: Autonomous Payment Prohibition...');
  let paymentBlocked = false;
  try {
    FinanceAgentPod.validateAutonomousPaymentAllowed();
  } catch (err: any) {
    paymentBlocked = true;
    console.log(`  🛡️ Autonomous payment blocked: "${err.message}"`);
  }
  if (!paymentBlocked) {
    throw new Error('❌ Hard invariant violated: Finance Pod allowed autonomous payment');
  }
  console.log('✅ Autonomous payment prohibition strictly enforced!');

  // Test 5: Cross-Pod Collaboration (Support Churn Risk Alert -> Sales Deal Update)
  console.log('\n[Test 5] Testing Cross-Pod Shared Context Fabric...');
  const crossPodResult = await CrossPodOrchestrator.broadcastChurnRiskAlert(
    apexAccount._id.toString(),
    'SUPPORT_POD',
    'Customer submitted urgent ticket on delayed shipment #SO0142'
  );
  console.log(`- Cross-pod alert notified ${crossPodResult.affected_deals} linked deals.`);

  const updatedDeal = await Deal.findOne({ account_id: apexAccount._id });
  const alertSignal = updatedDeal?.intent_signals.find((s) => s.signal.includes('CROSS-POD ALERT'));
  if (!alertSignal) {
    throw new Error('❌ Cross-pod alert was not injected into linked sales deal context');
  }
  console.log(`  ✅ Sales deal received cross-pod alert: "${alertSignal.signal}"`);

  // Test 6: HTTP REST Endpoints
  console.log('\n[Test 6] Testing Sales & Finance REST Endpoints via HTTP Server...');
  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(5094, () => {
      console.log('  Test HTTP server listening on port 5094');
      resolve();
    });
  });

  const testFetch = async (endpoint: string, options?: RequestInit): Promise<any> => {
    const res = await fetch(`http://localhost:5094/api/v1${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    return (await res.json()) as any;
  };

  // POST /sales/outreach/generate
  const salesApiRes = await testFetch('/sales/outreach/generate', {
    method: 'POST',
    body: JSON.stringify({
      company_name: 'Vanguard Medical Robotics',
      contact_name: 'Elena Rostova',
      contact_email: 'elena@vanguard-med.com',
    }),
  });
  console.log(`  POST /sales/outreach/generate: Created deal "${salesApiRes.data.deal.name}"`);

  // POST /finance/payments/execute-autonomous (Should return 403)
  const forbiddenRes = await testFetch('/finance/payments/execute-autonomous', { method: 'POST' });
  console.log(`  POST /finance/payments/execute-autonomous: code=${forbiddenRes.error?.code} (HTTP 403 Forbidden)`);
  if (forbiddenRes.error?.code !== 'AUTONOMOUS_PAYMENT_PROHIBITED') {
    throw new Error('❌ Endpoint failed to enforce 403 on autonomous payment attempt');
  }

  await new Promise<void>((resolve) => server.close(() => resolve()));
  await disconnectDatabase();

  console.log('\n========================================================');
  console.log('🎉 ALL SPRINT 6 AUTOMATED VERIFICATION TESTS PASSED!');
  console.log('========================================================\n');
};

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test suite failed:', err);
    process.exit(1);
  });
