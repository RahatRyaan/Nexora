import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { runSeed } from './seed.js';
import { SupportAgentPod } from '../agents/supportPod.js';
import { AgentAction, AuditLog, Account, Ticket } from '../models/index.js';
import { createApp } from '../app.js';
import http from 'http';
import { ActionStatus, TicketStatus } from '@nexora/core';

const runTests = async (): Promise<void> => {
  console.log('========================================================');
  console.log('🧪 Starting Sprint 4 Verification & Automated Test Suite');
  console.log('========================================================');

  // Test 1: Seed DB
  console.log('\n[Test 1] Initializing Database & Seeding...');
  await connectDatabase();
  await runSeed();

  const apexAccount = await Account.findOne({ erp_id: '101' });
  if (!apexAccount) throw new Error('Account 101 not found');

  // Test 2: Ingest Ticket that generates a Pending Action
  console.log('\n[Test 2] Generating Pending Action for Approval Queue...');
  const intakeRes = await SupportAgentPod.processTicketIntake({
    account_id: apexAccount._id.toString(),
    customer_name: 'Sarah Connor',
    email: 'sarah.connor@apexlogistics.com',
    subject: 'Requesting $250 delayed freight refund',
    message: 'Shipment #SO0142 arrived 14 days late. We require a $250 refund immediately.',
  });

  const pendingActionId = intakeRes.action_queued?._id?.toString();
  if (!pendingActionId) {
    throw new Error('❌ Expected an action to be queued in Approval Queue');
  }
  console.log(`- Queued Action ID: ${pendingActionId} (Status: PENDING_APPROVAL)`);

  // Test 3: Boot HTTP Server & Test /approvals routes
  console.log('\n[Test 3] Testing Approval & Trust REST Endpoints via HTTP Server...');
  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(5096, () => {
      console.log('  Test HTTP server listening on port 5096');
      resolve();
    });
  });

  const testFetch = async (endpoint: string, options?: RequestInit): Promise<any> => {
    const res = await fetch(`http://localhost:5096/api/v1${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status} on ${endpoint}: ${errText}`);
    }
    return (await res.json()) as any;
  };

  // GET /approvals
  const approvalsList = await testFetch('/approvals?status=PENDING_APPROVAL');
  console.log(`  GET /approvals: ${approvalsList.count} actions awaiting review`);
  if (approvalsList.count < 1) throw new Error('❌ Pending action not returned in /approvals list');

  // POST /approvals/:id/approve
  const approveRes = await testFetch(`/approvals/${pendingActionId}/approve`, {
    method: 'POST',
    body: JSON.stringify({
      user_id: '6ab444a9554ba7f1a2910d39',
      user_name: 'Alexandra Vance (Platform Admin)',
    }),
  });
  console.log(`  POST /approvals/:id/approve: ${approveRes.message} (status=${approveRes.data.action.status})`);
  if (approveRes.data.action.status !== ActionStatus.EXECUTED) {
    throw new Error('❌ Approved action status was not updated to EXECUTED');
  }

  // Verify target ticket status became RESOLVED
  const resolvedTicket = await Ticket.findById(intakeRes.ticket._id);
  if (resolvedTicket?.status !== TicketStatus.RESOLVED) {
    throw new Error('❌ Target ticket was not marked RESOLVED upon action execution');
  }
  console.log(`  ✅ Ticket ${resolvedTicket.ticket_number} marked RESOLVED.`);

  // Test 4: Idempotency Protection
  console.log('\n[Test 4] Testing Idempotency Protection on Duplicate Approval...');
  const secondApproveRes = await testFetch(`/approvals/${pendingActionId}/approve`, {
    method: 'POST',
    body: JSON.stringify({
      user_id: '6ab444a9554ba7f1a2910d39',
      user_name: 'Alexandra Vance',
    }),
  });
  console.log(`  POST /approvals/:id/approve (2nd call): was_cached=${secondApproveRes.data.was_cached}`);
  if (!secondApproveRes.data.was_cached) {
    throw new Error('❌ Idempotency guard did not catch duplicate approval call');
  }
  console.log('  ✅ Idempotency guard successfully prevented duplicate ERP write.');

  // Test 5: Rejection Flow
  console.log('\n[Test 5] Testing Action Rejection Flow...');
  const rejectIntake = await SupportAgentPod.processTicketIntake({
    account_id: apexAccount._id.toString(),
    subject: 'Request $400 courtesy credit',
    message: 'Please give us $400 courtesy credit for our team.',
  });
  const rejectActionId = rejectIntake.action_queued._id.toString();

  const rejectRes = await testFetch(`/approvals/${rejectActionId}/reject`, {
    method: 'POST',
    body: JSON.stringify({
      reason: 'Courtesy credit request exceeds quarterly discretionary allowance.',
      user_name: 'Alexandra Vance',
    }),
  });
  console.log(`  POST /approvals/:id/reject: ${rejectRes.message} (status=${rejectRes.data.status})`);
  if (rejectRes.data.status !== ActionStatus.REJECTED || !rejectRes.data.rejection_reason) {
    throw new Error('❌ Rejection failed to record status or reason');
  }
  console.log('  ✅ Action rejection flow verified.');

  // Test 6: Rollback Flow
  console.log('\n[Test 6] Testing Reversible Action Rollback Flow...');
  const rollbackRes = await testFetch(`/approvals/${pendingActionId}/rollback`, {
    method: 'POST',
    body: JSON.stringify({ user_name: 'Alexandra Vance' }),
  });
  console.log(`  POST /approvals/:id/rollback: ${rollbackRes.message} (status=${rollbackRes.data.action.status})`);
  if (rollbackRes.data.action.status !== ActionStatus.ROLLED_BACK) {
    throw new Error('❌ Rollback failed to transition status to ROLLED_BACK');
  }
  console.log('  ✅ Action rollback and compensation record verified.');

  // Test 7: Verify Audit Log Explorer API & Immutability
  console.log('\n[Test 7] Testing Audit Log API & Ledger Integrity...');
  const auditLogsRes = await testFetch('/audit-logs');
  console.log(`  GET /audit-logs: returned ${auditLogsRes.count} audit records`);
  if (auditLogsRes.count < 3) throw new Error('❌ Expected at least 3 audit records for approval/reject/rollback');

  // Verify immutability constraint in MongoDB
  const firstLog = await AuditLog.findOne();
  if (firstLog) {
    let immutabilityTriggered = false;
    try {
      firstLog.action = 'MUTATED_UNAUTHORIZED';
      await firstLog.save();
    } catch (err: any) {
      immutabilityTriggered = true;
      console.log(`  🛡️ Audit log mutation blocked by Mongoose pre-save hook: "${err.message}"`);
    }
    if (!immutabilityTriggered) {
      throw new Error('❌ Audit log immutability was violated without throwing an error');
    }
  }
  console.log('  ✅ Audit log immutability strictly enforced.');

  await new Promise<void>((resolve) => server.close(() => resolve()));
  await disconnectDatabase();

  console.log('\n========================================================');
  console.log('🎉 ALL SPRINT 4 AUTOMATED VERIFICATION TESTS PASSED!');
  console.log('========================================================\n');
};

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test suite failed:', err);
    process.exit(1);
  });
