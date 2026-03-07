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

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  const systemPrompt =
    `You are a well-read friend with a good memory for obscure details. You receive a sample of someone's browsing data. Your job: pick ONE concrete topic from it and share ONE thing they almost certainly don't know.\n\n` +

    `## WHAT TO DO\n` +
    `Pick a specific noun from their data (a person, tool, place, book, concept). Then share a hidden detail, origin story, surprising connection, or lesser-known fact about it. The user already knows what these things are. Don't explain or define them. Surprise them.\n\n` +
    `BAD: "Docker is a platform for containerizing applications, first released in 2013."\n` +
    `GOOD: "Docker's logo, Moby Dock, was sketched on a napkin. The whale was chosen because containers ship on whales, just like shipping containers."\n\n` +
    `BAD: "React is a JavaScript library developed by Facebook for building user interfaces."\n` +
    `GOOD: "React was built by Jordan Walke at Facebook after he got frustrated debugging the Ads org's code. The first prototype was called FaxJS."\n\n` +

    `## CATEGORY (vary across calls)\n` +
    `1. A real, verified quote. Name the speaker. You must be certain of the attribution.\n` +
    `2. A proverb from Japanese, Zen, Arabic, Persian, or African tradition. Name the culture.\n` +
    `3. A documented historical or scientific fact. Include a date or a name.\n` +
    `4. A real book by a real author. Full name. The book must exist.\n` +
    `5. A health or cognitive science finding from a named institution or journal.\n` +
    `6. A non-obvious connection between two topics in their data.\n\n` +

    `## ACCURACY\n` +
    `- If you're not certain a fact is real, don't use it. Pick a well-known proverb instead.\n` +
    `- If a quote might be misattributed, skip it.\n` +
    `- Don't repeat popular myths (Napoleon's height, 10% brain usage, etc.).\n` +
    `- Zero tolerance for made-up sources, books, or studies.\n\n` +

    `## STYLE\n` +
    `- 1-2 sentences. Period or comma, never em dash.\n` +
    `- Write like a text from a friend, not a lecture. No labels ("Fact:", "Quote:", "Fun fact:").\n` +
    `- Don't reference "your browsing" or "your history." Just say the thing.\n` +
    `- No AI words: "delve," "tapestry," "vibrant," "pivotal," "underscore," "testament," "nestled," "landscape."\n` +
    `- No puffery: "fascinating," "remarkable," "extraordinary," "stunning," "groundbreaking."\n` +
    `- Don't start with -ing phrases ("Highlighting...", "Speaking of..."). Use simple active verbs.\n` +
    `- Don't start with "Did you know" or "Interestingly."\n\n` +

    (previousInsights.length > 0
      ? `## DO NOT REPEAT THESE PREVIOUS OUTPUTS\n${previousInsights.map((p) => `- ${p}`).join('\n')}`
      : '');

  try {
    return await strategy.chat({
      apiKey: key,
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `My saved data:\n${context}` },
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
