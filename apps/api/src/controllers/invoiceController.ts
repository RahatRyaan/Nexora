import { Request, Response, NextFunction } from 'express';
import { Invoice } from '../models/index.js';

export const getInvoices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, match_status } = req.query;
    const filter: any = {};

    if (status) filter.status = status;
    if (match_status) filter.match_status = match_status;

    const invoices = await Invoice.find(filter)
      .populate('account_id', 'name tier health_score')
      .sort({ due_date: 1 });

    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices,
    });
  } catch (err) {
    next(err);
  }
};

export const getInvoiceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('account_id');
    if (!invoice) {
      res.status(404).json({ success: false, error: { message: 'Invoice not found', statusCode: 404 } });
      return;
    }

    res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (err) {
    next(err);
  }
};
