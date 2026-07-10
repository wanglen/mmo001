/**
 * Minimal Ollama HTTP client (local server).
 */

/**
 * @param {{
 *   baseUrl: string,
 *   model: string,
 *   messages: { role: string, content: string }[],
 *   timeoutMs?: number,
 *   format?: 'json' | null,
 *   fetchImpl?: typeof fetch
 * }} options
 * @returns {Promise<{ content: string, raw: object }>}
 */
export async function ollamaChat({
  baseUrl,
  model,
  messages,
  timeoutMs = 180_000,
  format = 'json',
  numPredict = 256,
  fetchImpl = globalThis.fetch,
}) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('fetch is not available');
  }

  const url = `${baseUrl.replace(/\/$/, '')}/api/chat`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const body = {
      model,
      messages,
      stream: false,
      options: {
        num_predict: numPredict,
        temperature: 0.7,
      },
    };
    if (format) body.format = format;

    const response = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Ollama HTTP ${response.status}${text ? `: ${text.slice(0, 200)}` : ''}`);
    }

    const raw = await response.json();
    const content = raw?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
      throw new Error('Ollama returned empty content');
    }
    return { content, raw };
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error('Ollama request timed out');
    }
    if (err?.cause?.code === 'ECONNREFUSED' || /fetch failed/i.test(String(err?.message))) {
      throw new Error('Ollama is unreachable — is it running locally?');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
