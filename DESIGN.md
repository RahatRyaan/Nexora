# Nexora Design System & UX Specification

> **Version**: 1.0 (Enterprise MVP)  
> **Target Audience**: RevOps Leads, VP CX/Support, Finance Ops Directors, IT Platform Admins  
> **Design Philosophy**: High-density enterprise clarity, instant trust indicators, non-blocking asynchronous actions, and dual-mode contrast compliance (WCAG 2.1 AA).

---

## 1. Design Tokens & Color Palette

### 1.1 Color Tokens (Tailwind CSS Mappings)

All colors are defined as semantic CSS variables that adapt automatically to `.dark` and `.light` classes.

```css
:root {
  /* Light Theme */
  --bg-primary: #FFFFFF;
  --bg-secondary: #F8FAFC;       /* Slate-50 */
  --bg-tertiary: #F1F5F9;        /* Slate-100 */
  --bg-elevated: #FFFFFF;
  --border-subtle: #E2E8F0;      /* Slate-200 */
  --border-strong: #CBD5E1;      /* Slate-300 */
  
  --text-primary: #0F172A;       /* Slate-900 */
  --text-secondary: #475569;     /* Slate-600 */
  --text-muted: #94A3B8;         /* Slate-400 */
  
  /* Brand Accent: Nexora Indigo */
  --accent-primary: #4F46E5;     /* Indigo-600 */
  --accent-hover: #4338CA;       /* Indigo-700 */
  --accent-subtle: #EEF2FF;      /* Indigo-50 */
  --accent-text: #3730A3;        /* Indigo-800 */
  
  /* Semantic Status */
  --status-success: #16A34A;     /* Green-600 */
  --status-success-bg: #F0FDF4;  /* Green-50 */
  --status-warning: #D97706;     /* Amber-600 */
  --status-warning-bg: #FFFBEB;  /* Amber-50 */
  --status-danger: #DC2626;      /* Red-600 */
  --status-danger-bg: #FEF2F2;   /* Red-50 */
  --status-info: #0284C7;        /* Sky-600 */
  --status-info-bg: #F0F9FF;     /* Sky-50 */
  
  /* Agent Pod Badges */
  --agent-support: #0284C7;      /* Sky-600 */
  --agent-sales: #7C3AED;        /* Violet-600 */
  --agent-finance: #059669;      /* Emerald-600 */
  --agent-orchestrator: #4F46E5; /* Indigo-600 */
}

.dark {
  /* Dark Theme */
  --bg-primary: #0B0F19;        /* Deep Obsidian */
  --bg-secondary: #111827;      /* Gray-900 */
  --bg-tertiary: #1F2937;       /* Gray-800 */
  --bg-elevated: #1E293B;       /* Slate-800 */
  --border-subtle: #1F2937;     /* Gray-800 */
  --border-strong: #374151;     /* Gray-700 */
  
  --text-primary: #F9FAFB;      /* Gray-50 */
  --text-secondary: #9CA3AF;    /* Gray-400 */
  --text-muted: #6B7280;        /* Gray-500 */
  
  /* Brand Accent */
  --accent-primary: #6366F1;    /* Indigo-500 */
  --accent-hover: #4F46E5;      /* Indigo-600 */
  --accent-subtle: #1E1B4B;     /* Indigo-950 */
  --accent-text: #C7D2FE;       /* Indigo-200 */
  
  /* Semantic Status (Dark) */
  --status-success: #22C55E;    /* Green-500 */
  --status-success-bg: #052E16; /* Green-950 */
  --status-warning: #F59E0B;    /* Amber-500 */
  --status-warning-bg: #451A03; /* Amber-950 */
  --status-danger: #EF4444;     /* Red-500 */
  --status-danger-bg: #450A0A;  /* Red-950 */
  --status-info: #38BDF8;       /* Sky-400 */
  --status-info-bg: #082F49;    /* Sky-950 */
  
  /* Agent Pod Badges (Dark) */
  --agent-support: #38BDF8;
  --agent-sales: #A78BFA;
  --agent-finance: #34D399;
  --agent-orchestrator: #818CF8;
}
```

### 1.2 Typography & Spacing
- **Font Family**: Inter, `-apple-system`, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif.
- **Code & Numbers**: JetBrains Mono, Fira Code, monospace.
- **Base Grid**: 4px baseline (`p-1` = 4px, `p-2` = 8px, `p-4` = 16px, `p-6` = 24px).

---

## 2. Core UI Layout & Navigation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Logo] NEXORA   │ Org: Acme Corp (Odoo Connected 🟢)   │ [Dark/Light] [User]│
├──────────────┬──────────────────────────────────────────────────────────────┤
│ 📊 Dashboard  │  BREADCRUMB: Approvals > Ticket #1042                        │
│ 🛡️ Approvals  ├──────────────────────────────────────────────────────────────┤
│ 🎫 Tickets   │  APPROVAL CARD: Refund Request                               │
│ 💼 Sales SDR  │  ┌────────────────────────────────────────────────────────┐  │
│ 💰 Finance    │  │ Ticket: #1042 - Delayed Shipment Credit ($150)         │  │
│ 📜 Audit Log  │  │ Agent: Support Pod | Confidence: 94% 🟢                 │  │
│ 🔌 Connectors │  │ Reasoning: Customer waited 12 days; ERP order is late. │  │
│ ⚙️ Settings   │  │ Diff: Odoo Invoice #INV-204 -> Issue Credit Memo $150  │  │
│              │  │ [Approve & Write to Odoo]  [Edit Amount]  [Reject]      │  │
│              │  └────────────────────────────────────────────────────────┘  │
└──────────────┴──────────────────────────────────────────────────────────────┘
```

---

## 3. Key Component Specifications

### 3.1 Confidence Meter Badge
- Displays AI certainty for every action.
- Format:
  - **High Confidence ($\ge 85\%$)**: Green badge (`bg-green-50 text-green-700 border-green-200`) with check icon.
  - **Medium Confidence ($70\% - 84\%$)**: Amber badge (`bg-amber-50 text-amber-700 border-amber-200`) with alert triangle.
  - **Low Confidence ($< 70\%$)**: Red badge (`bg-red-50 text-red-700 border-red-200`) with caution icon; triggers `AUTO_ESCALATE`.

### 3.2 Action Approval Card
- **Header**: Agent Pod Type, Target Entity, Timestamp, Risk Level (`LOW` / `MEDIUM` / `HIGH` / `CRITICAL`).
- **Explainability Block**: "Why did the agent decide this?" with bulleted facts from ERP data.
- **ERP Impact Diff**: Visual before/after showing what fields will change in Odoo.
- **Controls**:
  - `Approve`: Executes write-back to ERP with idempotency token and logs to audit trail.
  - `Edit`: Opens modal to adjust refund amount, drafted reply, or discount percentage before execution.
  - `Reject`: Prompts for a rejection note and updates state without writing to ERP.

### 3.3 Audit Log Explorer
- Full-width table featuring:
  - Timestamp (relative and absolute).
  - Actor badge (AI Agent Pod vs Human User).
  - Target Entity with deep-link.
  - Action summary.
  - Expandable JSON Diff Drawer (showing exact payload sent to ERP).
  - **Reversible Action Button** (e.g., "Rollback to state before action").

---

## 4. Frontend Application Architecture (React + Vite)

```
apps/web/src/
├── assets/             # Brand logos, icons
├── components/
│   ├── common/         # Button, Input, Modal, Badge, ThemeToggle, Toast
│   ├── layout/         # Sidebar, Header, PageContainer, Breadcrumbs
│   ├── dashboard/      # StatCard, TrendChart, QuickActions
│   ├── approvals/      # ApprovalCard, ApprovalList, EditActionModal
│   ├── tickets/        # TicketTable, ConversationTimeline, TicketDetail
│   ├── audit/          # AuditTable, DiffViewer, RollbackConfirmModal
│   └── settings/       # ThresholdForm, ErpConfigForm, UserManagement
├── context/
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
├── hooks/
│   ├── useApprovals.ts
│   ├── useTickets.ts
│   ├── useErpStatus.ts
│   └── useAuditLogs.ts
├── services/
│   └── api.ts          # Axios / Fetch client with JWT interceptors
├── types/              # Frontend TypeScript interfaces
└── App.tsx
```

---

## 5. API Contracts (REST Specifications)

### 5.1 Authentication (`/api/v1/auth`)
* `POST /auth/login` -> `{ token, refreshToken, user: { id, name, role, org_id } }`
* `POST /auth/logout` -> `{ success: true }`
* `POST /auth/refresh` -> `{ token }`
* `GET /auth/me` -> `{ user }`

### 5.2 Approvals & Trust (`/api/v1/approvals`)
* `GET /approvals?status=PENDING_APPROVAL` -> `IAgentAction[]`
* `POST /approvals/:id/approve` -> `{ success: true, action: IAgentAction, erp_result: any }`
* `POST /approvals/:id/reject` -> `{ success: true, action: IAgentAction, reason: string }`
* `POST /approvals/:id/edit` -> Payload: `{ updated_parameters }` -> `{ success: true, action: IAgentAction }`
* `POST /approvals/:id/rollback` -> `{ success: true, audit_id: string }`

### 5.3 Support & Tickets (`/api/v1/tickets`)
* `GET /tickets` -> `{ tickets: ITicket[], total: number }`
* `POST /tickets/intake` -> Simulates inbound ticket -> returns categorized ticket with proposed action.
* `GET /tickets/:id` -> `{ ticket, erp_customer_context, timeline }`
* `POST /tickets/:id/reply` -> `{ message: ITicketMessage }`

### 5.4 ERP Management (`/api/v1/erp`)
* `GET /erp/status` -> `{ status: 'connected' | 'error', last_synced_at, provider, entity_counts }`
* `POST /erp/sync` -> Triggers background sync job -> returns job status.
* `POST /erp/test-connection` -> Validates credentials against Odoo / Mock ERP.
