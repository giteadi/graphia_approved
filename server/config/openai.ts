import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const primaryKey = process.env.VITE_OPENAI_API_KEY;
const backupKey = process.env.VITE_OPENAI_API_KEY_BACKUP;

if (!primaryKey && !backupKey) {
  console.error('[Config] ERROR: No OpenAI API key found. Set VITE_OPENAI_API_KEY or VITE_OPENAI_API_KEY_BACKUP in .env');
  process.exit(1);
}

const activeKey = primaryKey || backupKey!;
console.log('[Config] OpenAI primary key loaded:', activeKey.slice(0, 8) + '...' + activeKey.slice(-4));
if (backupKey) {
  console.log('[Config] OpenAI backup key loaded:', backupKey.slice(0, 8) + '...' + backupKey.slice(-4));
}

export const openaiClient = new OpenAI({ apiKey: activeKey });

/**
 * Checks whether an OpenAI error is quota/billing related.
 * Covers HTTP 429 (rate limit / quota exceeded) and error codes
 * "insufficient_quota" and "billing_hard_limit_reached".
 */
function isQuotaError(err: unknown): boolean {
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>;
    const status = e['status'] as number | undefined;
    const code = e['code'] as string | undefined;
    if (status === 429) return true;
    if (code === 'insufficient_quota' || code === 'billing_hard_limit_reached') return true;
  }
  return false;
}

/**
 * Wraps any OpenAI API call with automatic key fallback.
 *
 * Usage:
 *   const result = await withFallback(client => client.chat.completions.create(...));
 *
 * If the primary key throws a quota error and a backup key is configured,
 * the call is automatically retried with the backup client.
 */
export async function withFallback<T>(
  fn: (client: OpenAI) => Promise<T>
): Promise<T> {
  try {
    return await fn(openaiClient);
  } catch (err) {
    if (backupKey && isQuotaError(err)) {
      console.warn('[Config] Primary key quota exceeded — switching to backup key for this request.');
      const backupClient = new OpenAI({ apiKey: backupKey });
      return await fn(backupClient);
    }
    throw err;
  }
}
