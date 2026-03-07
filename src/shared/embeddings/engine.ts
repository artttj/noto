const OFFSCREEN_URL = 'offscreen/offscreen.html';

async function ensureOffscreen(): Promise<void> {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
    documentUrls: [chrome.runtime.getURL(OFFSCREEN_URL)],
  });

  if (contexts.length > 0) return;

  await chrome.offscreen.createDocument({
    url: OFFSCREEN_URL,
    reasons: [chrome.offscreen.Reason.DOM_SCRAPING],
    justification: 'Run local text embedding model (ONNX/WASM)',
  });
}

export async function embed(text: string): Promise<number[]> {
  await ensureOffscreen();

  const response = await chrome.runtime.sendMessage({ type: 'SONTO_EMBED', text }) as
    | { ok: true; embedding: number[] }
    | { ok: false; error: string };

  if (!response.ok) throw new Error(response.error);
  return response.embedding;
}
