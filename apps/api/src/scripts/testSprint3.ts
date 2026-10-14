import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { runSeed } from './seed.js';
import { SupportAgentPod } from '../agents/supportPod.js';
import { Account, Ticket, AgentAction, AuditLog } from '../models/index.js';
import { createApp } from '../app.js';
import http from 'http';
import { TicketCategory, TicketStatus } from '@nexora/core';

const runTests = async (): Promise<void> => {
  console.log('========================================================');
  console.log('🧪 Starting Sprint 3 Verification & Automated Test Suite');
  console.log('========================================================');

  // Test 1: Seed DB
  console.log('\n[Test 1] Initializing Database & Seeding...');
  await connectDatabase();
  await runSeed();

  const apexAccount = await Account.findOne({ erp_id: '101' });
  if (!apexAccount) throw new Error('Account 101 not found');

  // Test 2: Support Pod Ticket Intake - Refund Request ($150 > $100 policy limit)
  console.log('\n[Test 2] Testing Support Agent Pod - Refund Request (> $100 Limit)...');
  const refundResult = await SupportAgentPod.processTicketIntake({
    account_id: apexAccount._id.toString(),
    customer_name: 'Sarah Connor',
    email: 'sarah.connor@apexlogistics.com',
    subject: 'Delayed Air Cargo Shipment - Requesting $150 compensation',
    message: 'Our order SO0142 is delayed by 12 days. Please issue an immediate $150 credit memo to our account.',
  });

  console.log(`- Category:         ${refundResult.triage.category}`);
  console.log(`- Severity:         ${refundResult.triage.severity}`);
  console.log(`- Confidence Score: ${refundResult.triage.confidence_score}`);
  console.log(`- Sentiment:        ${refundResult.triage.sentiment}`);
  console.log(`- Ticket Status:    ${refundResult.ticket.status}`);
  console.log(`- Action Queued:    ${refundResult.action_queued ? 'Yes (Pending Approval)' : 'No'}`);

  if (refundResult.triage.confidence_score <= 0 || refundResult.triage.confidence_score > 1) {
    throw new Error('❌ Confidence score must be strictly between 0.00 and 1.00');
  }
  if (!refundResult.action_queued) {
    throw new Error('❌ Action exceeding $100 was not queued for human approval');
  }
  if (refundResult.ticket.status !== TicketStatus.PENDING_APPROVAL) {
    throw new Error('❌ Expected ticket status PENDING_APPROVAL');
  }
  console.log('✅ Refund triage & approval queue trigger verified!');

  // Test 3: Support Pod Ticket Intake - Plan Upgrade (Safe Action)
  console.log('\n[Test 3] Testing Support Agent Pod - Plan Change / Seat Upgrade...');
  const upgradeResult = await SupportAgentPod.processTicketIntake({
    account_id: apexAccount._id.toString(),
    customer_name: 'Sarah Connor',
    subject: 'Add 10 seats to our logistics team',
    message: 'We are expanding our regional dispatch hub and need to add 10 user seats to our current tier.',
  });

  console.log(`- Category:         ${upgradeResult.triage.category}`);
  console.log(`- Confidence Score: ${upgradeResult.triage.confidence_score}`);
  console.log(`- Proposed Action:  ${upgradeResult.triage.proposed_action?.action_type}`);

  if (upgradeResult.triage.category !== TicketCategory.PLAN_CHANGE) {
    throw new Error('❌ Expected PLAN_CHANGE category');
  }
  console.log('✅ Plan change classification verified!');

  // Test 4: Support Pod Ticket Intake - Low-confidence / Ambiguous input
  console.log('\n[Test 4] Testing Support Agent Pod - Low Confidence Auto-Escalation...');
  const lowConfResult = await SupportAgentPod.processTicketIntake({
    account_id: apexAccount._id.toString(),
    subject: 'Unclear query',
    message: 'asdf random gibberish 123 test no actionable request',
  });

  console.log(`- Confidence Score: ${lowConfResult.triage.confidence_score}`);
  console.log(`- Ticket Status:    ${lowConfResult.ticket.status}`);
  if (lowConfResult.ticket.status !== TicketStatus.ESCALATED) {
    throw new Error('❌ Low confidence ticket was not auto-escalated');
  }
  console.log('✅ Low-confidence auto-escalation verified!');

  // Test 5: HTTP REST API Endpoints
  console.log('\n[Test 5] Testing Ticket REST Endpoints via HTTP Server...');
  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(5097, () => {
      console.log('  Test HTTP server listening on port 5097');
      resolve();
    });
  });

  const testFetch = async (endpoint: string, options?: RequestInit): Promise<any> => {
    const res = await fetch(`http://localhost:5097/api/v1${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status} on ${endpoint}: ${errText}`);
    }
    return (await res.json()) as any;
  };

  // POST /tickets/intake
  const intakeRes = await testFetch('/tickets/intake', {
    method: 'POST',
    body: JSON.stringify({
      email: 'sarah.connor@apexlogistics.com',
      subject: 'Urgent: Router units missing in shipment #SO0142',
      message: 'We opened the crate and 5 router units were missing from our delivery.',
    }),
  });
  console.log(`  POST /tickets/intake: Created ${intakeRes.data.ticket.ticket_number} (Status: ${intakeRes.data.ticket.status})`);

  // POST /tickets/:id/reply
  const replyRes = await testFetch(`/tickets/${intakeRes.data.ticket._id}/reply`, {
    method: 'POST',
    body: JSON.stringify({
      sender_type: 'AGENT',
      sender_name: 'Marcus Bell (Support Agent)',
      content: 'I have logged a claim with our warehouse to expedite replacement units.',
    }),
  });
  console.log(`  POST /tickets/:id/reply: Updated timeline messages count = ${replyRes.data.messages.length}`);

  await new Promise<void>((resolve) => server.close(() => resolve()));
  await disconnectDatabase();

  console.log('\n========================================================');
  console.log('🎉 ALL SPRINT 3 AUTOMATED VERIFICATION TESTS PASSED!');
  console.log('========================================================\n');
};

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test suite failed:', err);
    process.exit(1);
  });
