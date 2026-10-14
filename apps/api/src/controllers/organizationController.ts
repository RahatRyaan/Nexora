import { Request, Response, NextFunction } from 'express';
import { Organization } from '../models/index.js';

export const getOrganizations = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orgs = await Organization.find();
    res.status(200).json({
      success: true,
      data: orgs,
    });
  } catch (err) {
    next(err);
  }
};

export const getOrganizationBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const org = await Organization.findOne({ slug: req.params.slug });
    if (!org) {
      res.status(404).json({ success: false, error: { message: 'Organization not found', statusCode: 404 } });
      return;
    }

    res.status(200).json({
      success: true,
      data: org,
    });
  } catch (err) {
    next(err);
  }
};
