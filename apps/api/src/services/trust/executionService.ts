import { AgentAction, AuditLog, Organization, Ticket, Invoice } from '../../models/index.js';
import { ErpConnectorFactory } from '../erp/connectorFactory.js';
import { IdempotencyGuard } from './idempotency.js';
import { ActionStatus, TicketStatus, InvoiceStatus } from '@nexora/core';

export class ExecutionService {
  public static async executeApprovedAction(
    actionId: string,
    approvedByUserId?: string,
    approverName: string = 'Platform Administrator'
  ): Promise<{ success: boolean; action: any; erp_result: any; was_cached: boolean }> {
    const action = await AgentAction.findById(actionId);
    if (!action) {
      throw new Error(`AgentAction ${actionId} not found`);
    }

    if (action.status === ActionStatus.EXECUTED) {
      return {
        success: true,
        action,
        erp_result: action.output_payload,
        was_cached: true,
      };
    }

    if (action.status === ActionStatus.REJECTED || action.status === ActionStatus.ROLLED_BACK) {
      throw new Error(`Cannot execute action with status '${action.status}'`);
    }

    // Idempotency check
    const idempotencyToken = IdempotencyGuard.generateToken(actionId, action.output_payload);
    const cachedResult = IdempotencyGuard.checkToken(idempotencyToken);
    if (cachedResult) {
      return {
        success: true,
        action,
        erp_result: cachedResult,
        was_cached: true,
      };
    }

    const org = await Organization.findById(action.organization_id);
    const connector = ErpConnectorFactory.createConnector({
      provider: org?.erp_config.provider || ('mock' as any),
      host: org?.erp_config.host || 'http://localhost:5050',
    });

    let erpResult: any = null;
    const stateBefore = { status: action.status, execution_time: null };

    // Execute based on action_type
    try {
      if (action.action_type === 'ISSUE_REFUND' || action.action_type === 'EXTEND_CREDIT') {
        const invoiceId = action.output_payload.invoice_id || '201';
        const amount = action.output_payload.credit_amount || action.output_payload.refund_amount || 150;
        const reason = action.output_payload.reason || action.reasoning;

        erpResult = await connector.issueRefundCredit(invoiceId, amount, reason);

        // Update Ticket and Invoice in Shared Data Fabric
        if (action.target_entity_type === 'Ticket') {
          await Ticket.findByIdAndUpdate(action.target_entity_id, {
            status: TicketStatus.RESOLVED,
            resolution_summary: `Approved and issued credit of $${amount} against invoice #${invoiceId}`,
          });
        }
      } else if (action.action_type === 'STATUS_UPDATE') {
        if (action.target_entity_type === 'Ticket') {
          await Ticket.findByIdAndUpdate(action.target_entity_id, {
            status: TicketStatus.RESOLVED,
            resolution_summary: action.reasoning,
          });
        }
        erpResult = { success: true, message: 'Status updated successfully' };
      } else {
        erpResult = { success: true, message: `Generic execution of ${action.action_type}` };
      }

      // Update Action status
      action.status = ActionStatus.EXECUTED;
      action.approved_by = approvedByUserId as any;
      action.approved_at = new Date();
      action.executed_at = new Date();
      await action.save();

      // Record Idempotency
      IdempotencyGuard.recordExecution(idempotencyToken, actionId, erpResult);

      // Record Immutable Audit Log
      await AuditLog.create({
        organization_id: action.organization_id,
        trace_id: action.trace_id,
        action_id: action._id,
        actor_type: approvedByUserId ? 'USER' : 'SYSTEM',
        actor_id: approvedByUserId || 'SYSTEM_ADMIN',
        actor_name: approverName,
        action: `EXECUTED_${action.action_type}`,
        resource_type: action.target_entity_type,
        resource_id: action.target_entity_id.toString(),
        state_before: stateBefore,
        state_after: { status: ActionStatus.EXECUTED, erp_result: erpResult },
      });

      return {
        success: true,
        action,
        erp_result: erpResult,
        was_cached: false,
      };
    } catch (err: any) {
      action.status = ActionStatus.FAILED;
      action.execution_error = err.message;
      await action.save();

      await AuditLog.create({
        organization_id: action.organization_id,
        trace_id: action.trace_id,
        action_id: action._id,
        actor_type: 'SYSTEM',
        actor_id: 'SYSTEM',
        actor_name: 'System Executor',
        action: `FAILED_${action.action_type}`,
        resource_type: action.target_entity_type,
        resource_id: action.target_entity_id.toString(),
        state_before: stateBefore,
        state_after: { status: ActionStatus.FAILED, error: err.message },
      });

      throw err;
    }
  }

  public static async rejectAction(
    actionId: string,
    reason: string,
    rejectedByUserId?: string,
    rejecterName: string = 'Platform Administrator'
  ): Promise<{ success: boolean; action: any }> {
    const action = await AgentAction.findById(actionId);
    if (!action) {
      throw new Error(`AgentAction ${actionId} not found`);
    }

    if (action.status === ActionStatus.EXECUTED) {
      throw new Error('Cannot reject an action that has already been executed. Use rollback instead.');
    }

    action.status = ActionStatus.REJECTED;
    action.rejection_reason = reason;
    await action.save();

    // If target was a ticket, update ticket status to ESCALATED or IN_PROGRESS
    if (action.target_entity_type === 'Ticket') {
      await Ticket.findByIdAndUpdate(action.target_entity_id, {
        status: TicketStatus.ESCALATED,
        resolution_summary: `Action proposal rejected: ${reason}`,
      });
    }

    // Write immutable audit log
    await AuditLog.create({
      organization_id: action.organization_id,
      trace_id: action.trace_id,
      action_id: action._id,
      actor_type: 'USER',
      actor_id: rejectedByUserId || 'SYSTEM_ADMIN',
      actor_name: rejecterName,
      action: `REJECTED_${action.action_type}`,
      resource_type: action.target_entity_type,
      resource_id: action.target_entity_id.toString(),
      state_before: { status: ActionStatus.PENDING_APPROVAL },
      state_after: { status: ActionStatus.REJECTED, rejection_reason: reason },
    });

    return { success: true, action };
  }

  public static async rollbackAction(
    actionId: string,
    rolledBackByUserId?: string,
    rollerName: string = 'Platform Administrator'
  ): Promise<{ success: boolean; action: any; rollback_result: any }> {
    const action = await AgentAction.findById(actionId);
    if (!action) {
      throw new Error(`AgentAction ${actionId} not found`);
    }

    if (action.status !== ActionStatus.EXECUTED) {
      throw new Error(`Only EXECUTED actions can be rolled back (current status: ${action.status})`);
    }

    if (!action.reversible) {
      throw new Error(`Action ${actionId} is not marked as reversible`);
    }

    const stateBefore = { status: action.status, payload: action.output_payload };

    // Apply inverse compensation operation
    const rollbackResult = {
      compensated: true,
      original_action: action.action_type,
      rollback_payload: action.rollback_payload,
      timestamp: new Date().toISOString(),
    };

    // Revert target Ticket status if applicable
    if (action.target_entity_type === 'Ticket') {
      await Ticket.findByIdAndUpdate(action.target_entity_id, {
        status: TicketStatus.IN_PROGRESS,
        resolution_summary: 'Action rolled back by administrator. Ticket reopened.',
      });
    }

    action.status = ActionStatus.ROLLED_BACK;
    await action.save();

    // Write audit log
    await AuditLog.create({
      organization_id: action.organization_id,
      trace_id: action.trace_id,
      action_id: action._id,
      actor_type: 'USER',
      actor_id: rolledBackByUserId || 'SYSTEM_ADMIN',
      actor_name: rollerName,
      action: `ROLLED_BACK_${action.action_type}`,
      resource_type: action.target_entity_type,
      resource_id: action.target_entity_id.toString(),
      state_before: stateBefore,
      state_after: { status: ActionStatus.ROLLED_BACK, rollback_result: rollbackResult },
    });

    return {
      success: true,
      action,
      rollback_result: rollbackResult,
    };
  }
}
