import { Request, Response, NextFunction } from 'express';
import { FinanceAgentPod } from '../agents/financePod.js';

export const matchThreeWayInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { invoice_id, po_number, po_amount, receipt_amount, invoice_amount, tax_rate_contracted, tax_rate_invoiced } = req.body;
    if (!invoice_id || po_amount === undefined || invoice_amount === undefined) {
      res.status(400).json({
        success: false,
        error: { message: 'invoice_id, po_amount, and invoice_amount are required', statusCode: 400 },
      });
      return;
    }

    const result = await FinanceAgentPod.evaluateThreeWayMatch({
      invoice_id,
      po_number: po_number || 'PO-GEN-1001',
      po_amount: Number(po_amount),
      receipt_amount: Number(receipt_amount || po_amount),
      invoice_amount: Number(invoice_amount),
      tax_rate_contracted: tax_rate_contracted ? Number(tax_rate_contracted) : undefined,
      tax_rate_invoiced: tax_rate_invoiced ? Number(tax_rate_invoiced) : undefined,
    });

    res.status(200).json({
      success: true,
      message: 'Finance Pod evaluated 3-way match and queued draft for human approval',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const getFinancialAnomalies = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await FinanceAgentPod.detectAnomalies();
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const attemptAutonomousPayment = (_req: Request, res: Response): void => {
  try {
    FinanceAgentPod.validateAutonomousPaymentAllowed();
  } catch (err: any) {
    res.status(403).json({
      success: false,
      error: {
        code: 'AUTONOMOUS_PAYMENT_PROHIBITED',
        message: err.message,
        statusCode: 403,
      },
    });
  }
};
