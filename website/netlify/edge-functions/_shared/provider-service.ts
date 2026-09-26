/** Server-only provider configuration. Never expose keys, URLs, or raw errors. */
export const DEFAULT_MODEL = 'claude-sonnet-5';
export type ProviderConfig = { apiKey: string; model: string; messagesUrl: string; route: 'direct' | 'gateway' };
export type ProviderDiagnostic = {
  event: 'olivia_ai_provider_failure';
  mode: 'reading' | 'chat';
  route: ProviderConfig['route'];
  status: number | null;
  code: string;
  reason: string;
  requestId?: string;
};

export function providerConfig(env: (name: string) => string | undefined): ProviderConfig | null {
  const apiKey = env('ANTHROPIC_API_KEY')?.trim();
  if (!apiKey) return null;
  // Netlify supplies a gateway key AND base URL together. Sending that key to
  // api.anthropic.com directly is not a valid provider connection.
  const configuredBase = env('ANTHROPIC_BASE_URL')?.trim();
  const base = new URL(configuredBase || 'https://api.anthropic.com');
  if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash) {
    throw new Error('Invalid provider base URL.');
  }
  const path = base.pathname.replace(/\/+$/, '');
  base.pathname = `${path.endsWith('/v1') ? path : `${path}/v1`}/messages`;
  return {
    apiKey,
    model: env('ANTHROPIC_MODEL')?.trim() || DEFAULT_MODEL,
    messagesUrl: base.href,
    route: base.hostname === 'api.anthropic.com' ? 'direct' : 'gateway',
  };
}

const ERROR_TYPES = new Set(['invalid_request_error', 'authentication_error', 'permission_error', 'not_found_error', 'request_too_large', 'rate_limit_error', 'api_error', 'overloaded_error']);

/** Only fixed categories and a validated provider request ID may enter logs. */
export async function providerFailure(response: Response) {
  let body: unknown;
  try { body = await boundedJSON(response); } catch { body = null; }
  const error = body && typeof body === 'object' && 'error' in body ? body.error : null;
  const detail = error && typeof error === 'object' ? error as Record<string, unknown> : {};
  const code = typeof detail.type === 'string' && ERROR_TYPES.has(detail.type) ? detail.type : 'unknown_error';
  const message = typeof detail.message === 'string' ? detail.message.toLowerCase() : '';
  // Classify in memory; the provider message itself can contain private input.
  const reason = /credit balance|insufficient.{0,20}(credit|balance)|billing|payment required/.test(message) ? 'billing_required'
    : response.status === 401 ? 'authentication_failed'
    : response.status === 403 ? 'access_denied'
    : response.status === 404 ? 'model_or_endpoint_unavailable'
    : response.status === 429 ? 'rate_limited'
    : response.status >= 500 ? 'provider_unavailable'
    : 'request_rejected';
  const id = response.headers.get('request-id');
  const requestId = id && /^req_[A-Za-z0-9_-]{6,100}$/.test(id) ? id : undefined;
  return { status: response.status, code, reason, ...(requestId ? { requestId } : {}) };
}

/** Bound provider responses as well as requests; never retain an unbounded body. */
export async function boundedJSON(response: Response, maximum = 65536): Promise<any> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Missing provider response.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > maximum) { await reader.cancel(); throw new Error('Provider response too large.'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder().decode(bytes));
}
