# <img src="icons/icon128.png" width="36" alt="" valign="middle" /> Sonto

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)](LICENSE) ![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white) ![Google Chrome](https://img.shields.io/badge/Google%20Chrome-4285F4?style=for-the-badge&logo=GoogleChrome&logoColor=white)

## A zen feed for your browser.

Sonto turns your Chrome sidebar into a calm, rolling feed of art, quotes, science facts, and news. New content drips in at your pace. When you want more, save text from any page and chat with your browsing history using AI.

No accounts. No servers. No tracking. Everything stays on your machine.

---

## What you get

- **Zen feed.** A quiet stream of content from 15+ sources: museum art, Mars rover photos, Hacker News, Reddit, trivia, quotes, and more. New items appear on a timer you control (5-60 seconds). Two display modes: scrolling feed or single-message cosmos with spirograph animation.
- **Save anything.** Highlight text on any page, press `Alt+Shift+C` or right-click to save it. Browser history syncs automatically if you opt in.
- **Ask questions.** Chat with your saved snippets in the sidebar. Sonto finds the best matches and sends them as context to your AI provider.
- **Custom RSS.** Add your own feeds. Personal blogs, newsletters, niche news sites. They show up right in the zen stream.
- **Your keys, your cost.** Bring your own OpenAI or Gemini API key. You pay the provider directly.
- **Fully local.** Snippets and embeddings live in IndexedDB. Nothing leaves your browser except the API calls you choose to make.

---

## Quick Start

1. **Clone and build:**
   ```bash
   git clone https://github.com/artttj/sonto.git && cd sonto
   npm install && npm run build
   ```

2. **Install:**
   - Open `chrome://extensions`
   - Turn on **Developer mode** (top right)
   - Click **Load unpacked**
   - Select the `dist/` folder

3. **Add an API key (optional, for chat):**
   - Click the Sonto icon to open the sidebar
   - Click the gear icon, go to **AI**
   - Add your OpenAI or Gemini key

| Provider | Get a key |
| --- | --- |
| OpenAI | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| Google Gemini | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) |

The zen feed works without an API key. You only need one for saving snippets and chatting with them.

---

## The Sidebar

Three modes, switch with the bottom tabs:

- **Zen** (default): Rolling feed of content from your enabled sources. Click any bubble to focus it. Configurable interval, display mode, and source toggles in settings.
- **Browse**: View, filter, and manage saved snippets and history items.
- **Chat**: Ask questions about your saved data. Sonto finds the top matches via vector search and sends them as context to your AI.

### Zen Feed Sources

| Source | What shows up |
| --- | --- |
| Art from The Met (New York) | Public-domain paintings |
| Art from Cleveland Museum | Artworks and did-you-know facts |
| Art from Art Institute of Chicago | Public-domain artworks |
| NASA Mars Rover Photos | Curiosity and Perseverance photos from this date in past years |
| Hacker News Headlines | Top stories with links |
| Reddit Top Posts | Hot posts from science, history, space, and other subs |
| Trivia | Art, science, and book trivia |
| Random Facts | Useless facts in your language |
| Stoic Quotes | Marcus Aurelius, Seneca, Epictetus |
| Design Quotes | From designers and thinkers |
| Zen Quotes | From zenquotes.io |
| Fun Quotes | Lighthearted quotes |
| Quote of the Day | Daily quote from FavQs |
| Daily Affirmations | Positive affirmations |
| Advice Slip | Random advice |
| Custom RSS Feeds | Your own feeds |

Toggle any source on or off in Settings > Feed > Sources.

### How search works

1. **Capture**: Save text from any page via shortcut or context menu. History syncs every 30 minutes (opt-in).
2. **Embed**: Each snippet becomes a vector via API (`text-embedding-3-small` for OpenAI, `text-embedding-004` for Gemini).
3. **Store**: Vectors and text stay in IndexedDB on your device.
4. **Search**: Your question is embedded and compared against stored vectors using cosine similarity.
5. **Answer**: The top matches are sent as context to your chat model for a grounded response.

---

## Keyboard Shortcuts

| Action | Shortcut |
| --- | --- |
| **Open sidebar** | `Alt+Shift+S` |
| **Save selection** | `Alt+Shift+C` |

---

## Languages

English and German. Switch in Settings > Feed > Language.

---

## Privacy

- Everything stored locally. API keys in `chrome.storage.local`, data in IndexedDB. Nothing synced anywhere.
- API calls go straight from your browser to OpenAI or Google. No middleman.
- No analytics, no tracking, no accounts. Fully open source.

Provider privacy policies: [OpenAI](https://openai.com/policies/privacy-policy/) | [Google AI](https://ai.google.dev/gemini-api/terms)

---

## Tech

- TypeScript (strict mode)
- Chrome Extension Manifest V3, Side Panel API
- IndexedDB vector store with cosine similarity
- esbuild
- Zero runtime dependencies

---

## License

MIT. See [LICENSE](LICENSE).
