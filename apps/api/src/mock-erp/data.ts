export interface MockErpPartner {
  id: number;
  name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  country_id: [number, string];
  credit_limit: number;
  total_due: number;
  customer_rank: number;
}

export interface MockErpInvoice {
  id: number;
  name: string; // e.g. "INV/2026/0042"
  partner_id: [number, string];
  amount_total: number;
  amount_residual: number;
  state: 'draft' | 'posted' | 'cancel';
  payment_state: 'not_paid' | 'in_payment' | 'paid' | 'partial';
  invoice_date: string;
  invoice_date_due: string;
  ref: string; // PO Number
}

export interface MockErpTicket {
  id: number;
  ticket_ref: string; // e.g. "HD-9801"
  name: string;
  partner_id: [number, string];
  partner_email: string;
  stage_id: [number, string];
  priority: '0' | '1' | '2' | '3';
  description: string;
  create_date: string;
}

export interface MockErpSaleOrder {
  id: number;
  name: string; // e.g. "SO0142"
  partner_id: [number, string];
  amount_total: number;
  state: 'draft' | 'sent' | 'sale' | 'done' | 'cancel';
  date_order: string;
}

export const initialMockPartners: MockErpPartner[] = [
  {
    id: 101,
    name: 'Apex Global Logistics Inc.',
    email: 'sarah.connor@apexlogistics.com',
    phone: '+1-555-019-2831',
    street: '100 Harbor Boulevard',
    city: 'Seattle',
    country_id: [1, 'United States'],
    credit_limit: 50000,
    total_due: 4200,
    customer_rank: 1,
  },
  {
    id: 102,
    name: 'NovaTech Medical Systems',
    email: 'marcus.vance@novatech-med.io',
    phone: '+1-555-044-8891',
    street: '450 Innovation Parkway',
    city: 'Austin',
    country_id: [1, 'United States'],
    credit_limit: 120000,
    total_due: 0,
    customer_rank: 2,
  },
  {
    id: 103,
    name: 'OmniCloud Technologies',
    email: 'd.chen@omnicloud.net',
    phone: '+1-555-081-3320',
    street: '88 Tech Center Drive',
    city: 'San Jose',
    country_id: [1, 'United States'],
    credit_limit: 75000,
    total_due: 14500,
    customer_rank: 1,
  },
  {
    id: 104,
    name: 'Starlight Retailers Group',
    email: 'elena.rostova@starlight-retail.com',
    phone: '+1-555-099-1122',
    street: '1200 Market Street',
    city: 'Chicago',
    country_id: [1, 'United States'],
    credit_limit: 30000,
    total_due: 890,
    customer_rank: 1,
  },
];

export const initialMockInvoices: MockErpInvoice[] = [
  {
    id: 201,
    name: 'INV/2026/00101',
    partner_id: [101, 'Apex Global Logistics Inc.'],
    amount_total: 4200.0,
    amount_residual: 4200.0,
    state: 'posted',
    payment_state: 'not_paid',
    invoice_date: '2026-08-15',
    invoice_date_due: '2026-09-15',
    ref: 'PO-APEX-9982',
  },
  {
    id: 202,
    name: 'INV/2026/00102',
    partner_id: [102, 'NovaTech Medical Systems'],
    amount_total: 18500.0,
    amount_residual: 0.0,
    state: 'posted',
    payment_state: 'paid',
    invoice_date: '2026-09-01',
    invoice_date_due: '2026-10-01',
    ref: 'PO-NOVA-1029',
  },
  {
    id: 203,
    name: 'INV/2026/00103',
    partner_id: [103, 'OmniCloud Technologies'],
    amount_total: 14500.0,
    amount_residual: 14500.0,
    state: 'posted',
    payment_state: 'not_paid',
    invoice_date: '2026-07-20',
    invoice_date_due: '2026-08-20', // Overdue
    ref: 'PO-OMNI-7711',
  },
  {
    id: 204,
    name: 'INV/2026/00104',
    partner_id: [104, 'Starlight Retailers Group'],
    amount_total: 890.0,
    amount_residual: 890.0,
    state: 'posted',
    payment_state: 'not_paid',
    invoice_date: '2026-09-10',
    invoice_date_due: '2026-10-10',
    ref: 'PO-STAR-3301',
  },
];

export const initialMockTickets: MockErpTicket[] = [
  {
    id: 301,
    ticket_ref: 'HD-9801',
    name: 'Delayed shipment for Order #SO0142 - Requesting compensation',
    partner_id: [101, 'Apex Global Logistics Inc.'],
    partner_email: 'sarah.connor@apexlogistics.com',
    stage_id: [1, 'New'],
    priority: '2',
    description: 'We ordered 50 router units 12 days ago and have not received tracking confirmation. We request an immediate $150 shipping fee refund or expedited air shipment.',
    create_date: '2026-09-22 14:20:00',
  },
  {
    id: 302,
    ticket_ref: 'HD-9802',
    name: 'Upgrade Enterprise Plan to add 25 seats',
    partner_id: [102, 'NovaTech Medical Systems'],
    partner_email: 'marcus.vance@novatech-med.io',
    stage_id: [2, 'In Progress'],
    priority: '1',
    description: 'Please help us add 25 seats to our current tier. We need this provisioned before Monday for our clinical trials team.',
    create_date: '2026-09-23 09:15:00',
  },
  {
    id: 303,
    ticket_ref: 'HD-9803',
    name: 'Dispute regarding Invoice INV/2026/00103 tax calculation',
    partner_id: [103, 'OmniCloud Technologies'],
    partner_email: 'd.chen@omnicloud.net',
    stage_id: [1, 'New'],
    priority: '3',
    description: 'The tax line on invoice INV/2026/00103 shows 12% instead of the contracted 8.5% state rate. Please issue a corrected invoice or credit note.',
    create_date: '2026-09-23 11:45:00',
  },
];

export const initialMockOrders: MockErpSaleOrder[] = [
  {
    id: 401,
    name: 'SO0142',
    partner_id: [101, 'Apex Global Logistics Inc.'],
    amount_total: 12500.0,
    state: 'sale',
    date_order: '2026-09-10',
  },
  {
    id: 402,
    name: 'SO0143',
    partner_id: [102, 'NovaTech Medical Systems'],
    amount_total: 45000.0,
    state: 'sale',
    date_order: '2026-09-18',
  },
];
