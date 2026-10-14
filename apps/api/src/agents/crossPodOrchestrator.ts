import { Account, Deal, Ticket, Invoice, AuditLog, Organization } from '../models/index.js';
import { AgentType } from '@nexora/core';

export class CrossPodOrchestrator {
  public static async broadcastChurnRiskAlert(
    accountId: string,
    triggerSource: string,
    reason: string
  ): Promise<{ affected_deals: number; alert_logged: boolean }> {
    const org = await Organization.findOne();
    const account = await Account.findById(accountId);
    if (!account) throw new Error(`Account ${accountId} not found`);

    // 1. Lower Account Health Score
    account.health_score = Math.max(15, account.health_score - 20);
    await account.save();

    // 2. Alert & update active Sales Deals
    const openDeals = await Deal.find({ account_id: account._id });
    for (const deal of openDeals) {
      deal.intent_signals.push({
        signal: `⚠️ CROSS-POD ALERT [${triggerSource}]: ${reason}`,
        source: triggerSource,
        detected_at: new Date(),
      });
      await deal.save();
    }

    // 3. Log Cross-Pod Audit Event
    await AuditLog.create({
      organization_id: org?._id || account.organization_id,
      trace_id: `TRC-XPOD-${Date.now()}`,
      actor_type: 'AI_AGENT',
      actor_id: 'CROSS_POD_ORCHESTRATOR',
      actor_name: 'Orchestrator Engine',
      action: 'CROSS_POD_CHURN_RISK_BROADCAST',
      resource_type: 'Account',
      resource_id: account._id.toString(),
      state_before: { health_score: account.health_score + 20 },
      state_after: { health_score: account.health_score, deals_notified: openDeals.length },
    });

    return {
      affected_deals: openDeals.length,
      alert_logged: true,
    };
  }
}
