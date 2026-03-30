# <img src="icons/icon128.png" width="36" alt="" valign="middle" /> SONTO

A calm Chrome sidebar that works as a clipboard and prompt manager. No API keys needed. Save text snippets, organize prompts, and browse your copy history.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)](LICENSE) ![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white) ![Google Chrome](https://img.shields.io/badge/Google%20Chrome-4285F4?style=for-the-badge&logo=GoogleChrome&logoColor=white)

## Screenshots

<table>
  <tr>
    <td><img src="docs/screenshots/webstore_00001.png" alt="Sonto screenshot 1" width="420" /></td>
    <td><img src="docs/screenshots/webstore_new.png" alt="Sonto screenshot 2" width="420" /></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/webstore_00004.png" alt="Sonto screenshot 3" width="420" /></td>
    <td><img src="docs/screenshots/webstore_00005.png" alt="Sonto screenshot 4" width="420" /></td>
  </tr>
</table>

## Quick start

Clone and build the extension:

```bash
git clone https://github.com/artttj/sonto.git
cd sonto
npm install
npm run build
```

Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, then select the `dist/` folder.

No API keys needed. The extension works entirely in your browser.

## Features

- **Clipboard history**: Automatically save copied text. Press Alt+Shift+C or right-click to capture manually
- **Prompt management**: Save and organize your favorite AI prompts
- **Pin important items**: Keep frequently used snippets at the top
- **Zen feed**: A slow feed with art, quotes, and interesting content when you need a break
- **Two modes**: Scrolling feed or Cosmos mode with procedural spirograph animations
- **Themes**: Dark and light themes with WCAG 2.1 AA contrast compliance
- **Backup & restore**: Export and import all data as JSON
- **Fully local**: All data stays in your browser. No accounts, no tracking

## Zen feed sources

| Source | Content |
|---|---|
| 1000-Word Philosophy | Philosophy essays |
| Atlas Obscura | Curious places and stories |
| Album of a Day | A rare daily pick from 200 Pitchfork and 500 Rolling Stone albums |
| Cleveland Museum of Art | Artworks and facts |
| Getty Museum | Paintings and sculptures |
| Haiku | Japanese haiku poems |
| Hacker News | Top tech stories |
| Japanese Proverbs | With English translation |
| The Met Museum | Public domain paintings |
| Oblique Strategies | Creative prompts |
| Perseverance Rover | Mars surface photos |
| Reddit | Science, history, space, philosophy |
| Rijksmuseum | Dutch Golden Age paintings |
| Smithsonian Smart News | Science and smart news |
| Wikimedia Commons Paintings | Random paintings from curated Commons categories |
| Custom RSS | Your own feeds |
| Custom JSON API | Any endpoint returning items |

Toggle sources in **Settings > Feed > Sources**.

## Languages

- English
- German (Deutsch)

## Privacy

All data stays in your browser. No backend. No analytics. No tracking.

Feed content comes from public third-party APIs. Sonto does not own or filter it.

## Tech

* TypeScript
* Chrome Extension Manifest V3
* Side Panel API
* IndexedDB
* esbuild bundling

Zero runtime dependencies.

## License

MIT. See [LICENSE](LICENSE).
