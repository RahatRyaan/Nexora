import { Request, Response } from 'express';
import { mockErpInstance } from '../mock-erp/server.js';

export const getMockPartners = (req: Request, res: Response): void => {
  const partners = mockErpInstance.getPartners();
  res.status(200).json({ success: true, count: partners.length, data: partners });
};

export const getMockInvoices = (req: Request, res: Response): void => {
  const partnerId = req.query.partner_id ? Number(req.query.partner_id) : undefined;
  const invoices = mockErpInstance.getInvoices(partnerId);
  res.status(200).json({ success: true, count: invoices.length, data: invoices });
};

export const getMockTickets = (req: Request, res: Response): void => {
  const partnerId = req.query.partner_id ? Number(req.query.partner_id) : undefined;
  const tickets = mockErpInstance.getTickets(partnerId);
  res.status(200).json({ success: true, count: tickets.length, data: tickets });
};

export const getMockOrders = (req: Request, res: Response): void => {
  const partnerId = req.query.partner_id ? Number(req.query.partner_id) : undefined;
  const orders = mockErpInstance.getOrders(partnerId);
  res.status(200).json({ success: true, count: orders.length, data: orders });
};

export const getMockWriteLog = (_req: Request, res: Response): void => {
  const log = mockErpInstance.getWriteLog();
  res.status(200).json({ success: true, count: log.length, data: log });
};

export const resetMockErp = (_req: Request, res: Response): void => {
  mockErpInstance.reset();
  res.status(200).json({ success: true, message: 'Mock ERP state reset to initial values' });
};
