import crypto from 'crypto';

interface IdempotencyRecord {
  token: string;
  action_id: string;
  result: any;
  created_at: number;
}

export class IdempotencyGuard {
  private static cache: Map<string, IdempotencyRecord> = new Map();
  private static readonly TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

  public static generateToken(actionId: string, payload: any): string {
    const raw = `${actionId}:${JSON.stringify(payload)}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  public static checkToken(token: string): any | null {
    const record = this.cache.get(token);
    if (!record) return null;

    if (Date.now() - record.created_at > this.TTL_MS) {
      this.cache.delete(token);
      return null;
    }

    return record.result;
  }

  public static recordExecution(token: string, actionId: string, result: any): void {
    this.cache.set(token, {
      token,
      action_id: actionId,
      result,
      created_at: Date.now(),
    });
  }

  public static clear(): void {
    this.cache.clear();
  }
}
