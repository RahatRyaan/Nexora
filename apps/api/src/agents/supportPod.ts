import { Account, Contact, Deal, Invoice, Ticket, Organization, AgentAction, AuditLog } from '../models/index.js';
import { llmClient } from '../services/ai/llmClient.js';
import { SupportContextPayload, SupportTriageResult } from '../services/ai/types.js';
import {
  AgentType,
  ActionRiskLevel,
  ActionStatus,
  TicketStatus,
  TicketChannel,
  DEFAULT_THRESHOLDS,
} from '@nexora/core';

export interface TicketIntakeInput {
  account_id?: string;
  email?: string;
  customer_name?: string;
  channel?: TicketChannel;
  subject: string;
  message: string;
}

export class SupportAgentPod {
  public static async processTicketIntake(input: TicketIntakeInput): Promise<{
    ticket: any;
    triage: SupportTriageResult;
    action_queued?: any;
  }> {
    const org = await Organization.findOne();
    if (!org) {
      throw new Error('No Organization registered for Support Pod');
    }

    // 1. Resolve Account & Contact from Shared Data Fabric
    let account = input.account_id ? await Account.findById(input.account_id) : null;
    let contact = null;

    if (!account && input.email) {
      contact = await Contact.findOne({ email: input.email.toLowerCase() });
      if (contact) {
        account = await Account.findById(contact.account_id);
      }
    }

    if (!account) {
      // Fallback: match or create first default account
      account = await Account.findOne({ organization_id: org._id });
    }

    if (!account) {
      throw new Error('Unable to resolve Account for ticket intake');
    }

    // 2. Aggregate Shared Data Fabric 360 Context
    const [deals, invoices, ticketHistory] = await Promise.all([
      Deal.find({ account_id: account._id }),
      Invoice.find({ account_id: account._id }).sort({ due_date: -1 }).limit(5),
      Ticket.find({ account_id: account._id }).sort({ created_at: -1 }).limit(5),
    ]);

    const contextPayload: SupportContextPayload = {
      account: {
        id: account._id.toString(),
        erp_id: account.erp_id,
        name: account.name,
        tier: account.tier,
        health_score: account.health_score,
        annual_revenue: account.annual_revenue,
      },
      contact: contact
        ? {
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            job_title: contact.job_title,
          }
        : {
            name: input.customer_name || 'Customer Contact',
            email: input.email || 'customer@example.com',
          },
      open_deals: deals.map((d) => ({ name: d.name, value: d.value, stage: d.stage })),
      recent_invoices: invoices.map((i) => ({
        invoice_number: i.invoice_number,
        amount: i.amount,
        status: i.status,
        due_date: i.due_date.toISOString().split('T')[0],
      })),
      ticket_history: ticketHistory.map((t) => ({
        ticket_number: t.ticket_number,
        subject: t.subject,
        status: t.status,
      })),
      customer_message: input.message,
      channel: input.channel || TicketChannel.CHAT,
    };

    // 3. Run AI Classification & Reasoning
    const triageResult = await llmClient.triageSupportTicket(contextPayload);

    // 4. Evaluate Policy Governance Thresholds
    const confidenceThreshold = org.approval_policies?.support_confidence_threshold || DEFAULT_THRESHOLDS.SUPPORT_CONFIDENCE_THRESHOLD;
    const maxRefundDollars = org.approval_policies?.support_refund_limit_dollars || DEFAULT_THRESHOLDS.SUPPORT_MAX_AUTO_REFUND_DOLLARS;

    const isConfidenceLow = triageResult.confidence_score < confidenceThreshold;
    const isRefundExceedingLimit =
      triageResult.proposed_action?.dollar_amount !== undefined &&
      triageResult.proposed_action.dollar_amount > maxRefundDollars;

    const requiresHumanApproval = isConfidenceLow || isRefundExceedingLimit || !!triageResult.proposed_action?.requires_approval;

    const ticketStatus = isConfidenceLow
      ? TicketStatus.ESCALATED
      : requiresHumanApproval
      ? TicketStatus.PENDING_APPROVAL
      : TicketStatus.IN_PROGRESS;

    // 5. Create Ticket Document
    const ticketCount = await Ticket.countDocuments({ organization_id: org._id });
    const ticketNumber = `TCK-2026-${1000 + ticketCount + 1}`;

    const ticket = await Ticket.create({
      organization_id: org._id,
      account_id: account._id,
      contact_id: contact?._id,
      ticket_number: ticketNumber,
      channel: input.channel || TicketChannel.CHAT,
      subject: input.subject,
      category: triageResult.category,
      severity: triageResult.severity,
      status: ticketStatus,
      confidence_score: triageResult.confidence_score,
      ai_draft_response: triageResult.draft_response,
      resolution_summary: triageResult.resolution_summary,
      proposed_action: triageResult.proposed_action
        ? {
            action_type: triageResult.proposed_action.action_type,
            parameters: triageResult.proposed_action.parameters,
            dollar_amount: triageResult.proposed_action.dollar_amount,
            requires_approval: requiresHumanApproval,
          }
        : undefined,
      messages: [
        {
          sender_type: 'CUSTOMER',
          sender_name: input.customer_name || contact?.name || 'Customer',
          content: input.message,
          timestamp: new Date(),
        },
        {
          sender_type: 'AI_BOT',
          sender_name: 'Nexora Support Agent Pod',
          content: triageResult.draft_response,
          timestamp: new Date(),
        },
      ],
    });

    // 6. Queue AgentAction in Approval Queue if Human Sign-off Required
    let queuedAction = null;
    if (requiresHumanApproval && triageResult.proposed_action && triageResult.proposed_action.action_type !== 'NONE') {
      const traceId = `TRC-${Date.now()}-${ticketNumber}`;
      queuedAction = await AgentAction.create({
        organization_id: org._id,
        trace_id: traceId,
        agent_type: AgentType.SUPPORT_POD,
        action_type: triageResult.proposed_action.action_type,
        target_entity_type: 'Ticket',
        target_entity_id: ticket._id,
        input_context: {
          ticket_id: ticket._id.toString(),
          account_id: account._id.toString(),
          customer_message: input.message,
          confidence_score: triageResult.confidence_score,
        },
        output_payload: triageResult.proposed_action.parameters,
        reasoning: triageResult.reasoning,
        confidence: triageResult.confidence_score,
        risk_level: isRefundExceedingLimit ? ActionRiskLevel.HIGH : ActionRiskLevel.MEDIUM,
        status: ActionStatus.PENDING_APPROVAL,
        reversible: true,
        rollback_payload: {
          action: 'CANCEL_CREDIT_MEMO',
          ticket_id: ticket._id.toString(),
          account_id: account._id.toString(),
        },
      });

      // Write immutable audit log
      await AuditLog.create({
        organization_id: org._id,
        trace_id: traceId,
        action_id: queuedAction._id,
        actor_type: 'AI_AGENT',
        actor_id: 'AGENT_SUPPORT_POD',
        actor_name: 'Support Agent Pod',
        action: 'QUEUED_ACTION_APPROVAL',
        resource_type: 'Ticket',
        resource_id: ticket._id.toString(),
        state_before: { status: 'NEW' },
        state_after: { status: ticketStatus, confidence: triageResult.confidence_score },
      });
    }

    return {
      ticket,
      triage: triageResult,
      action_queued: queuedAction,
    };
  }
}
