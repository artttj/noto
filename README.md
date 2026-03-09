# <img src="icons/icon128.png" width="36" alt="" valign="middle" /> Sonto

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)](LICENSE) ![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white) ![Google Chrome](https://img.shields.io/badge/Google%20Chrome-4285F4?style=for-the-badge&logo=GoogleChrome&logoColor=white)

A calm Chrome sidebar feed of art, quotes, science, and news. Save text from any page and chat with it using AI.

No accounts. No servers. No tracking. Everything local.

---

## Features

- **Zen feed** from 15+ sources: museum art, Mars photos, Hacker News, Atlas Obscura, trivia, quotes, and more
- **Two modes**: scrolling feed or Cosmos mode with procedural spirograph animations
- **Dark and light themes** with WCAG 2.1 AA contrast compliance
- **Personalized**: generates suggestions from your browsing history when an AI key is set
- **Save anything**: highlight text and press `Alt+Shift+C` or right-click to save. Works without an API key too.
- **Chat**: ask questions about saved snippets using RAG with OpenAI or Gemini
- **Backup and restore**: export/import all data as JSON
- **Custom RSS feeds** and JSON API sources
- **Weekly digest** summarizing your saved content
- **BYOK**: bring your own API key, pay the provider directly

---

## Quick start

```bash
git clone https://github.com/artttj/sonto.git
cd sonto && npm install && npm run build
```

Open `chrome://extensions`, enable Developer mode, click Load unpacked, select `dist/`.

The zen feed works without an API key. For chat and embeddings, add your key in **Settings > AI**.

| Provider | Get a key |
| --- | --- |
| OpenAI | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| Gemini | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) |

---

## Zen feed sources

| Source | Content |
| --- | --- |
| The Met Museum | Public domain paintings |
| Cleveland Museum of Art | Artworks and facts |
| NASA Mars / Perseverance | Surface and rover photos |
| Hacker News | Top stories |
| Reddit | Science, history, space, tech |
| Getty Museum | Paintings and sculptures |
| Smithsonian | Smart news and science |
| Atlas Obscura | Curious places and facts |
| Trivia | Art, science, books |
| Quotes | Stoic, design, zen, fun, daily |
| Japanese Proverbs | With English translation |
| Oblique Strategies | Creative prompts |
| Random Facts | In your language |
| Custom RSS | Your own feeds |
| Custom JSON API | Any endpoint returning items |

Toggle any source in **Settings > Feed > Sources**.

---

## Shortcuts

| Action | Keys |
| --- | --- |
| Open sidebar | `Alt+Shift+S` |
| Save selection | `Alt+Shift+C` |

---

## Privacy

All data stays in your browser. API calls go directly to OpenAI or Google. No proxy, no analytics, no tracking.

Feed content comes from public third-party APIs. Sonto does not own or filter it.

[OpenAI Privacy](https://openai.com/policies/privacy-policy/) | [Google AI Terms](https://ai.google.dev/gemini-api/terms)

---

## Tech

TypeScript, Manifest V3, Side Panel API, IndexedDB with cosine similarity search, esbuild. Zero runtime dependencies.

---

## License

MIT. See [LICENSE](LICENSE).
