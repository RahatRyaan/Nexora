# My Nexora Project Notes — Personal Reference Guide

---

## What is Nexora?

Nexora is an enterprise AI platform I built from scratch. It connects to a company's existing ERP system (like Odoo, NetSuite, or SAP) and runs three autonomous AI agents on top of it — a **Support Agent**, a **Sales Agent (SDR)**, and a **Finance/Ops Agent**.

Think of it as giving your ERP system "hands and a brain". Instead of employees manually toggling between 5 different systems to resolve a customer ticket or match an invoice, Nexora's agents do that work automatically — and ask a human for permission only when it matters (like a refund over $100).

---

## What Problem Does It Solve?

| Before Nexora | After Nexora |
|---|---|
| Support agent manually logs into 4 systems to answer one ticket | Support Pod queries live ERP in seconds and drafts a response |
| Finance team manually matches 200 POs, receipts, and invoices every month | Finance Pod runs 3-way match automatically and flags discrepancies |
| SDR spends 70% of time on research and manual CRM logging | Sales Pod enriches leads, drafts outreach, syncs CRM automatically |
| No shared context between departments | All 3 pods share one live data fabric — Support sees open deals, Finance sees billing disputes |

---

## How Does It Work? (Simple Explanation)

```
Customer sends a support message
        ↓
Support Agent Pod reads message + pulls live ERP data (order status, invoices, history)
        ↓
LLM (Claude/OmniRoute/Gemini) classifies it, drafts a reply, assigns a confidence score
        ↓
Is confidence >= 85% and refund amount <= $100?
    YES → Execute action automatically + log to immutable audit trail
    NO  → Put it in Human Approval Queue
        ↓
Admin reviews in dashboard → clicks Approve/Edit/Reject
        ↓
On Approve → writes back to Odoo ERP with idempotency protection
        ↓
Action and all state changes logged to AuditLog (immutable, forever)
```

---

## The Three AI Agent Pods

### 1. Support Agent Pod
- Reads customer tickets (chat or email).
- Fetches live ERP data: order status, billing history, subscription tier.
- Classifies the ticket: category, severity, sentiment, confidence score.
- Drafts an ERP-grounded personalized reply.
- Proposes actions: issue refund, apply credit, escalate, update status.
- If confidence is too low or amount too high — queues for human approval.

### 2. Sales Agent Pod (SDR)
- Enriches incoming leads with company data and intent signals.
- Generates personalized multi-step email outreach sequences.
- Computes an intent score (0.0 to 1.0) based on firmographic fit.
- Auto-syncs deals and pipeline stages to ERP CRM.
- Escalates hot leads (high-intent replies) to a human Account Executive.

### 3. Finance/Ops Agent Pod
- Runs 3-way PO-Receipt-Invoice matching.
- Detects discrepancies (price variance, wrong tax rate, duplicate invoices).
- Flags anomalies to the approval queue.
- Generates draft reconciliation reports.
- **HARD RULE**: Never executes a payment or GL posting autonomously. Ever. It always creates a draft and waits for human sign-off.

---

## The Trust & Control Layer

This is the most important part of Nexora from a security and compliance standpoint.

- **Approval Queue**: Every risky agent action lands here first.
- **Confidence Scoring**: Every LLM output includes a 0.00–1.00 confidence score. Below threshold = auto-escalate.
- **Policy Engine**: Org-configurable rules — e.g., refunds over $100 always need human sign-off.
- **Idempotency Guard**: A double-click on Approve won't write to ERP twice. SHA-256 token check.
- **Rollback Engine**: Reversible actions can be undone with one click. Compensation record is created.
- **Immutable Audit Log**: Mongoose pre-save hook prevents any modification. Every action has before/after state diffs.

---

## How to Use It

### Start the project
```bash
cd ~/Nexora
npm install
cp .env.example .env        # fill in your MongoDB URI, AI key, JWT secret
npm run db:seed --workspace=@nexora/api
npm run dev                  # API on :5000, Web on :3000
```

### Log into the dashboard
- Go to `http://localhost:3000`
- Login: `admin@acme-corp.com` / `AdminPassword123!`

### Simulate a customer ticket
1. Go to **Support Tickets** in the sidebar.
2. Click **Simulate Inbound Ticket**.
3. Pick a scenario (Refund $150, Seat Upgrade, Tax Dispute).
4. Watch the AI triage it — see confidence score and proposed action.
5. If it lands in **Approval Queue**, go there and Approve/Reject/Edit.

### Check the Audit Log
- Go to **Audit Explorer** — see every agent decision with before/after state diff.

---

## When and Where to Use Nexora

| Use Case | Department | Example |
|---|---|---|
| Customer refund requests | Customer Support | Customer complains about delayed shipment — agent reads ERP, proposes $150 credit, manager approves in 1 click |
| Enterprise lead outreach | Sales / RevOps | New ICP lead signs up — agent researches company, drafts 3-step email sequence, queues for rep review |
| Invoice discrepancy detection | Finance / Accounting | Vendor sends invoice for $14,500 when PO says $13,500 — Finance Pod flags 7.4% variance before payment runs |
| Month-end reconciliation | Finance | Finance Pod prepares draft reconciliation report — human reviews and signs off |
| Cross-department churn risk | Support + Sales | High-value customer ($50k deal) opens angry ticket — Support Pod broadcasts churn risk to Sales Pod, AE is notified instantly |

---

## What Can I Do With This Project?

1. **Demo to clients or employers** — show a live demo with the pre-seeded enterprise data.
2. **Deploy to production** — connect your real Odoo sandbox, swap the Mock ERP connector for real one.
3. **Extend with new agent pods** — the ACP (Agent Communication Protocol) makes adding new agents straightforward.
4. **Add more ERP connectors** — the `IErpConnector` interface is designed for NetSuite, Dynamics, Zoho.
5. **Add real authentication** — replace the single-org setup with multi-tenant org creation flow.

---

## The Tech Stack I Used

| Layer | Technology | Why I chose it |
|---|---|---|
| Backend API | Node.js + Express + TypeScript | Mature ecosystem, fast I/O, type-safe |
| Database | MongoDB Atlas + Mongoose | Document model fits multi-tenant ERP data well |
| AI Agent Runtime | Anthropic Claude / OmniRoute (OpenAI-compatible) | Reliable tool calling, deterministic fallback for testing |
| Frontend | React 18 + Vite + Tailwind CSS | Fast dev cycle, component-based, Tailwind for rapid enterprise UI |
| Shared Types | `@nexora/core` package | ACP envelope and all entity types shared between API and Web |
| Security | Helmet, express-rate-limit, bcryptjs, jsonwebtoken | Industry standard for Express API hardening |
| Deployment | Docker, Render.com, Vercel | Zero-ops deployment for demo and production |

---

## Interview Questions and Answers

### Architecture & Design

**Q: Why did you use MongoDB instead of PostgreSQL for this project?**

> MongoDB's document model is a natural fit for the multi-tenant, schema-flexible nature of ERP data. Account records, ticket messages, invoice match details, and audit logs all vary significantly in structure between customers and ERP providers. Mongoose gives me schema validation and index control on top of that flexibility. If I was building a pure financial ledger where immutability and ACID compliance were critical at scale, I would use PostgreSQL — I acknowledged that tradeoff explicitly in the architecture notes.

---

**Q: How does the Agent Communication Protocol (ACP) work?**

> Every inter-agent message — whether a task dispatch, a cross-pod churn risk alert, or an action evaluation — is wrapped in a typed `IACPPacket` envelope. It carries: source/target agent identifiers, a trace ID for distributed tracing, an intent string, a priority level, the organization context, the actual payload, and critically — an `evaluation` block with confidence score, reasoning, and whether human approval is required. This means every agent decision is self-describing and auditable without having to query the database.

---

**Q: How do you prevent the AI from making dangerous autonomous decisions?**

> Three layers:
> 1. **Confidence threshold**: If the LLM's confidence score is below 0.85 (configurable per org), the action is automatically escalated.
> 2. **Dollar policy**: Support refunds above the org-configured limit (e.g., $100) go to the approval queue regardless of confidence.
> 3. **Finance hard rule**: The `FinanceAgentPod.validateAutonomousPaymentAllowed()` method throws an error at the code level. There is no path through the codebase where finance writes to the GL autonomously. The HTTP endpoint returns 403 `AUTONOMOUS_PAYMENT_PROHIBITED`.

---

**Q: How does your idempotency guard work?**

> When an action is approved, I compute a SHA-256 hash from `actionId + JSON.stringify(output_payload)` and store it in an in-memory LRU cache with a 24-hour TTL. Before any ERP write-back executes, I check the cache. If the token already exists, I return the cached result immediately without writing to ERP again. This prevents double-billing or duplicate credits if a user double-clicks Approve or a network retry fires.

---

**Q: How does the Rollback Engine work?**

> When an agent action is created, if it is reversible (e.g., issue a credit memo), I store a `rollback_payload` in MongoDB. For example: `{ action: "CANCEL_CREDIT_MEMO", invoice_id: "INV-203", amount: 150 }`. When an admin clicks Rollback in the Audit Explorer, the `ExecutionService.rollbackAction()` method applies the compensation operation to the ERP, flips the `AgentAction` status to `ROLLED_BACK`, and creates a new immutable `AuditLog` entry recording who rolled it back and what the state delta was. The AuditLog itself can never be modified — the Mongoose pre-save hook throws an error on any update attempt.

---

**Q: How is the frontend architecture organized?**

> The React app has a single context-driven shell. `AuthContext` manages JWT sessions — on load, it reads a stored token from localStorage, validates it via `GET /api/v1/auth/me`, and if valid, boots the admin console. If not, it renders the login screen. `ThemeContext` handles persistent dark/light mode with system preference detection. All API calls go through a single `api.ts` service layer that attaches the JWT header. The `App.tsx` orchestrates a 15-second polling loop to refresh KPI stats, approval queue, and ticket data for live telemetry.

---

**Q: How did you handle the ERP connectivity for testing without a real Odoo instance?**

> I built a `MockErpServer` class that runs in-process and exposes the exact same `IErpConnector` interface as the real `OdooConnector`. It holds deterministic in-memory enterprise datasets — 4 partners, 4 invoices, 3 helpdesk tickets, 2 sale orders — and supports the same read and write methods. The `ErpConnectorFactory.getFromEnv()` function chooses Mock or Odoo based on `MOCK_ERP_ENABLED=true` in `.env`. This means all automated tests and the CI pipeline run deterministically without any external dependency.

---

**Q: If you were to scale this to 1,000 organizations, what would you change?**

> A few things. First, the current idempotency guard is in-memory — I'd move it to Redis for horizontal scaling. Second, the agent pods run synchronously in the request lifecycle — I'd push them to a BullMQ/Redis job queue so intake requests return immediately and agents process asynchronously. Third, all MongoDB queries are already scoped with `organization_id` and have compound indexes, which is the right multi-tenancy foundation — but at 1,000 orgs I'd also evaluate Atlas tenant-level isolation or sharding by organization ID. Fourth, the LLM call is currently synchronous — I'd add a proper retry circuit breaker with exponential backoff using a library like `p-retry`.

---

**Q: How does the cross-pod context sharing work?**

> When the Support Agent Pod processes a ticket for a customer, before classifying it, it queries the Shared Data Fabric for the full Account 360 context: all open sales deals, recent invoices, prior ticket history. It includes all of this in the LLM prompt. If the result is a churn risk (angry customer with a high-value open deal), it calls `CrossPodOrchestrator.broadcastChurnRiskAlert()`, which lowers the Account health score, injects a churn signal into every linked sales deal's `intent_signals` array, and writes an immutable audit log entry. The Sales Pod's next enrichment pass will pick up this signal and flag it to the Account Executive.

---

**Q: What's the difference between your project and a generic AI chatbot or a tool like Intercom Fin?**

> Three things. First, Nexora reads and writes to the actual ERP — it doesn't answer questions from a static knowledge base. When it tells a customer their order is delayed, it's reading live data from Odoo. Second, it coordinates three agent pods over one shared data fabric — Support knows about open deals, Sales knows about billing disputes. Generic chatbots are siloed. Third, it has a real human approval layer before any ERP write. Intercom Fin answers questions; Nexora executes transactions.

---

**Q: What was the hardest part to build?**

> The Trust Layer, honestly. Getting the state machine right — `PENDING_APPROVAL → APPROVED → EXECUTED → ROLLED_BACK` — with proper idempotency, audit logging on every transition, and the rollback compensation logic required careful design. The easy path would have been to just execute actions directly, but that would have made the system untrustworthy for any real financial operations. The immutability enforcement on `AuditLog` via a Mongoose pre-save hook is a simple trick but it's a critical one — it means I can guarantee to any auditor that the log has never been tampered with.

---

## How to Update & Extend This Project

### Adding a New AI Agent Pod

1. Create a new file: `apps/api/src/agents/yourPod.ts`
2. Export a class with a static method, e.g. `YourPod.processTask(input)`
3. Inside, use `llmClient.triageSupportTicket()` or add a new method to `LLMClient` for your prompt
4. Create action via `AgentAction.create({ agent_type: AgentType.ORCHESTRATOR, ... })`
5. Add `AgentType.YOUR_POD` to `packages/core/src/constants/index.ts`
6. Create a controller in `apps/api/src/controllers/` and a route in `apps/api/src/routes/`
7. Register the route in `apps/api/src/routes/index.ts`
8. Add a UI page in `apps/web/src/pages/` and a sidebar link in `Sidebar.tsx`

### Adding a New ERP Connector (e.g. NetSuite)

1. Create `apps/api/src/services/erp/netsuiteConnector.ts`
2. Implement the `IErpConnector` interface (same 6 methods as OdooConnector)
3. Add `ErpProvider.NETSUITE = 'netsuite'` to `packages/core/src/constants/index.ts`
4. Register it in `ErpConnectorFactory.createConnector()` switch statement
5. Update `ARCHITECTURE.md` — the doc must always match the code

### Changing the LLM Provider

Edit `.env` only:
```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o
```
No code changes needed. The `LLMClient` handles the routing.

### Adding a New Approval Policy Rule

1. Add the new threshold field to `IOrganizationApprovalPolicies` in `packages/core/src/types/entities.ts`
2. Add it to the `Organization` Mongoose schema in `apps/api/src/models/Organization.ts`
3. Read the value inside `SupportAgentPod.processTicketIntake()` (or whichever pod applies)
4. Update the seed script so the demo org has a sensible default
5. Add a UI input in `apps/web/src/pages/SettingsPage.tsx`

---

## Future Features I Can Implement

### Near-Term (Sprint 10–12)

| Feature | Where to Build | Difficulty |
|---|---|---|
| **Real-time WebSocket notifications** for approval queue alerts | Add `socket.io` to `apps/api`, listen in frontend `AuthContext` | Medium |
| **Email escalation via SMTP** when a critical ticket is auto-escalated | Wire up `nodemailer` in `apps/api/src/services/email/` | Easy |
| **Multi-tenant org creation UI** — invite teammates, create new workspace | Add `POST /api/v1/organizations` flow + onboarding wizard in React | Medium |
| **Voice channel for Support Pod** | Integrate Twilio or Whisper for audio transcription, feed to `ticket/intake` | Hard |
| **NetSuite & Dynamics 365 connectors** | Implement `IErpConnector` for SuiteTalk REST API and Dynamics Web API | Hard |
| **Bulk ticket operations** — approve 10 actions at once | Add `POST /api/v1/approvals/bulk-approve` endpoint + UI multi-select | Medium |
| **Ticket assignment to specific agents** | Add `assigned_user_id` filter to approval queue + drag-and-drop UI | Medium |

### Medium-Term (Sprint 13–18)

| Feature | Description |
|---|---|
| **Redis BullMQ Job Queue** | Move AI agent calls off the HTTP request cycle. Tickets are processed async, UI polls for completion. Unblocks horizontal scaling. |
| **Proactive Churn Outreach** | Finance Pod detects overdue invoice → Support Pod proactively contacts customer before they complain. Needs a scheduler (node-cron). |
| **Predictive Lead Scoring** | Sales Pod uses historical deal outcomes to score new leads better. Fine-tune a small model on your own closed/lost deal data. |
| **Meeting Booking Integration** | Sales Pod integrates with Google Calendar or Cal.com API to propose and confirm meeting times automatically. |
| **SOC 2 Type II Audit Package** | Export filtered Audit Logs as PDF/CSV for compliance reviews. Add `GET /api/v1/audit-logs/export` with date range filters. |
| **Connector SDK** | A plugin system so customers can write their own ERP adapters. Document the `IErpConnector` interface as a public API. |
| **Mobile-Responsive Approval App** | A simplified mobile PWA that pings the platform admin when a new high-risk action needs approval — approve from their phone. |

### Long-Term (Sprint 19+)

| Feature | Description |
|---|---|
| **Multi-tenant SaaS billing** | Add Stripe integration — per-agent-pod pricing, usage-based metering on AI actions, per-org subscription tiers. |
| **AI Performance Analytics** | Track accuracy per agent over time. Build a feedback loop where rejected actions train the prompt to be more conservative next time. |
| **Autonomous Finance Pod Receipts** | When Finance Pod's 3-way match is perfect and invoice is under a micro-transaction threshold ($50), allow auto-posting with enhanced audit trail. |
| **Sales Pod Voice Calling** | Integrate Bland.ai or Retell.ai for outbound AI voice calls to qualified leads, with full transcript stored in Shared Data Fabric. |
| **Connector Marketplace** | Pre-built connectors for Shopify, Stripe, Salesforce, HubSpot that feed into the Shared Data Fabric alongside the ERP connector. |

---

## How to Stay Updated with This Codebase

If you come back to this project after a break, follow this checklist:

1. **Read `PROGRESS.md`** — tells you exactly what sprint you're on and what's done.
2. **Run `npm test --workspace=@nexora/api`** — if all tests pass, codebase is healthy.
3. **Check `ARCHITECTURE.md`** — this is the ground truth for what each component does.
4. **Look at `MY_PROJECT_GUIDE.md`** (this file) — for context on why decisions were made.
5. **Run `npm run test:db --workspace=@nexora/api`** — confirm your MongoDB Atlas connection is still live.
6. **Run `npm run test:omni --workspace=@nexora/api`** — confirm your AI provider endpoint is still reachable.

Then pick up from the "Future Features" list above and use the sprint format from `MASTER_PROMPT.md` to build the next thing.
