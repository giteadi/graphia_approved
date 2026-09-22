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
 * Checks whether an OpenAI error means the requested model is unavailable
 * (doesn't exist, no access on this key, or doesn't support a param we sent).
 */
function isModelError(err: unknown): boolean {
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>;
    if (e['status'] === 404) return true;
    if (e['code'] === 'model_not_found') return true;
    const msg = String(e['message'] || '').toLowerCase();
    if (
      msg.includes('does not exist') ||
      msg.includes('do not have access') ||
      msg.includes('model_not_found') ||
      msg.includes('unsupported model') ||
      msg.includes('invalid model')
    ) return true;
  }
  return false;
}

/**
 * Ordered fallback chain. If the preferred model is unavailable on the
 * configured key(s), the next model in this list is tried automatically.
 * All entries support vision input + the Responses API.
 */
const MODEL_FALLBACK_CHAIN = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'];

/** True when the model rejected a specific request parameter (e.g. temperature). */
function isUnsupportedParamError(err: unknown, param: string): boolean {
  if (err && typeof err === 'object') {
    const msg = String((err as Record<string, unknown>)['message'] || '').toLowerCase();
    return msg.includes('unsupported parameter') && msg.includes(`'${param}'`);
  }
  return false;
}

/**
 * Calls the Responses API, dropping `temperature` if the model rejects it.
 *
 * Newer reasoning models return 400 "Unsupported parameter: 'temperature'".
 * That is not a reason to abandon the model — the right remedy is to send the
 * request again without the parameter.
 */
export async function createResponse(
  client: OpenAI,
  payload: Record<string, unknown>,
  temperature?: number
): Promise<unknown> {
  if (temperature === undefined) {
    return await (client as any).responses.create(payload);
  }

  try {
    return await (client as any).responses.create({ ...payload, temperature });
  } catch (err) {
    if (isUnsupportedParamError(err, 'temperature')) {
      console.warn(`[Config] Model '${payload.model}' rejects temperature — retrying without it.`);
      return await (client as any).responses.create(payload);
    }
    throw err;
  }
}

/**
 * Wraps an OpenAI API call with automatic fallback across models AND keys.
 *
 * Usage:
 *   const result = await withFallback(
 *     (client, model) => client.responses.create({ model, ... }),
 *     'gpt-4o'
 *   );
 *
 * Behaviour:
 *  - Tries the preferred model first, then each model in MODEL_FALLBACK_CHAIN.
 *  - Every model is tried on the primary key, then the backup key (if set).
 *  - "Model not found / no access" → next model.
 *  - Quota error → next key for the same model, then next model.
 *  - Any other error (bad request, safety, etc.) → thrown immediately.
 */
export async function withFallback<T>(
  fn: (client: OpenAI, model: string) => Promise<T>,
  preferredModel?: string
): Promise<T> {
  const models = [preferredModel, ...MODEL_FALLBACK_CHAIN]
    .filter((m): m is string => Boolean(m))
    .filter((m, i, a) => a.indexOf(m) === i);

  const backupClient = backupKey ? new OpenAI({ apiKey: backupKey }) : null;

  let lastErr: unknown;
  for (const m of models) {
    const clients = backupClient ? [openaiClient, backupClient] : [openaiClient];
    for (const client of clients) {
      const keyLabel = client === openaiClient ? 'primary' : 'backup';
      try {
        return await fn(client, m);
      } catch (err) {
        if (isModelError(err)) {
          console.warn(`[Config] Model '${m}' unavailable on ${keyLabel} key — trying next fallback.`);
          lastErr = err;
          continue;
        }
        if (isQuotaError(err)) {
          console.warn(`[Config] Quota exceeded on ${keyLabel} key for '${m}' — trying next fallback.`);
          lastErr = err;
          continue;
        }
        throw err;
      }
    }
  }
  throw lastErr;
}
