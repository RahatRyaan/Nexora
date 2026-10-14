# Nexora Core System Architecture & Technical Specification

> **System Name**: Nexora — The Agentic Operations Layer for ERP  
> **Status**: Approved Architectural Standard  
> **Runtime Target**: Node.js 20+ (ESM / TypeScript), MongoDB 6.0+, Redis 7.0+, React 18+

---

## 1. System Architecture Overview

Nexora sits between enterprise applications and enterprise resource planning (ERP) systems. It runs three collaborative AI agent pods on top of a **Shared Data Fabric**, governed by a centralized **Trust & Control / Human-in-the-Loop Audit Layer**.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                 NEXORA APPLICATION LAYER                                │
│                                                                                         │
│  ┌────────────────────────┐  ┌─────────────────────────┐  ┌──────────────────────────┐  │
│  │   Support Agent Pod    │  │     Sales Agent Pod     │  │     Finance Agent Pod    │  │
│  │ - ERP Ticket Triage    │  │ - Lead Enrichment       │  │ - 3-Way Invoice Match    │  │
│  │ - Policy-Bound Refunds │  │ - Personalized Outreach │  │ - Anomaly / Fraud Check  │  │
│  │ - Order Status Lookup  │  │ - Meeting Booking & CRM │  │ - Draft Reconciliation   │  │
│  └───────────┬────────────┘  └────────────┬────────────┘  └────────────┬─────────────┘  │
│              │                            │                            │                │
│              └────────────────────────────┼────────────────────────────┘                │
│                                           │                                             │
│                           ┌───────────────▼────────────────┐                            │
│                           │   Orchestration & Event Bus    │                            │
│                           │  (BullMQ + ACP Router + Redis) │                            │
│                           └───────────────┬────────────────┘                            │
│                                           │                                             │
│       ┌───────────────────────────────────┴───────────────────────────────────┐         │
│       │                                                                       │         │
│ ┌─────▼─────────────────────────┐                   ┌─────────────────────────▼───────┐ │
│ │     Trust & Control Layer     │                   │       Shared Data Fabric        │ │
│ │ - Policy / Dollar Thresholds  │                   │ - Multi-Tenant MongoDB Models   │ │
│ │ - Confidence Scoring Engine   │◄─────────────────►│ - Cross-Pod Unified Context     │ │
│ │ - Human Approval Queue (HITL) │                   │ - Bi-directional Cache Layer    │ │
│ │ - Immutable Audit Log         │                   │                                 │ │
│ └──────────────┬────────────────┘                   └────────────────┬────────────────┘ │
│                │                                                     │                  │
└────────────────┼─────────────────────────────────────────────────────┼──────────────────┘
                 │ Write-Back (Post-Approval)                          │ Sync & Pull
                 ▼                                                     ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   ERP CONNECTOR KIT                                     │
│  ┌────────────────────────┐  ┌─────────────────────────┐  ┌──────────────────────────┐  │
│  │ Odoo JSON-RPC / XML-RPC│  │ NetSuite SuiteTalk (v2) │  │ Generic REST & Webhooks  │  │
│  └────────────────────────┘  └─────────────────────────┘  └──────────────────────────┘  │
└────────────────────────────────────────────┬────────────────────────────────────────────┘
                                             │
                                     Customer's Live ERP
```

---

## 2. Agent Communication Protocol (ACP)

Inter-agent routing, tool evaluations, and trust verification use the strict **ACP Envelope Specification**.

### 2.1 ACP Packet Structure
```typescript
export interface IACPPacket<T = any> {
  packet_id: string;          // UUID v4
  trace_id: string;           // Distributed trace ID across pods
  source_agent: 'ORCHESTRATOR' | 'SUPPORT_POD' | 'SALES_POD' | 'FINANCE_POD' | 'TRUST_GUARD';
  target_agent: 'ORCHESTRATOR' | 'SUPPORT_POD' | 'SALES_POD' | 'FINANCE_POD' | 'TRUST_GUARD' | 'BROADCAST';
  intent: string;             // e.g. 'ANALYZE_TICKET', 'CROSS_POD_ALERT', 'EXECUTE_REFUND'
  timestamp: number;
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
  organization_id: string;
  context: {
    account_id?: string;
    deal_id?: string;
    ticket_id?: string;
    invoice_id?: string;
    erp_sync_status?: string;
  };
  payload: T;
  evaluation: {
    confidence_score: number;  // 0.00 to 1.00
    requires_approval: boolean;
    reasoning: string;
    policy_threshold_breached?: string;
  };
  reversible_meta?: {
    is_reversible: boolean;
    rollback_handler: string;
    rollback_payload: Record<string, any>;
  };
}
```

### 2.2 Event Routing & State Machine
1. **Intake Event**: Incoming webhook or user request creates a trace ID and ACP packet.
2. **Context Enrichment**: Orchestrator queries MongoDB Shared Data Fabric for unified Account 360 history.
3. **Agent Pod Evaluation**: LLM (Claude 3.5 Sonnet) analyzes context with strict tool schema constraints and emits a proposed action + confidence score + reasoning.
4. **Trust Guard Interception**:
   - IF $confidence \ge threshold$ AND $dollarAmount \le limit$ AND pod $\ne$ `FINANCE_POD`: Auto-execute to ERP and log audit.
   - ELSE: Route to `AgentAction` collection with status `PENDING_APPROVAL`.
5. **Human Resolution**: Human approver clicks Approve/Edit/Reject in Admin Console.
6. **Execution & Audit**: Action executes against ERP Connector with idempotency key and writes to append-only `AuditLog`.

---

## 3. Database Schema & Multi-Tenancy Architecture (MongoDB)

All business entities belong to an `organization_id` with strict compound indexing.

```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│   Organization   │◄──────┤       User       │       │    AgentAction   │
└────────┬─────────┘       └──────────────────┘       └────────┬─────────┘
         │ 1                                                   │ 1
         │ N                                                   │ 1
┌────────▼─────────┐       ┌──────────────────┐       ┌────────▼─────────┐
│     Account      │◄──────┤     Contact      │       │     AuditLog     │
└────────┬─────────┘       └──────────────────┘       └──────────────────┘
         │ 1
         ├─────────────────┬──────────────────┐
         │ N               │ N                │ N
┌────────▼─────────┐ ┌─────▼────────────┐ ┌───▼──────────────┐
│      Ticket      │ │       Deal       │ │     Invoice      │
└──────────────────┘ └──────────────────┘ └────────┬─────────┘
                                                   │ 1
                                                   │ N
                                          ┌────────▼─────────┐
                                          │   Transaction    │
                                          └──────────────────┘
```

### 3.1 Primary Schema Definitions & Indexes

#### 1. `organizations`
- `_id`: ObjectId
- `name`: String (required)
- `slug`: String (unique index)
- `approval_policies`:
  - `support_refund_limit_dollars`: Number (default: 100)
  - `support_confidence_threshold`: Number (default: 0.85)
  - `sales_auto_outreach_threshold`: Number (default: 0.90)
  - `finance_strict_human_approval`: Boolean (always `true`)
- `erp_config`:
  - `provider`: String (`odoo`, `mock`, `netsuite`, `generic_rest`)
  - `host`: String
  - `db`: String
  - `encrypted_credentials`: String
  - `sync_interval_mins`: Number (default: 15)
  - `last_synced_at`: Date
- *Indexes*: `{ slug: 1 }`

#### 2. `accounts` (Shared Data Fabric Hub)
- `_id`: ObjectId
- `organization_id`: ObjectId (indexed)
- `erp_id`: String (indexed)
- `name`: String (indexed)
- `tier`: String (`ENTERPRISE`, `MID_MARKET`, `SMB`)
- `health_score`: Number (0-100)
- `open_deals_count`: Number
- `open_tickets_count`: Number
- `overdue_invoices_count`: Number
- `last_synced_at`: Date
- *Indexes*: `{ organization_id: 1, erp_id: 1 }`, `{ organization_id: 1, health_score: 1 }`

#### 3. `tickets`
- `_id`: ObjectId
- `organization_id`: ObjectId (indexed)
- `account_id`: ObjectId (indexed)
- `contact_id`: ObjectId
- `erp_id`: String
- `ticket_number`: String (unique per org)
- `channel`: String (`CHAT`, `EMAIL`, `PORTAL`)
- `subject`: String
- `messages`: Array of `{ sender_type, sender_name, content, timestamp }`
- `category`: String (`BILLING`, `ORDER_STATUS`, `TECHNICAL`, `REFUND_REQUEST`, `OTHER`)
- `severity`: String (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
- `status`: String (`NEW`, `IN_PROGRESS`, `PENDING_APPROVAL`, `RESOLVED`, `ESCALATED`)
- `confidence_score`: Number (0.00 - 1.00)
- `ai_draft_response`: String
- `resolution_summary`: String
- *Indexes*: `{ organization_id: 1, status: 1 }`, `{ organization_id: 1, account_id: 1 }`

#### 4. `agent_actions` (Approval Queue)
- `_id`: ObjectId
- `organization_id`: ObjectId (indexed)
- `trace_id`: String (indexed)
- `agent_type`: String (`SUPPORT_AGENT`, `SALES_AGENT`, `FINANCE_AGENT`, `ORCHESTRATOR`)
- `action_type`: String (e.g. `ISSUE_REFUND`, `CREATE_CREDIT_MEMO`, `SEND_OUTREACH`)
- `target_entity_type`: String (`Ticket`, `Deal`, `Invoice`, `Account`)
- `target_entity_id`: ObjectId
- `input_context`: Object
- `output_payload`: Object
- `reasoning`: String (Human-readable rationale)
- `confidence`: Number
- `risk_level`: String (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
- `status`: String (`PENDING_APPROVAL`, `APPROVED`, `REJECTED`, `EXECUTED`, `FAILED`, `ROLLED_BACK`)
- `approved_by`: ObjectId (User ID)
- `approved_at`: Date
- `rejection_reason`: String
- `reversible`: Boolean
- `rollback_payload`: Object
- *Indexes*: `{ organization_id: 1, status: 1 }`, `{ trace_id: 1 }`

#### 5. `audit_logs` (Append-Only Immutable Ledger)
- `_id`: ObjectId
- `organization_id`: ObjectId (indexed)
- `trace_id`: String (indexed)
- `action_id`: ObjectId (indexed)
- `actor_type`: String (`AI_AGENT`, `USER`, `SYSTEM`)
- `actor_id`: String
- `actor_name`: String
- `action`: String
- `resource_type`: String
- `resource_id`: String
- `state_before`: Object
- `state_after`: Object
- `timestamp`: Date (default: Date.now, indexed)
- *Indexes*: `{ organization_id: 1, timestamp: -1 }`, `{ organization_id: 1, resource_id: 1 }`

---

## 4. ERP Connector Kit & Synchronization

### 4.1 Connector Architecture
The ERP connector layer abstracts third-party ERP communication behind a unified interface:

```typescript
export interface IErpConnector {
  testConnection(): Promise<{ success: boolean; message: string }>;
  fetchPartners(since?: Date): Promise<ErpPartner[]>;
  fetchInvoices(since?: Date): Promise<ErpInvoice[]>;
  fetchTickets(since?: Date): Promise<ErpTicket[]>;
  fetchSaleOrders(since?: Date): Promise<ErpSaleOrder[]>;
  
  // Write-Back Methods (Called only by Trust Layer post-approval)
  writeRefund(invoiceId: string, amount: number, reason: string): Promise<ErpWriteResult>;
  updateTicketStatus(ticketId: string, status: string, summary: string): Promise<ErpWriteResult>;
  createCrmLead(dealData: any): Promise<ErpWriteResult>;
}
```

### 4.2 Odoo Implementation & Mock Engine
- **Odoo Live Connector (`apps/api/src/services/erp/odoo.ts`)**: Uses XML-RPC / JSON-RPC over `res.partner`, `account.move`, and `helpdesk.ticket`.
- **Deterministic Mock Engine (`apps/api/src/mock-erp/`)**: An in-process Express server mimicking Odoo endpoints for automated unit/integration testing and instant zero-dependency local development.

---

## 5. Trust & Human-in-the-Loop Governance Layer

### 5.1 Hard Invariants & Code Constraints
1. **Zero Autonomous Financial Execution**: The Finance Agent Pod does not possess write access to disbursement or payment endpoints. Any generated output is strictly a `Draft Reconciliation` or `Flagged Anomaly Report`.
2. **Idempotency Safeguard**: Every write-back payload includes an `idempotency_key = sha256(action_id + timestamp)` verified in Redis before submission to ERP.
3. **Reversibility / Rollback Engine**: Reversible actions record the exact prior state in `rollback_payload`. When an authorized admin triggers a rollback, Nexora applies the inverse operation to the ERP and logs a compensation audit entry.

---

## 6. Directory & Monorepo Structure

```
Nexora/
├── MASTER_PROMPT.md        # Master prompt and sprint-by-sprint constraints
├── PROGRESS.md             # Project progress tracker
├── DESIGN.md               # UI design system and API contracts
├── ARCHITECTURE.md         # Core system architecture (this file)
├── package.json            # Root workspace config
├── tsconfig.base.json      # Base TypeScript config
├── .gitignore              # Strict secret and build exclusions
├── .env.example            # Documented environment templates
├── packages/
│   └── core/               # Shared ACP types, schemas, and utils
│       ├── src/
│       │   ├── types/      # ACP envelope, entity types
│       │   └── constants/  # Status enums, default thresholds
│       └── package.json
├── apps/
│   ├── api/                # Backend API & Agent Pods
│   │   ├── src/
│   │   │   ├── agents/     # SupportPod, SalesPod, FinancePod, Orchestrator
│   │   │   ├── config/     # Database, Redis, Environment loaders
│   │   │   ├── controllers/# Express route controllers
│   │   │   ├── middleware/ # Auth, RBAC, Tenancy, Error handlers
│   │   │   ├── mock-erp/   # Offline deterministic ERP simulator
│   │   │   ├── models/     # Mongoose Schemas & Indexes
│   │   │   ├── routes/     # Express route definitions (/api/v1/...)
│   │   │   ├── services/   # ClaudeService, OdooConnector, AuditService
│   │   │   └── server.ts   # Entry point
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/                # React Admin Console
│       ├── src/
│       │   ├── components/ # Atomic UI components & views
│       │   ├── context/    # Auth, Theme contexts
│       │   ├── pages/      # Dashboard, Approvals, Tickets, Settings
│       │   ├── services/   # API client
│       │   └── App.tsx     # Main entry point
│       ├── package.json
│       ├── tailwind.config.js
│       └── vite.config.ts
```
