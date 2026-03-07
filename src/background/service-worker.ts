import { MSG, type RuntimeMessage } from '../shared/messages';
import { embed, embedBatch } from '../shared/embeddings/engine';
import { addSnippet, deleteSnippet, getAllSnippets, search, hasSnippetForUrl } from '../shared/embeddings/vector-store';
import { MAX_CAPTURE_CHARS, SEARCH_TOP_K } from '../shared/constants';
import { getSettings, getOpenAIKey, getGeminiKey } from '../shared/storage';
import { getProviderStrategy } from '../shared/providers';
import type { Snippet } from '../shared/types';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function captureSnippet(text: string, url: string, title: string, source: Snippet['source'] = 'manual'): Promise<void> {
  const trimmed = text.slice(0, MAX_CAPTURE_CHARS);
  const embedding = await embed(trimmed);
  const snippet: Snippet = {
    id: generateId(),
    text: trimmed,
    url,
    title,
    timestamp: Date.now(),
    embedding,
    source,
  };
  await addSnippet(snippet);
  void chrome.runtime.sendMessage({ type: MSG.SNIPPET_ADDED }).catch(() => {});
}

const GENERATE_PROMPT =
  `You receive browsing data. Pick ONE well-known topic from it and share ONE verified fact about that specific topic. 1-2 sentences max.\n\n` +
  `## RULES\n` +
  `- ONLY write about things you are 100% certain about.\n` +
  `- The fact MUST be directly about the topic you picked. No loose metaphors, no "this fits because..." connections.\n` +
  `- NEVER describe or define what something is. NEVER say "X is a tool/platform/system that does Y." The user already knows what it is. Share a lesser-known detail, origin story, or surprising connection instead.\n` +
  `- NEVER make claims about people unless globally famous. If you don't recognize a name, skip them.\n` +
  `- NEVER invent biographies, credentials, achievements, books, studies, quotes, or sources.\n` +
  `- NEVER mention or reference the user's browsing, history, reading, or data. Don't say "if you're exploring" or "fitting for your interest in." Just state the fact.\n` +
  `- NEVER try to connect or relate the fact back to the browsing data. The output should stand alone.\n` +
  `- If you can't find a topic you're certain about, output ONLY a well-known proverb with its culture of origin. Do not explain why you chose it or how it relates to anything.\n\n` +
  `## STYLE\n` +
  `- Write like a short text from a friend. No labels, no "Fun fact:", no "Did you know", no "Here's a".\n` +
  `- Period or comma only. No em dashes.\n` +
  `- No AI words: "delve," "tapestry," "vibrant," "pivotal," "underscore," "testament," "nestled," "landscape," "renowned," "notable."\n` +
  `- No puffery: "fascinating," "remarkable," "extraordinary," "stunning."\n` +
  `- Just state the fact or proverb. Nothing else.`;

const VALIDATE_PROMPT =
  `You are a strict fact-checker and style editor. You will receive a short statement.\n\n` +
  `Check ALL of these:\n` +
  `1. Is every fact verifiably true? Check names, dates, origins, attributions.\n` +
  `2. Does it claim something about a person? Is that person globally famous and is the claim accurate?\n` +
  `3. Does it mention a book, study, or quote? Does it really exist?\n` +
  `4. Does it reference the user's browsing, history, or interests? (e.g. "fitting if you're exploring...", "given your interest in...") This is NOT allowed.\n` +
  `5. Does it try to explain why it chose a topic or connect a proverb to browsing data? This is NOT allowed.\n` +
  `6. Does it start with "Here's a" or contain labels like "Fun fact:"? This is NOT allowed.\n` +
  `7. Is it just a definition? (e.g. "X is a tool/platform/system that does Y.") Definitions are NOT allowed. It must share a non-obvious detail.\n\n` +
  `Respond with EXACTLY one of these:\n` +
  `- PASS (only if all checks pass)\n` +
  `- FAIL: <a clean 1-2 sentence replacement that states a verified fact or proverb with no commentary>\n\n` +
  `Be strict. Any doubt means FAIL.`;

async function generateInsight(
  snippetSample: { text: string; title: string; source: string }[],
  previousInsights: string[] = [],
): Promise<string> {
  const settings = await getSettings();
  const key = settings.llmProvider === 'gemini' ? await getGeminiKey() : await getOpenAIKey();
  if (!key.trim()) throw new Error('No API key');

  const context = snippetSample
    .map((s, i) => `[${i + 1}] ${s.title || s.text.slice(0, 80)}`)
    .join('\n');

  const strategy = getProviderStrategy(settings.llmProvider);
  const model = settings.llmProvider === 'gemini' ? settings.geminiModel : settings.openaiModel;

  const doNotRepeat = previousInsights.length > 0
    ? `\n\n## DO NOT REPEAT\n${previousInsights.map((p) => `- ${p}`).join('\n')}`
    : '';

  const controller1 = new AbortController();
  const timer1 = setTimeout(() => controller1.abort(), 15000);

  let draft: string;
  try {
    draft = await strategy.chat({
      apiKey: key,
      model,
      messages: [
        { role: 'system', content: GENERATE_PROMPT + doNotRepeat },
        { role: 'user', content: `My saved data:\n${context}` },
      ],
      signal: controller1.signal,
    });
  } finally {
    clearTimeout(timer1);
  }

  const controller2 = new AbortController();
  const timer2 = setTimeout(() => controller2.abort(), 15000);

  let verdict: string;
  try {
    verdict = await strategy.chat({
      apiKey: key,
      model,
      messages: [
        { role: 'system', content: VALIDATE_PROMPT },
        { role: 'user', content: draft },
      ],
      signal: controller2.signal,
    });
  } finally {
    clearTimeout(timer2);
  }

  const trimmed = verdict.trim();
  if (trimmed === 'PASS') return draft;

  const failMatch = /^FAIL:\s*(.+)/s.exec(trimmed);
  if (failMatch) return failMatch[1].trim();

  return draft;
}

const HISTORY_ALARM = 'sonto-history-sync';
const HISTORY_SYNC_INTERVAL_MINUTES = 30;
const HISTORY_INITIAL_DAYS = 30;
const HISTORY_MAX_RESULTS = 500;

const BATCH_SIZE = 100;

async function syncHistory(startTime?: number): Promise<void> {
  const msPerDay = 86400000;
  const defaultStart = Date.now() - HISTORY_INITIAL_DAYS * msPerDay;
  const items = await chrome.history.search({
    text: '',
    startTime: startTime ?? defaultStart,
    maxResults: HISTORY_MAX_RESULTS,
  });

  const pending: { text: string; url: string; title: string }[] = [];
  for (const item of items) {
    const url = item.url ?? '';
    const title = item.title ?? '';
    if (!url || !title.trim()) continue;
    if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) continue;
    if (await hasSnippetForUrl(url)) continue;
    const embedText = `${title.trim()} — ${url}`;
    pending.push({ text: embedText, url, title });
  }

  if (pending.length === 0) return;
  console.log(`[Sonto] syncing ${pending.length} history items`);

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE);
    try {
      const embeddings = await embedBatch(batch.map((b) => b.text));
      for (let j = 0; j < batch.length; j++) {
        const { text, url, title } = batch[j];
        const snippet: Snippet = {
          id: generateId(),
          text: text.slice(0, MAX_CAPTURE_CHARS),
          url,
          title,
          timestamp: Date.now(),
          embedding: embeddings[j],
          source: 'history',
        };
        await addSnippet(snippet);
      }
      console.log(`[Sonto] embedded batch ${i + 1}-${i + batch.length}`);
    } catch (err) {
      console.error('[Sonto] history batch failed:', err);
      break;
    }
  }
}

async function scheduleHistorySync(): Promise<void> {
  const existing = await chrome.alarms.get(HISTORY_ALARM);
  if (!existing) {
    chrome.alarms.create(HISTORY_ALARM, { periodInMinutes: HISTORY_SYNC_INTERVAL_MINUTES });
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'sonto-save',
    title: 'Save to Sonto',
    contexts: ['selection'],
  });

  void scheduleHistorySync();
  void syncHistory();
});

void scheduleHistorySync();
void syncHistory();

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== HISTORY_ALARM) return;
  const startTime = Date.now() - HISTORY_SYNC_INTERVAL_MINUTES * 60 * 1000;
  void syncHistory(startTime);
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== 'sonto-save') return;
  const text = info.selectionText ?? '';
  const url = tab?.url ?? '';
  const title = tab?.title ?? '';
  if (!text.trim()) return;

  void captureSnippet(text, url, title).catch((err: unknown) => {
    console.error('[Sonto] context menu capture failed', err);
  });
});

chrome.commands.onCommand.addListener((command) => {
  if (command !== 'capture_selection') return;

  void (async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    await chrome.tabs.sendMessage(tab.id, { type: 'SONTO_CAPTURE_SHORTCUT' });
  })();
});

chrome.action.onClicked.addListener((tab) => {
  void chrome.sidePanel.open({ windowId: tab.windowId });
});

chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
  if (message.type === MSG.OPEN_SETTINGS) {
    void chrome.runtime.openOptionsPage();
    sendResponse({ ok: true });
    return;
  }

  if (message.type === MSG.CAPTURE_SNIPPET) {
    const { text, url, title } = message;
    void captureSnippet(text, url, title)
      .then(() => {
        sendResponse({ ok: true, type: MSG.CAPTURE_SUCCESS });
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        sendResponse({ ok: false, type: MSG.CAPTURE_ERROR, message: msg });
      });
    return true;
  }

  if (message.type === MSG.QUERY_SNIPPETS) {
    void embed(message.query)
      .then((queryEmbedding) => search(queryEmbedding, SEARCH_TOP_K))
      .then((results) => sendResponse({ ok: true, results }))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        sendResponse({ ok: false, message: msg });
      });
    return true;
  }

  if (message.type === MSG.DELETE_SNIPPET) {
    void deleteSnippet(message.id)
      .then(() => sendResponse({ ok: true }))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        sendResponse({ ok: false, message: msg });
      });
    return true;
  }

  if (message.type === MSG.GET_ALL_SNIPPETS) {
    void getAllSnippets()
      .then((snippets) => sendResponse({ ok: true, snippets }))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        sendResponse({ ok: false, message: msg });
      });
    return true;
  }

  if (message.type === MSG.GENERATE_INSIGHT) {
    console.log('[Sonto] generating insight for', message.snippetSample.length, 'snippets');
    void generateInsight(message.snippetSample, message.previousInsights ?? [])
      .then((insight) => {
        console.log('[Sonto] insight generated:', insight.slice(0, 60));
        sendResponse({ ok: true, insight });
      })
      .catch((err) => {
        console.error('[Sonto] insight generation failed:', err);
        sendResponse({ ok: false });
      });
    return true;
  }
});
