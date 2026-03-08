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

const EXTRACT_CATEGORIES_PROMPT =
  `You receive titles and content from a user's browsing history and saved snippets.\n` +
  `Extract 15-20 specific interest categories that describe what this person genuinely reads about.\n\n` +
  `Be specific and detailed:\n` +
  `- NOT "programming" → YES "TypeScript type inference" or "Rust memory management"\n` +
  `- NOT "health" → YES "intermittent fasting" or "VO2 max training"\n` +
  `- NOT "finance" → YES "index fund investing" or "options pricing"\n\n` +
  `Exclude:\n` +
  `- Anything involving AI, machine learning, LLMs, prompt engineering, chatbots, or AI-driven automation — no exceptions\n` +
  `- Adult content, pornography, drugs, substances, or anything explicit\n` +
  `- Social media, streaming platforms, video platforms, content creation\n` +
  `- Food delivery, ride hailing, banking apps, or mundane everyday services\n` +
  `- Local businesses, restaurants, or city-specific services\n\n` +
  `Return a JSON array of strings only. No explanation, no markdown. Example:\n` +
  `["TypeScript generics", "espresso extraction", "sleep optimization"]`;

const GENERATE_ZEN_FACT_PROMPT =
  `ONE surprising, counterintuitive fact about the given topic. 1-2 sentences.\n` +
  `Return [NULL] if uncertain. No numbers. No advice. No labels. No em dashes. Just say the thing.`;

const GENERATE_ZEN_STAT_PROMPT =
  `ONE well-established numerical fact about the given topic. 1-2 sentences.\n` +
  `Use only widely cited, verifiable figures. Return [NULL] if uncertain. No advice. No labels. No em dashes. Just say the thing.`;

async function generateZenStat(category: string, previousFacts: string[], language: string): Promise<string> {
  const settings = await getSettings();
  const key = settings.llmProvider === 'gemini' ? await getGeminiKey() : await getOpenAIKey();
  if (!key.trim()) throw new Error('No API key');

  const doNotRepeat = previousFacts.length > 0
    ? `\n\n## DO NOT REPEAT\n${previousFacts.map((p) => `- ${p}`).join('\n')}`
    : '';

  const strategy = getProviderStrategy(settings.llmProvider);
  const model = settings.llmProvider === 'gemini' ? settings.geminiModel : settings.openaiModel;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    return await strategy.chat({
      apiKey: key,
      model,
      messages: [
        { role: 'system', content: `Respond in ${language === 'de' ? 'German' : 'English'}.\n\n` + GENERATE_ZEN_STAT_PROMPT + doNotRepeat },
        { role: 'user', content: `Topic: ${category}` },
      ],
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function extractCategories(snippets: { text: string; title: string; source: string }[]): Promise<string[]> {
  const settings = await getSettings();
  const key = settings.llmProvider === 'gemini' ? await getGeminiKey() : await getOpenAIKey();
  if (!key.trim()) throw new Error('No API key');

  const context = snippets
    .map((s) => s.source === 'history' ? s.title : `${s.title ? s.title + ': ' : ''}${s.text.slice(0, 200)}`)
    .join('\n');

  const strategy = getProviderStrategy(settings.llmProvider);
  const model = settings.llmProvider === 'gemini' ? settings.geminiModel : settings.openaiModel;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const raw = await strategy.chat({
      apiKey: key,
      model,
      messages: [
        { role: 'system', content: EXTRACT_CATEGORIES_PROMPT },
        { role: 'user', content: `Snippets:\n${context}` },
      ],
      signal: controller.signal,
    });
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as unknown[]).filter((c): c is string => typeof c === 'string') : [];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

async function generateZenFact(category: string, previousFacts: string[], language: string): Promise<string> {
  const settings = await getSettings();
  const key = settings.llmProvider === 'gemini' ? await getGeminiKey() : await getOpenAIKey();
  if (!key.trim()) throw new Error('No API key');

  const doNotRepeat = previousFacts.length > 0
    ? `\n\n## DO NOT REPEAT\n${previousFacts.map((p) => `- ${p}`).join('\n')}`
    : '';

  const strategy = getProviderStrategy(settings.llmProvider);
  const model = settings.llmProvider === 'gemini' ? settings.geminiModel : settings.openaiModel;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    return await strategy.chat({
      apiKey: key,
      model,
      messages: [
        { role: 'system', content: `Respond in ${language === 'de' ? 'German' : 'English'}.\n\n` + GENERATE_ZEN_FACT_PROMPT + doNotRepeat },
        { role: 'user', content: `Topic: ${category}` },
      ],
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
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

  if (message.type === MSG.EXTRACT_CATEGORIES) {
    void extractCategories(message.snippets)
      .then((categories) => sendResponse({ ok: true, categories }))
      .catch(() => sendResponse({ ok: false, categories: [] }));
    return true;
  }

  if (message.type === MSG.GENERATE_ZEN_FACT) {
    void generateZenFact(message.category, message.previousFacts, message.language)
      .then((fact) => sendResponse({ ok: true, fact }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  }

  if (message.type === MSG.GENERATE_ZEN_STAT) {
    void generateZenStat(message.category, message.previousFacts, message.language)
      .then((fact) => sendResponse({ ok: true, fact }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  }
});
