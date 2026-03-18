# 10x Analysis: Sonto Chrome Extension
Session 1 | Date: 2026-03-18

## Current Value

Sonto is a calm Chrome sidebar extension that:
- Surfaces a "slow drip" of curated content (art, quotes, science, news)
- Lets users save snippets from any webpage via `Alt+Shift+C` or right-click
- Provides RAG-based chat with saved content using OpenAI/Gemini
- Offers two modes: scrolling feed or Cosmos (procedural spirograph animations)
- Stores all data locally (IndexedDB + chrome.storage)
- Is BYOK (Bring Your Own Key) - no accounts, no backend

**Who uses it**: Curious people who want serendipitous discovery without social media noise. Power users who save articles/notes and want to chat with them.

**Core action**: Passive consumption (zen feed) + active saving (snippets) + querying (RAG chat)

**Where time spent**: Zen feed (passive), Clipboard manager (organizing), Chat (querying)

---

## The Question

**What would make users unable to live without Sonto?**

---

## Massive Opportunities

### 1. Second Brain Sync
**What**: Bi-directional sync with users' existing note-taking apps (Obsidian, Notion, Readwise)
**Why 10x**: Transforms Sonto from a sidebar into the "ambient layer" of users' personal knowledge systems
**Unlocks**: 
- Saved snippets automatically appear in Obsidian vault
- Highlights from Readwise can flow into Sonto feed
- Creates network effect: more tools = harder to leave
**Effort**: Very High
**Risk**: Sync conflicts, privacy concerns, complexity explosion
**Score**: 🔥 (if sync works, this is a platform play)

### 2. Ambient Audio Intelligence
**What**: Continuously transcribe and extract insights from YouTube/Podcasts users are watching
**Why 10x**: Captures the "passive learning" moment - users learn while consuming content they'd consume anyway
**Unlocks**: Auto-generate highlights from video content, create "heard" snippets
**Effort**: Very High (requires audio capture permissions, transcription API)
**Risk**: Privacy nightmare, Chrome audio APIs limited
**Score**: 🤔 (cool but risky)

### 3. Collaborative Collections
**What**: Share snippet collections with friends/team via peer-to-peer or simple link
**Why 10x**: Transforms from personal tool to social artifact
**Unlocks**: "My friend sent me this", team knowledge bases, shared curations
**Effort**: High
**Risk**: Infrastructure, moderation, complexity
**Score**: 👍 (but maybe not right for privacy-first positioning)

---

## Medium Opportunities

### 4. Smart Re-discovery Engine
**What**: AI analyzes saved snippets and proactively surfaces relevant old content when users visit related pages
**Why 10x**: The "memory palace" effect - Sonto remembers what users saved and reminds them at the perfect moment
**Impact**: Users feel like Sonto "knows" their interests
**Effort**: Medium
**Score**: 🔥 (uses existing embeddings, creates "magic" moment)

### 5. Reading Companion
**What**: Sidebar shows relevant saved snippets, notes, or related content while user reads any article
**Why 10x**: Transforms Sonto from "thing you open" to "thing that helps you read"
**Impact**: Becomes essential during research, learning
**Effort**: Medium
**Score**: 🔥 (natural extension of content script)

### 6. Spaced Repetition from Saved Content
**What**: Turn saved snippets into flashcards with scheduling (like Anki)
**Why 10x**: Creates a daily habit loop - Sonto becomes a learning tool, not just a capture tool
**Impact**: Retention hook, daily active use
**Effort**: Medium
**Score**: 👍 (clear value, distinct from competitors)

### 7. Voice Notebook
**What**: Voice memo capture via sidebar hotkey, auto-transcribed
**Why 10x**: Captures thoughts hands-free, lower friction than copy-paste
**Impact**: More capture = more value
**Effort**: Medium
**Score**: 👍 (Web Speech API is free, low barrier)

---

## Small Gems

### 8. One-Click Export to Notion/Obsidian
**What**: Button to send selected snippet directly to a Notion page or Obsidian vault
**Why powerful**: Eliminates manual copy-paste workflow, instant gratification
**Effort**: Low
**Score**: 🔥 (super quick win, high delight)

### 9. Daily Wrap-up Notification
**What**: Chrome notification at end of day showing "What you saved today" + "Best find from your feed"
**Why powerful**: Creates daily habit loop, surfaces value users forgot they saved
**Effort**: Low
**Score**: 🔥 (uses existing data, creates retention)

### 10. Visual Bookmark Collections
**What**: Create named "collections" with drag-drop, visual grid of saved images/articles
**Why powerful**: Better than list view, more like Pinterest
**Effort**: Low-Medium
**Score**: 👍 (nice to have, not transformative)

### 11. Reading Progress Sync
**What**: Track which saved articles users have read/unread, show completion status
**Why powerful**: Solves "saved but never read" anxiety
**Effort**: Low
**Score**: 👍 (simple but valuable)

### 12. Quick Search Anywhere
**What**: Global hotkey to search snippets from any page overlay (like Spotlight/Alfred)
**Why powerful**: Instant access without switching context to sidebar
**Effort**: Low
**Score**: 🔥 (massive workflow improvement)

---

## Recommended Priority

### Do Now (Quick wins)
1. **Quick Search Anywhere** — Global hotkey to search saved snippets from any page. This is the "Spotlight for your brain." Effort: Low, Impact: High
2. **One-Click Export** — Export selected snippet to Notion/Obsidian with one click. Effort: Low, Impact: High
3. **Daily Wrap-up Notification** — End-of-day summary of saved content. Effort: Low, Impact: Medium

### Do Next (High leverage)
1. **Smart Re-discovery** — Surface old snippets when visiting related pages. Uses existing embeddings. Effort: Medium, Impact: High
2. **Reading Companion** — Show relevant saved content in sidebar while reading articles. Effort: Medium, Impact: High
3. **Spaced Repetition** — Flashcards from saved content. Effort: Medium, Impact: Medium-High

### Explore (Strategic bets)
1. **Second Brain Sync** — Obsidian/Notion/Readwise sync. Effort: Very High, Impact: Massive
2. **Voice Notebook** — Voice capture with Web Speech API. Effort: Medium, Impact: Medium

### Backlog (Good but not now)
- Collaborative collections (complex, privacy tension)
- Visual bookmark collections (nice to have, not essential)

---

## Questions

### Answered
- **Q**: What makes Sonto special? **A**: Calm, ambient, privacy-first. No social, no feed algorithms, no accounts.
- **Q**: What's the biggest friction? **A**: Currently just a sidebar - users must open it. Global search would fix this.
- **Q**: What data exists? **A**: Snippets (text, URL, title, timestamp, pinned), embeddings (for RAG), history sync, read-later queue.

### Blockers
- **Q**: Is there appetite for cloud sync? **A**: Privacy-first users may reject. Keep local-first, offer opt-in.
- **Q**: Should we add mobile? **A**: Not right now. Extension is the moat.

---

## Next Steps

- [ ] Validate: Would global search hotkey actually get used? (quick user survey)
- [ ] Research: How does Obsidian sync work at file level? (could use filesystem)
- [ ] Prototype: Reading companion on one site (e.g., arxiv, medium)
- [ ] Decide: Daily notification timing (end of workday? configurable?)
