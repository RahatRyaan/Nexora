import { Invoice, Transaction, Organization, AgentAction, AuditLog } from '../models/index.js';
import { AgentType, ActionRiskLevel, ActionStatus, InvoiceMatchStatus, InvoiceStatus } from '@nexora/core';

export interface ThreeWayMatchInput {
  invoice_id: string;
  po_number: string;
  po_amount: number;
  receipt_amount: number;
  invoice_amount: number;
  tax_rate_contracted?: number;
  tax_rate_invoiced?: number;
}

export interface MatchEvaluationResult {
  match_status: InvoiceMatchStatus;
  variance_percentage: number;
  discrepancies: string[];
  confidence_score: number;
  requires_human_approval: boolean;
  reasoning: string;
}

export class FinanceAgentPod {
  // Hard Invariant Safeguard
  public static validateAutonomousPaymentAllowed(): never {
    throw new Error(
      '🚨 [HARD INVARIANT BREACH]: Finance/Ops Pod is permanently prohibited from autonomously executing payments or General Ledger postings under any confidence threshold. All financial disbursements require explicit Human-in-the-Loop authorization.'
    );
  }

  public static async evaluateThreeWayMatch(input: ThreeWayMatchInput): Promise<{
    invoice: any;
    evaluation: MatchEvaluationResult;
    action_queued?: any;
  }> {
    const org = await Organization.findOne();
    if (!org) throw new Error('Organization not found');

    const invoice = await Invoice.findById(input.invoice_id);
    if (!invoice) throw new Error(`Invoice ${input.invoice_id} not found`);

    const discrepancies: string[] = [];
    let variancePct = 0;

    // 1. PO vs Invoice Amount Check
    if (Math.abs(input.invoice_amount - input.po_amount) > 0.01) {
      const diff = input.invoice_amount - input.po_amount;
      variancePct = parseFloat(((diff / input.po_amount) * 100).toFixed(2));
      discrepancies.push(`Invoice amount ($${input.invoice_amount}) differs from Purchase Order ($${input.po_amount}) by ${variancePct}%`);
    }

    // 2. Receipt vs Invoice Amount Check
    if (Math.abs(input.invoice_amount - input.receipt_amount) > 0.01) {
      discrepancies.push(`Invoice amount ($${input.invoice_amount}) exceeds Goods Receipt value ($${input.receipt_amount})`);
    }

    // 3. Tax Variance Check
    if (
      input.tax_rate_contracted !== undefined &&
      input.tax_rate_invoiced !== undefined &&
      input.tax_rate_invoiced > input.tax_rate_contracted
    ) {
      discrepancies.push(`Invoiced tax rate (${input.tax_rate_invoiced}%) exceeds contracted tax rate (${input.tax_rate_contracted}%)`);
    }

    const hasDiscrepancy = discrepancies.length > 0;
    const matchStatus = hasDiscrepancy ? InvoiceMatchStatus.MISMATCH_PO : InvoiceMatchStatus.THREE_WAY_MATCHED;
    const confidenceScore = hasDiscrepancy ? 0.75 : 0.98;

    const evaluation: MatchEvaluationResult = {
      match_status: matchStatus,
      variance_percentage: variancePct,
      discrepancies,
      confidence_score: confidenceScore,
      requires_human_approval: true, // Always true for financial actions
      reasoning: hasDiscrepancy
        ? `3-Way match flagged ${discrepancies.length} discrepancy: ${discrepancies.join('; ')}. Held for human sign-off.`
        : `3-Way match verified: PO, Goods Receipt, and Invoice amounts align perfectly ($${input.invoice_amount}). Draft reconciliation prepared.`,
    };

    // Update invoice record in Shared Data Fabric
    invoice.match_status = matchStatus;
    invoice.match_details = {
      po_amount: input.po_amount,
      receipt_amount: input.receipt_amount,
      variance_percentage: variancePct,
      discrepancy_reasons: discrepancies,
    };
    if (hasDiscrepancy) {
      invoice.status = InvoiceStatus.DISPUTED;
    }
    await invoice.save();

    // Queue Draft Reconciliation Action in Approval Queue
    const traceId = `TRC-FIN-${Date.now()}`;
    const queuedAction = await AgentAction.create({
      organization_id: org._id,
      trace_id: traceId,
      agent_type: AgentType.FINANCE_POD,
      action_type: hasDiscrepancy ? 'FLAG_INVOICE_DISCREPANCY' : 'DRAFT_RECONCILIATION_REPORT',
      target_entity_type: 'Invoice',
      target_entity_id: invoice._id,
      input_context: {
        invoice_id: invoice._id.toString(),
        invoice_number: invoice.invoice_number,
        po_number: input.po_number,
      },
      output_payload: {
        invoice_number: invoice.invoice_number,
        amount: invoice.amount,
        match_status: matchStatus,
        discrepancies,
      },
      reasoning: evaluation.reasoning,
      confidence: confidenceScore,
      risk_level: hasDiscrepancy ? ActionRiskLevel.HIGH : ActionRiskLevel.MEDIUM,
      status: ActionStatus.PENDING_APPROVAL,
      reversible: true,
      rollback_payload: {
        action: 'REVERT_MATCH_STATUS',
        invoice_id: invoice._id.toString(),
      },
    });

    await AuditLog.create({
      organization_id: org._id,
      trace_id: traceId,
      action_id: queuedAction._id,
      actor_type: 'AI_AGENT',
      actor_id: 'AGENT_FINANCE_POD',
      actor_name: 'Finance/Ops Agent Pod',
      action: 'EVALUATED_3_WAY_MATCH',
      resource_type: 'Invoice',
      resource_id: invoice._id.toString(),
      state_before: { match_status: 'PENDING_DOCUMENTATION' },
      state_after: { match_status: matchStatus, discrepancies_count: discrepancies.length },
    });

    return {
      invoice,
      evaluation,
      action_queued: queuedAction,
    };
  }

  public static async detectAnomalies(): Promise<{
    flagged_transactions: any[];
    summary: string;
  }> {
    const invoices = await Invoice.find().populate('account_id', 'name');
    const flaggedList: any[] = [];

    for (const inv of invoices) {
      if (inv.match_status === InvoiceMatchStatus.MISMATCH_PO) {
        flaggedList.push({
          type: 'PRICE_VARIANCE_ANOMALY',
          invoice_number: inv.invoice_number,
          account_name: (inv.account_id as any)?.name || 'Unknown Account',
          amount: inv.amount,
          details: inv.match_details?.discrepancy_reasons?.[0] || 'Unverified variance',
        });
      }
    }

    return {
      flagged_transactions: flaggedList,
      summary: `Finance Sentinel detected ${flaggedList.length} anomalies across live invoice stream.`,
    };
  }
}
