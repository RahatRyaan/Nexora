import { Request, Response, NextFunction } from 'express';
import { Organization, Account, Ticket, Invoice, Deal } from '../models/index.js';
import { ErpSyncService } from '../services/erp/syncService.js';
import { ErpConnectorFactory } from '../services/erp/connectorFactory.js';

export const getErpStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const org = await Organization.findOne();
    if (!org) {
      res.status(404).json({ success: false, error: { message: 'Organization not found', statusCode: 404 } });
      return;
    }

    const [accountsCount, ticketsCount, invoicesCount, dealsCount] = await Promise.all([
      Account.countDocuments({ organization_id: org._id }),
      Ticket.countDocuments({ organization_id: org._id }),
      Invoice.countDocuments({ organization_id: org._id }),
      Deal.countDocuments({ organization_id: org._id }),
    ]);

    const connector = ErpConnectorFactory.createConnector({
      provider: org.erp_config.provider,
      host: org.erp_config.host,
      db: org.erp_config.db,
    });

    const connTest = await connector.testConnection();

    res.status(200).json({
      success: true,
      data: {
        provider: org.erp_config.provider,
        host: org.erp_config.host,
        status: connTest.success ? 'connected' : 'error',
        last_synced_at: org.erp_config.last_synced_at,
        sync_interval_mins: org.erp_config.sync_interval_mins,
        connection_diagnostics: connTest,
        fabric_entity_counts: {
          accounts: accountsCount,
          tickets: ticketsCount,
          invoices: invoicesCount,
          deals: dealsCount,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const triggerSync = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await ErpSyncService.syncOrganization(req.body.organization_id);
    res.status(200).json({
      success: true,
      message: 'ERP bi-directional synchronization completed',
      data: stats,
    });
  } catch (err) {
    next(err);
  }
};

export const testConnection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const org = await Organization.findOne();
    const config = req.body.host
      ? req.body
      : {
          provider: org?.erp_config.provider,
          host: org?.erp_config.host,
          db: org?.erp_config.db,
          username: req.body.username,
          password: req.body.password,
        };

    const connector = ErpConnectorFactory.createConnector(config);
    const result = await connector.testConnection();

    res.status(result.success ? 200 : 400).json({
      success: result.success,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const updateFieldMappings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const org = await Organization.findOne();
    if (!org) {
      res.status(404).json({ success: false, error: { message: 'Organization not found', statusCode: 404 } });
      return;
    }

    org.erp_config.field_mappings = new Map(Object.entries(req.body.field_mappings || {}));
    await org.save();

    res.status(200).json({
      success: true,
      message: 'ERP field mappings updated successfully',
      data: Object.fromEntries(org.erp_config.field_mappings),
    });
  } catch (err) {
    next(err);
  }
};

export const testWriteBackDryRun = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { action_type, record_id, amount, reason, stage_name, resolution_summary } = req.body;
    const org = await Organization.findOne();
    const connector = ErpConnectorFactory.createConnector({
      provider: org?.erp_config.provider || 'mock' as any,
      host: org?.erp_config.host || 'http://localhost:5050',
    });

    let result;
    if (action_type === 'ISSUE_REFUND') {
      result = await connector.issueRefundCredit(record_id, Number(amount), String(reason), true);
    } else if (action_type === 'UPDATE_TICKET') {
      result = await connector.updateTicketStatus(record_id, String(stage_name), String(resolution_summary), true);
    } else {
      res.status(400).json({ success: false, error: { message: 'Unsupported action_type for dry run', statusCode: 400 } });
      return;
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};
