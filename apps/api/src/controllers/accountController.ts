import { Request, Response, NextFunction } from 'express';
import { Account, Deal, Ticket, Invoice } from '../models/index.js';

export const getAccounts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tier, minHealth, search } = req.query;
    const filter: any = {};

    if (tier) filter.tier = tier;
    if (minHealth) filter.health_score = { $gte: Number(minHealth) };
    if (search) filter.name = { $regex: String(search), $options: 'i' };

    const accounts = await Account.find(filter).sort({ health_score: 1 });
    res.status(200).json({
      success: true,
      count: accounts.length,
      data: accounts,
    });
  } catch (err) {
    next(err);
  }
};

export const getAccountById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account) {
      res.status(404).json({ success: false, error: { message: 'Account not found', statusCode: 404 } });
      return;
    }

    // Shared Data Fabric 360 view
    const [deals, tickets, invoices] = await Promise.all([
      Deal.find({ account_id: account._id }),
      Ticket.find({ account_id: account._id }),
      Invoice.find({ account_id: account._id }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        account,
        shared_fabric_360: {
          deals,
          tickets,
          invoices,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const createAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const account = await Account.create(req.body);
    res.status(201).json({
      success: true,
      data: account,
    });
  } catch (err) {
    next(err);
  }
};
