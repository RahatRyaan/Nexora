const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('nexora_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const api = {
  // Stats
  getOverviewStats: async () => {
    const res = await fetch('/api/v1/stats/overview', { headers: getAuthHeaders() });
    return res.json();
  },

  // Approvals
  getApprovals: async (status?: string) => {
    const query = status ? `?status=${status}` : '';
    const res = await fetch(`/api/v1/approvals${query}`, { headers: getAuthHeaders() });
    return res.json();
  },

  approveAction: async (id: string, userName?: string) => {
    const res = await fetch(`/api/v1/approvals/${id}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ user_name: userName }),
    });
    return res.json();
  },

  rejectAction: async (id: string, reason: string, userName?: string) => {
    const res = await fetch(`/api/v1/approvals/${id}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason, user_name: userName }),
    });
    return res.json();
  },

  editAction: async (id: string, outputPayload: any, reasoning?: string) => {
    const res = await fetch(`/api/v1/approvals/${id}/edit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ output_payload: outputPayload, reasoning }),
    });
    return res.json();
  },

  rollbackAction: async (id: string, userName?: string) => {
    const res = await fetch(`/api/v1/approvals/${id}/rollback`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ user_name: userName }),
    });
    return res.json();
  },

  // Tickets
  getTickets: async (status?: string) => {
    const query = status ? `?status=${status}` : '';
    const res = await fetch(`/api/v1/tickets${query}`, { headers: getAuthHeaders() });
    return res.json();
  },

  getTicketById: async (id: string) => {
    const res = await fetch(`/api/v1/tickets/${id}`, { headers: getAuthHeaders() });
    return res.json();
  },

  intakeTicket: async (payload: {
    account_id?: string;
    email?: string;
    customer_name?: string;
    channel?: string;
    subject: string;
    message: string;
  }) => {
    const res = await fetch('/api/v1/tickets/intake', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  replyTicket: async (id: string, content: string, senderName?: string) => {
    const res = await fetch(`/api/v1/tickets/${id}/reply`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ content, sender_name: senderName, sender_type: 'AGENT' }),
    });
    return res.json();
  },

  // Accounts & Shared Data Fabric
  getAccounts: async () => {
    const res = await fetch('/api/v1/accounts', { headers: getAuthHeaders() });
    return res.json();
  },

  getAccountById: async (id: string) => {
    const res = await fetch(`/api/v1/accounts/${id}`, { headers: getAuthHeaders() });
    return res.json();
  },

  // Invoices
  getInvoices: async () => {
    const res = await fetch('/api/v1/invoices', { headers: getAuthHeaders() });
    return res.json();
  },

  // Audit Logs
  getAuditLogs: async (search?: string) => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await fetch(`/api/v1/audit-logs${query}`, { headers: getAuthHeaders() });
    return res.json();
  },

  // ERP Management
  getErpStatus: async () => {
    const res = await fetch('/api/v1/erp/status', { headers: getAuthHeaders() });
    return res.json();
  },

  triggerSync: async () => {
    const res = await fetch('/api/v1/erp/sync', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({}),
    });
    return res.json();
  },
};
