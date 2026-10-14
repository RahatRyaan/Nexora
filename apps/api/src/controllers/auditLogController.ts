import { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../models/index.js';

export const getAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { actor_type, resource_type, action, search } = req.query;
    const filter: any = {};

    if (actor_type) filter.actor_type = actor_type;
    if (resource_type) filter.resource_type = resource_type;
    if (action) filter.action = { $regex: String(action), $options: 'i' };
    if (search) filter.actor_name = { $regex: String(search), $options: 'i' };

    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (err) {
    next(err);
  }
};

export const getAuditLogById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const log = await AuditLog.findById(req.params.id);
    if (!log) {
      res.status(404).json({ success: false, error: { message: 'Audit log record not found', statusCode: 404 } });
      return;
    }

    res.status(200).json({
      success: true,
      data: log,
    });
  } catch (err) {
    next(err);
  }
};
