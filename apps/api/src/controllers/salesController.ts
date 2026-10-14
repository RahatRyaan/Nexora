import { Request, Response, NextFunction } from 'express';
import { SalesAgentPod } from '../agents/salesPod.js';
import { Deal } from '../models/index.js';

export const enrichLeadAndGenerateOutreach = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { account_id, company_name, contact_name, contact_email, industry } = req.body;
    if (!company_name || !contact_email) {
      res.status(400).json({
        success: false,
        error: { message: 'company_name and contact_email are required', statusCode: 400 },
      });
      return;
    }

    const result = await SalesAgentPod.enrichAndGenerateOutreach({
      account_id,
      company_name,
      contact_name: contact_name || 'Prospect Contact',
      contact_email,
      industry,
    });

    res.status(201).json({
      success: true,
      message: 'Sales SDR Pod successfully enriched lead and generated outreach sequence',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const getDeals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { stage } = req.query;
    const filter: any = {};
    if (stage) filter.stage = stage;

    const deals = await Deal.find(filter).populate('account_id', 'name tier health_score');
    res.status(200).json({
      success: true,
      count: deals.length,
      data: deals,
    });
  } catch (err) {
    next(err);
  }
};
