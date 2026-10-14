# Nexora — The Agentic ERP Layer for Sales, Support & Finance

> **An enterprise AI agent platform that plugs directly into your ERP and runs three autonomous agent pods — Support, Sales (SDR), and Finance/Ops — over one shared, live data layer with full human-in-the-loop trust governance.**

---

## Live Demo Credentials

After running the project, sign in at `http://localhost:5000`:

| Role | Email | Password |
|---|---|---|
| **Platform Admin** | admin@acme-corp.com | AdminPassword123! |
| **Support Lead** | marcus.support@acme-corp.com | AdminPassword123! |

---

## Quick Start

### Prerequisites
- Node.js >= 20
- npm >= 10
- MongoDB Atlas free cluster (or local MongoDB)
- OmniRoute / Anthropic / OpenAI API key

### 1. Clone & Install
```bash
git clone https://github.com/your-username/nexora.git
cd nexora
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env — fill in MONGODB_URI, OMNIROUTE_API_KEY, JWT_SECRET
```

### 3. Seed Demo Data
```bash
npm run db:seed --workspace=@nexora/api
```

### 4. Run Development Stack
```bash
npm run dev
```
- **API**: `http://localhost:5000/api/v1/health`
- **Web Console**: `http://localhost:3000`

### 5. Run Automated Test Suite
```bash
npm test --workspace=@nexora/api
```

---

## What Nexora Does

Nexora sits between enterprise applications and ERP systems, running three collaborative AI agent pods over a shared MongoDB Data Fabric:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Admin & Ops Console                            │
│                     (React + Vite + Tailwind CSS)                       │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │ HTTPS / JWT
┌─────────────────────────────▼───────────────────────────────────────────┐
│                    Express API Gateway + ACP Router                     │
│             (Rate Limiting, Helmet CSP, JWT Auth, RBAC)                 │
└────┬──────────────────┬─────────────────────┬───────────────────────────┘
     │                  │                     │
┌────▼──────┐  ┌────────▼──────┐   ┌──────────▼───────┐
│ Support   │  │  Sales SDR    │   │  Finance/Ops     │
│ Agent Pod │  │  Agent Pod    │   │  Agent Pod       │
│ (Triage,  │  │  (Outreach,   │   │  (3-way match,   │
│ Refunds)  │  │  Intent, CRM) │   │  Anomaly Detect) │
└────┬──────┘  └────────┬──────┘   └──────────┬───────┘
     │                  │                      │
     └──────────────────┴──────────────────────┘
                        │ Shared Data Fabric (MongoDB Atlas)
┌───────────────────────▼────────────────────────────────┐
│    Trust & Control Layer (Human Approval Queue +        │
│    Idempotency Guard + Immutable Audit Log + Rollback)  │
└───────────────────────┬────────────────────────────────┘
                        │ Post-Approval ERP Write-Back
              ┌─────────▼──────────┐
              │  ERP Connector Kit  │
              │ (Odoo / Mock / REST)│
              └─────────────────────┘
```

---

## Architecture Decisions

| Decision | Rationale |
|---|---|
| **Single MongoDB multi-tenant fabric** | All agent pods share one source of truth. Support sees open deals; Finance sees overdue invoices. No data silos. |
| **Human-in-the-loop before every ERP write** | Enterprise trust requires human sign-off on anything that touches billing, refunds, or credit. |
| **Multi-provider LLM layer** | Works with Anthropic Claude, OmniRoute, OpenAI, Gemini, or a deterministic fallback engine — no vendor lock-in. |
| **Finance pod: zero autonomous payment** | Hard-coded HTTP 403 on any payment execution call. Architectural constraint, not just a policy flag. |
| **Immutable append-only AuditLog** | Mongoose pre-save hook prevents mutation. Cryptographic state diffs for every agent action. |
| **Monorepo workspace layout** | `packages/core` ships shared ACP types to both API and Web without duplication or version drift. |

---

## Project Structure

```
Nexora/
├── packages/core/          # Shared ACP envelopes, entity types, and constants
├── apps/api/               # Express Node.js API + 3 Agent Pods + ERP Connector Kit
│   └── src/
│       ├── agents/         # supportPod, salesPod, financePod, crossPodOrchestrator
│       ├── services/
│       │   ├── ai/         # LLM Client (multi-provider)
│       │   ├── erp/        # OdooConnector, MockConnector, SyncService
│       │   └── trust/      # ExecutionService, IdempotencyGuard
│       ├── models/         # Mongoose: Organization, User, Account, Deal,
│       │                   #   Ticket, Invoice, Transaction, AgentAction, AuditLog
│       ├── routes/         # /auth, /tickets, /approvals, /sales, /finance, /erp, /audit-logs
│       └── scripts/        # seed, testSprint1–6, testE2E, smokeTest, secretScan
└── apps/web/               # React 18 + Vite + Tailwind CSS Admin Console
    └── src/
        ├── pages/          # Login, Dashboard, Approvals, Tickets, Accounts, Audit, Settings
        ├── context/        # AuthContext (JWT), ThemeContext (Dark/Light)
        └── services/       # API client with token interceptors
```

---

## Key API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Liveness probe |
| `POST` | `/api/v1/auth/login` | Login → JWT token |
| `GET` | `/api/v1/stats/overview` | KPI dashboard telemetry |
| `POST` | `/api/v1/tickets/intake` | Autonomous Support Pod triage |
| `GET` | `/api/v1/approvals` | Human Approval Queue |
| `POST` | `/api/v1/approvals/:id/approve` | Execute approved action + ERP write-back |
| `POST` | `/api/v1/approvals/:id/reject` | Reject with mandatory audit note |
| `POST` | `/api/v1/approvals/:id/rollback` | Reverse an executed action |
| `GET` | `/api/v1/audit-logs` | Immutable audit trail explorer |
| `POST` | `/api/v1/erp/sync` | Trigger bi-directional ERP synchronization |
| `POST` | `/api/v1/erp/write-back/dry-run` | Preview ERP write-back without committing |
| `POST` | `/api/v1/sales/outreach/generate` | Sales SDR lead enrichment + email sequence |
| `POST` | `/api/v1/finance/invoices/match` | Finance 3-way PO / Receipt / Invoice match |
| `GET` | `/api/v1/finance/anomalies` | Anomaly detection across invoice stream |
| `POST` | `/api/v1/finance/payments/execute-autonomous` | Returns `403 AUTONOMOUS_PAYMENT_PROHIBITED` |

---

## Deployment

### Docker (Single Container)
```bash
docker compose up --build -d
# App available at http://localhost:5000
```

### Render.com (Cloud)
1. Push to GitHub.
2. New Web Service → connect repo.
3. Set env vars in Render Dashboard: `MONGODB_URI`, `JWT_SECRET`, `OMNIROUTE_API_KEY`, `OMNIROUTE_BASE_URL`.
4. `render.yaml` handles build + start.

### Vercel (Frontend-only with API proxy)
- Deploy `apps/web/` to Vercel.
- Set `VITE_API_URL` to your Render API URL.
- `apps/web/vercel.json` handles proxy rewrites.

---

## Environment Variables Reference

```env
# Core
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/nexora_erp?retryWrites=true&w=majority

# Auth
JWT_SECRET=your_32_char_minimum_secret

# AI Provider (choose one)
AI_PROVIDER=omniroute            # or anthropic / openai
OMNIROUTE_API_KEY=sk-...
OMNIROUTE_BASE_URL=http://localhost:20128/v1
ANTHROPIC_API_KEY=sk-ant-...     # if using Anthropic directly

# ERP
MOCK_ERP_ENABLED=true            # set false and configure ODOO_* for real Odoo
ODOO_HOST=https://your-odoo.com
ODOO_DB=odoo_db
ODOO_USERNAME=scoped_service_user
ODOO_PASSWORD=api_token

# Policy Thresholds
DEFAULT_CONFIDENCE_THRESHOLD=0.85
SUPPORT_MAX_AUTO_REFUND_DOLLARS=100
```

---

## Known Limitations & Honest Scope Statement

- **AI Provider**: OmniRoute runs locally. For production, configure a hosted Claude, OpenAI, or Gemini endpoint in `.env`.
- **ERP**: Sprint 2 ships a production-grade Odoo XML-RPC connector. The mock ERP engine enables deterministic local testing without an Odoo license.
- **Voice Channel**: Chat and email only (Sprint 3). Voice is a Phase 2 item per the product spec.
- **Multi-ERP connectors**: NetSuite, Dynamics, Zoho support requires Sprint 10+ connector SDK work.
- **MongoDB indexes**: Compound indexes defined on all high-traffic query paths. Production Atlas cluster tuning is advised for >10K records.
- **Finance pod**: Never executes payments autonomously. All financial actions require explicit human sign-off enforced at the code level.

---

## Sprint Completion Checklist

| Sprint | Scope | Status |
|---|---|---|
| Sprint 0 | Monorepo scaffolding, ACP types, web/API skeletons | ✅ |
| Sprint 1 | MongoDB schemas, Mock ERP, seed dataset | ✅ |
| Sprint 2 | Odoo ERP connector, bi-directional sync | ✅ |
| Sprint 3 | LLM AI integration, Support Agent Pod | ✅ |
| Sprint 4 | Approval Queue, Trust Layer, Rollback Engine | ✅ |
| Sprint 5 | React Admin Console, Auth, Dark/Light theme | ✅ |
| Sprint 6 | Sales SDR + Finance Ops multi-agent expansion | ✅ |
| Sprint 7 | E2E test suite, security hardening, secret scan | ✅ |
| Sprint 8 | Docker, Render.yaml, production smoke test | ✅ |
| Sprint 9 | Documentation, README, Known Limitations | ✅ |
