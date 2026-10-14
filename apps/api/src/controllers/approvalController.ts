import { Request, Response, NextFunction } from 'express';
import { AgentAction } from '../models/index.js';
import { ExecutionService } from '../services/trust/executionService.js';
import { ActionStatus } from '@nexora/core';

export const getApprovals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, agent_type, risk_level } = req.query;
    const filter: any = {};

    if (status) {
      filter.status = status;
    } else {
      // Default to pending approvals if no status filter provided
      filter.status = ActionStatus.PENDING_APPROVAL;
    }

    if (agent_type) filter.agent_type = agent_type;
    if (risk_level) filter.risk_level = risk_level;

    const actions = await AgentAction.find(filter)
      .populate('target_entity_id')
      .populate('approved_by', 'name email role')
      .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      count: actions.length,
      data: actions,
    });
  } catch (err) {
    next(err);
  }
};

export const getApprovalById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const action = await AgentAction.findById(req.params.id)
      .populate('target_entity_id')
      .populate('approved_by', 'name email role');

    if (!action) {
      res.status(404).json({ success: false, error: { message: 'Approval action not found', statusCode: 404 } });
      return;
    }

    res.status(200).json({
      success: true,
      data: action,
    });
  } catch (err) {
    next(err);
  }
};

export const approveAction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { user_id, user_name } = req.body;
    const actionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await ExecutionService.executeApprovedAction(
      actionId,
      user_id,
      user_name || 'Platform Administrator'
    );

    res.status(200).json({
      success: true,
      message: result.was_cached ? 'Action execution retrieved from idempotency cache' : 'Action successfully executed and written to ERP',
      data: {
        action: result.action,
        erp_result: result.erp_result,
        was_cached: result.was_cached,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const rejectAction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { reason, user_id, user_name } = req.body;
    if (!reason) {
      res.status(400).json({
        success: false,
        error: { message: 'Rejection reason is mandatory when rejecting a proposed action', statusCode: 400 },
      });
      return;
    }

    const actionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await ExecutionService.rejectAction(
      actionId,
      reason,
      user_id,
      user_name || 'Platform Administrator'
    );

    res.status(200).json({
      success: true,
      message: 'Action proposal rejected successfully',
      data: result.action,
    });
  } catch (err) {
    next(err);
  }
};

export const editAction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { output_payload, reasoning } = req.body;
    const actionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const action = await AgentAction.findById(actionId);

    if (!action) {
      res.status(404).json({ success: false, error: { message: 'Approval action not found', statusCode: 404 } });
      return;
    }

    if (action.status !== ActionStatus.PENDING_APPROVAL) {
      res.status(400).json({
        success: false,
        error: { message: `Cannot edit action with status '${action.status}'`, statusCode: 400 },
      });
      return;
    }

    if (output_payload) {
      action.output_payload = { ...action.output_payload, ...output_payload };
    }
    if (reasoning) {
      action.reasoning = `${action.reasoning} [Manual override note: ${reasoning}]`;
    }

    await action.save();

    res.status(200).json({
      success: true,
      message: 'Action proposal modified successfully prior to approval',
      data: action,
    });
  } catch (err) {
    next(err);
  }
};

export const rollbackAction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { user_id, user_name } = req.body;
    const actionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await ExecutionService.rollbackAction(
      actionId,
      user_id,
      user_name || 'Platform Administrator'
    );

    res.status(200).json({
      success: true,
      message: 'Action rolled back and compensation record created',
      data: {
        action: result.action,
        rollback_result: result.rollback_result,
      },
    });
  } catch (err) {
    next(err);
  }
};
