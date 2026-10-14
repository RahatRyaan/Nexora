import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
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
import {
  UserRole,
  AccountTier,
  DealStage,
  TicketChannel,
  TicketCategory,
  TicketSeverity,
  TicketStatus,
  InvoiceStatus,
  InvoiceMatchStatus,
  TransactionType,
  ErpProvider,
  AgentType,
  ActionRiskLevel,
  ActionStatus,
} from '@nexora/core';

export const runSeed = async (): Promise<void> => {
  console.log('[Seed] 🚀 Starting Nexora Enterprise database seeding...');
  if (mongoose.connection.readyState !== 1) {
    await connectDatabase();
  }

  // Clear existing collections
  await Organization.deleteMany({});
  await User.deleteMany({});
  await Account.deleteMany({});
  await Contact.deleteMany({});
  await Deal.deleteMany({});
  await Ticket.deleteMany({});
  await Invoice.deleteMany({});
  await Transaction.deleteMany({});
  await AgentAction.deleteMany({});
  await AuditLog.deleteMany({});

  console.log('[Seed] 🧹 Cleared existing collections.');

  // 1. Create Organization
  const org = await Organization.create({
    name: 'Acme Enterprise Holdings',
    slug: 'acme-corp',
    logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60',
    timezone: 'America/New_York',
    approval_policies: {
      support_refund_limit_dollars: 100,
      support_confidence_threshold: 0.85,
      sales_auto_outreach_threshold: 0.90,
      finance_strict_human_approval: true,
    },
    erp_config: {
      provider: ErpProvider.MOCK,
      host: 'http://localhost:5050',
      db: 'mock_odoo_db',
      sync_interval_mins: 15,
      last_synced_at: new Date(),
      status: 'connected',
      field_mappings: new Map([
        ['partner_name', 'name'],
        ['partner_email', 'email'],
        ['amount_total', 'amount'],
      ]),
    },
  });

  console.log(`[Seed] 🏢 Organization created: ${org.name} (${org._id})`);

  // 2. Create Users
  const passwordHash = await bcrypt.hash('AdminPassword123!', 10);
  const adminUser = await User.create({
    organization_id: org._id,
    email: 'admin@acme-corp.com',
    password_hash: passwordHash,
    name: 'Alexandra Vance (Platform Admin)',
    role: UserRole.ADMIN,
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60',
    is_active: true,
  });

  const financeLead = await User.create({
    organization_id: org._id,
    email: 'elena.finance@acme-corp.com',
    password_hash: passwordHash,
    name: 'Elena Rostova (Finance Ops Lead)',
    role: UserRole.FINANCE_LEAD,
    is_active: true,
  });

  const supportAgent = await User.create({
    organization_id: org._id,
    email: 'marcus.support@acme-corp.com',
    password_hash: passwordHash,
    name: 'Marcus Bell (Support Lead)',
    role: UserRole.SUPPORT_AGENT,
    is_active: true,
  });

  console.log('[Seed] 👥 Users created: Admin, Finance Lead, Support Lead.');

  // 3. Create Accounts (Shared Data Fabric Hub)
  const accountApex = await Account.create({
    organization_id: org._id,
    erp_id: '101',
    name: 'Apex Global Logistics Inc.',
    industry: 'Logistics & Supply Chain',
    tier: AccountTier.ENTERPRISE,
    health_score: 65, // Lower due to delayed shipment ticket & open invoice
    annual_revenue: 12500000,
    assigned_owner_id: adminUser._id,
    open_deals_count: 1,
    open_tickets_count: 1,
    overdue_invoices_count: 0,
    last_synced_at: new Date(),
    metadata: new Map([['region', 'North America'], ['account_manager', 'Alexandra Vance']]),
  });

  const accountNova = await Account.create({
    organization_id: org._id,
    erp_id: '102',
    name: 'NovaTech Medical Systems',
    industry: 'Healthcare & Life Sciences',
    tier: AccountTier.ENTERPRISE,
    health_score: 95,
    annual_revenue: 28000000,
    assigned_owner_id: adminUser._id,
    open_deals_count: 1,
    open_tickets_count: 1,
    overdue_invoices_count: 0,
    last_synced_at: new Date(),
  });

  const accountOmni = await Account.create({
    organization_id: org._id,
    erp_id: '103',
    name: 'OmniCloud Technologies',
    industry: 'Cloud Infrastructure',
    tier: AccountTier.MID_MARKET,
    health_score: 48, // Low health due to overdue invoice & tax dispute ticket
    annual_revenue: 8200000,
    assigned_owner_id: adminUser._id,
    open_deals_count: 0,
    open_tickets_count: 1,
    overdue_invoices_count: 1,
    last_synced_at: new Date(),
  });

  // Edge case account: missing industry and revenue
  const accountEdge = await Account.create({
    organization_id: org._id,
    erp_id: '104',
    name: 'Starlight Retailers Group',
    tier: AccountTier.SMB,
    health_score: 85,
    open_deals_count: 0,
    open_tickets_count: 0,
    overdue_invoices_count: 0,
    last_synced_at: new Date(),
  });

  console.log('[Seed] 🌐 Accounts created (including edge case).');

  // 4. Create Contacts
  const contactSarah = await Contact.create({
    organization_id: org._id,
    account_id: accountApex._id,
    erp_id: 'C-101-1',
    name: 'Sarah Connor',
    email: 'sarah.connor@apexlogistics.com',
    phone: '+1-555-019-2831',
    job_title: 'Director of Procurement',
    is_primary: true,
    lead_score: 85,
    last_contacted_at: new Date(),
  });

  const contactMarcus = await Contact.create({
    organization_id: org._id,
    account_id: accountNova._id,
    erp_id: 'C-102-1',
    name: 'Marcus Vance',
    email: 'marcus.vance@novatech-med.io',
    phone: '+1-555-044-8891',
    job_title: 'VP of Technology',
    is_primary: true,
    lead_score: 95,
  });

  const contactChen = await Contact.create({
    organization_id: org._id,
    account_id: accountOmni._id,
    erp_id: 'C-103-1',
    name: 'David Chen',
    email: 'd.chen@omnicloud.net',
    phone: '+1-555-081-3320',
    job_title: 'Head of Billing',
    is_primary: true,
    lead_score: 60,
  });

  console.log('[Seed] 📇 Contacts created.');

  // 5. Create Deals (CRM Sync)
  const dealApex = await Deal.create({
    organization_id: org._id,
    account_id: accountApex._id,
    erp_id: 'SO0142',
    name: 'Apex - Global Fleet Expansion Contract',
    stage: DealStage.NEGOTIATION,
    value: 50000,
    currency: 'USD',
    source: 'OUTBOUND_AI',
    intent_score: 0.88,
    intent_signals: [
      { signal: 'Requested enterprise pricing proposal', source: 'SALES_POD', detected_at: new Date(Date.now() - 86400000 * 3) },
      { signal: 'Checked procurement documentation 4 times', source: 'WEB_PORTAL', detected_at: new Date(Date.now() - 86400000 * 1) },
    ],
    expected_close_date: new Date(Date.now() + 86400000 * 14),
  });

  const dealNova = await Deal.create({
    organization_id: org._id,
    account_id: accountNova._id,
    erp_id: 'SO0143',
    name: 'NovaTech - 25 Seat Medical Expansion',
    stage: DealStage.PROPOSAL,
    value: 35000,
    currency: 'USD',
    source: 'INBOUND',
    intent_score: 0.95,
    intent_signals: [{ signal: 'Upgrade inquiry via support ticket', source: 'SUPPORT_POD', detected_at: new Date() }],
  });

  console.log('[Seed] 💼 Deals created with intent signals.');

  // 6. Create Tickets (Support Pod Context)
  const ticketApex = await Ticket.create({
    organization_id: org._id,
    account_id: accountApex._id,
    contact_id: contactSarah._id,
    erp_id: 'HD-9801',
    ticket_number: 'TCK-2026-1042',
    channel: TicketChannel.CHAT,
    subject: 'Delayed shipment for Order #SO0142 - Requesting compensation',
    category: TicketCategory.REFUND_REQUEST,
    severity: TicketSeverity.HIGH,
    status: TicketStatus.PENDING_APPROVAL,
    confidence_score: 0.94,
    messages: [
      {
        sender_type: 'CUSTOMER',
        sender_name: 'Sarah Connor',
        content: 'We ordered 50 router units 12 days ago and have not received tracking confirmation. We request an immediate $150 shipping fee refund or expedited air shipment.',
        timestamp: new Date(Date.now() - 3600000 * 2),
      },
      {
        sender_type: 'AI_BOT',
        sender_name: 'Nexora Support Agent',
        content: 'I apologize for the delay on Order #SO0142. I have verified your order status in our ERP system and initiated a $150 shipping credit for your account. This is currently awaiting manager sign-off.',
        timestamp: new Date(Date.now() - 3600000 * 1),
      },
    ],
    ai_draft_response: 'Customer waited 12 days for order SO0142. Propose $150 credit memo to preserve high-value deal relationship ($50k open deal in negotiation).',
    resolution_summary: 'Proposed $150 shipping credit against Invoice INV/2026/00101.',
    proposed_action: {
      action_type: 'ISSUE_REFUND',
      parameters: {
        invoice_id: '201',
        refund_amount: 150,
        reason: 'Carrier delay on order SO0142 exceeding 10 business days',
      },
      dollar_amount: 150,
      requires_approval: true, // > $100 policy limit
    },
    assigned_user_id: supportAgent._id,
  });

  const ticketNova = await Ticket.create({
    organization_id: org._id,
    account_id: accountNova._id,
    contact_id: contactMarcus._id,
    erp_id: 'HD-9802',
    ticket_number: 'TCK-2026-1043',
    channel: TicketChannel.EMAIL,
    subject: 'Upgrade Enterprise Plan to add 25 seats',
    category: TicketCategory.PLAN_CHANGE,
    severity: TicketSeverity.MEDIUM,
    status: TicketStatus.IN_PROGRESS,
    confidence_score: 0.96,
    messages: [
      {
        sender_type: 'CUSTOMER',
        sender_name: 'Marcus Vance',
        content: 'Please help us add 25 seats to our current tier. We need this provisioned before Monday for our clinical trials team.',
        timestamp: new Date(Date.now() - 3600000 * 4),
      },
    ],
    ai_draft_response: 'NovaTech has active tier ENTERPRISE. Proposed seat upgrade provisioned in ERP; notified AE Alexandra Vance.',
  });

  // Edge Case Ticket: Uncategorized & No Contact linked
  const ticketEdge = await Ticket.create({
    organization_id: org._id,
    account_id: accountOmni._id,
    erp_id: 'HD-9803',
    ticket_number: 'TCK-2026-1044',
    channel: TicketChannel.CHAT,
    subject: 'Dispute regarding Invoice INV/2026/00103 tax calculation',
    category: TicketCategory.BILLING,
    severity: TicketSeverity.CRITICAL,
    status: TicketStatus.NEW,
    confidence_score: 0.62, // Low confidence -> triggers human triage
    messages: [
      {
        sender_type: 'CUSTOMER',
        sender_name: 'David Chen',
        content: 'The tax line on invoice INV/2026/00103 shows 12% instead of the contracted 8.5% state rate. Please issue a corrected invoice or credit note immediately.',
        timestamp: new Date(Date.now() - 1800000),
      },
    ],
  });

  console.log('[Seed] 🎫 Tickets created with approval triggers.');

  // 7. Create Invoices (Finance Pod Context)
  const invoiceApex = await Invoice.create({
    organization_id: org._id,
    account_id: accountApex._id,
    erp_id: '201',
    invoice_number: 'INV/2026/00101',
    po_number: 'PO-APEX-9982',
    amount: 4200.0,
    currency: 'USD',
    status: InvoiceStatus.POSTED,
    match_status: InvoiceMatchStatus.THREE_WAY_MATCHED,
    match_details: {
      po_amount: 4200.0,
      receipt_amount: 4200.0,
      variance_percentage: 0,
      discrepancy_reasons: [],
    },
    due_date: new Date('2026-09-15'),
  });

  const invoiceNova = await Invoice.create({
    organization_id: org._id,
    account_id: accountNova._id,
    erp_id: '202',
    invoice_number: 'INV/2026/00102',
    po_number: 'PO-NOVA-1029',
    amount: 18500.0,
    currency: 'USD',
    status: InvoiceStatus.PAID,
    match_status: InvoiceMatchStatus.THREE_WAY_MATCHED,
    due_date: new Date('2026-10-01'),
  });

  // Mismatched Invoice
  const invoiceOmni = await Invoice.create({
    organization_id: org._id,
    account_id: accountOmni._id,
    erp_id: '203',
    invoice_number: 'INV/2026/00103',
    po_number: 'PO-OMNI-7711',
    amount: 14500.0,
    currency: 'USD',
    status: InvoiceStatus.DISPUTED,
    match_status: InvoiceMatchStatus.MISMATCH_PO,
    match_details: {
      po_amount: 13500.0,
      receipt_amount: 13500.0,
      variance_percentage: 7.4,
      discrepancy_reasons: ['Invoice total exceeds PO amount by $1,000 due to non-contractual 12% sales tax.'],
    },
    due_date: new Date('2026-08-20'),
  });

  console.log('[Seed] 🧾 Invoices created (including 3-way match discrepancy).');

  // 8. Create Transactions
  await Transaction.create({
    organization_id: org._id,
    invoice_id: invoiceNova._id,
    account_id: accountNova._id,
    amount: 18500.0,
    currency: 'USD',
    type: TransactionType.PAYMENT,
    flagged: false,
    erp_transaction_id: 'TXN-9021',
  });

  // 9. Create Pending AgentAction (In Approval Queue)
  const pendingAction = await AgentAction.create({
    organization_id: org._id,
    trace_id: 'TRC-9901-APEX-REFUND',
    agent_type: AgentType.SUPPORT_POD,
    action_type: 'ISSUE_REFUND',
    target_entity_type: 'Ticket',
    target_entity_id: ticketApex._id,
    input_context: {
      ticket_id: ticketApex._id.toString(),
      account_id: accountApex._id.toString(),
      requested_amount: 150,
      order_delay_days: 12,
    },
    output_payload: {
      invoice_id: '201',
      credit_amount: 150,
      reason: 'Carrier delay exceeding SLA',
    },
    reasoning: 'Customer shipment delayed 12 days. Customer holds open $50,000 enterprise deal in negotiation. Proposing $150 credit memo to protect account health score.',
    confidence: 0.94,
    risk_level: ActionRiskLevel.MEDIUM,
    status: ActionStatus.PENDING_APPROVAL,
    reversible: true,
    rollback_payload: {
      action: 'CANCEL_CREDIT_MEMO',
      invoice_id: '201',
      credit_amount: 150,
    },
  });

  // 10. Create Immutable Audit Log
  await AuditLog.create({
    organization_id: org._id,
    trace_id: 'TRC-9901-APEX-REFUND',
    action_id: pendingAction._id,
    actor_type: 'AI_AGENT',
    actor_id: 'AGENT_SUPPORT_POD',
    actor_name: 'Support Agent Pod',
    action: 'QUEUED_REFUND_APPROVAL',
    resource_type: 'Ticket',
    resource_id: ticketApex._id.toString(),
    state_before: { status: 'NEW', proposed_action: null },
    state_after: { status: 'PENDING_APPROVAL', refund_amount: 150 },
  });

  console.log('[Seed] 🛡️ Approval Queue and Audit Log seeded successfully.');
  console.log('[Seed] ✅ Database seeding finished 100% complete.');
};

// If run directly via CLI
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  runSeed()
    .then(async () => {
      await disconnectDatabase();
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed] ❌ Seeding failed:', err);
      process.exit(1);
    });
}
