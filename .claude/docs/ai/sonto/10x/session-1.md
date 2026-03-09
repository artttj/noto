# 10x Analysis: Sonto Chrome Extension
Session 1 | Date: 2026-03-09

## Current Value

Sonto is a Chrome sidebar extension that turns your browsing into a personal knowledge base. You highlight text, it embeds and stores it locally. You browse history, it syncs and embeds that too. Then you can semantically search your saved knowledge or ask questions via RAG chat.

On top of that, there's a calm ambient feed (Zen mode) that shows art, facts, quotes, and news from 13 sources — tuned to your interests via LLM-extracted categories from your browsing.

Everything stays local. No cloud. No accounts. Bring your own API key.

**Who uses it:** Knowledge workers, curious people, researchers who read a lot and want to recall what they've read. People who want a calmer new tab / sidebar experience.

**Core actions:** Capture text, search saved knowledge, ask questions, passively absorb curated content.

## The Question

What would make this 10x more valuable?

---

## Massive Opportunities

### 1. Knowledge Graph + Connections
**What**: Automatically detect relationships between snippets. When you save something about "spaced repetition," link it to your older snippet about "memory consolidation." Build a visual graph of your knowledge over time.
**Why 10x**: Right now snippets are isolated dots. Connected knowledge is exponentially more useful than disconnected notes. This turns Sonto from a storage tool into a thinking tool.
**Unlocks**: "Show me everything connected to this idea." Serendipitous rediscovery. Pattern recognition across months of reading.
**Effort**: High
**Risk**: Graph visualization is hard to get right. Could feel gimmicky if connections are low quality.
**Score**: 🔥

### 2. Cross-Device Sync (Encrypted, Zero-Knowledge)
**What**: Optional encrypted sync via user's own storage (Google Drive, iCloud, S3, or a simple relay). Zero-knowledge — server never sees plaintext.
**Why 10x**: Local-only is a feature AND a limitation. People read on multiple devices. Losing your knowledge base when you switch laptops is a dealbreaker for heavy users.
**Unlocks**: Phone companion app. Work + personal laptop continuity. True second brain that follows you.
**Effort**: Very High
**Risk**: Encryption adds complexity. Sync conflicts. Mobile Chrome doesn't support extensions (would need separate app).
**Score**: 👍

### 3. Shared Knowledge Spaces
**What**: Create a shared space with a team or friend. Everyone's captures feed into a collective knowledge base. Ask questions against the group's combined reading.
**Why 10x**: Individual knowledge tools plateau. Shared knowledge compounds. A research team sharing their reading creates value none of them could alone.
**Unlocks**: Team onboarding ("ask the team brain"), book clubs, research groups, couples sharing articles.
**Effort**: Very High
**Risk**: Requires some server component. Privacy concerns. Conflicts with local-first philosophy.
**Score**: 🤔

### 4. Active Reading Assistant
**What**: While reading a long article, Sonto detects the page content and offers contextual actions: "This contradicts something you saved 3 months ago," "You've read 4 articles about this topic — here's what you know so far," "This claim is disputed — here's a counter-argument from your saves."
**Why 10x**: Moves from passive capture to active intellectual partnership. Nobody else does this well. It's the difference between a filing cabinet and a research assistant.
**Unlocks**: Critical thinking aid. Faster synthesis. Users start reading differently because they have context.
**Effort**: High
**Risk**: Intrusive if not done right. Needs to be subtle and opt-in. LLM latency could break the reading flow.
**Score**: 🔥

---

## Medium Opportunities

### 1. Weekly Digest / Reflection
**What**: Every Sunday, generate a personal digest: "This week you saved 12 snippets across 4 topics. Your biggest theme was X. Here's a surprising connection between Y and Z. One thing worth revisiting: [snippet from 3 weeks ago]."
**Why 10x**: Capture without reflection is hoarding. This closes the loop. It's the feature that makes people feel like Sonto actually understands them.
**Impact**: Turns casual users into committed users. Creates a weekly ritual. Makes the knowledge base feel alive.
**Effort**: Medium
**Score**: 🔥

### 2. Smart Resurfacing in Zen Feed
**What**: Mix user's own past snippets into the Zen feed. "3 weeks ago you saved this..." with context about why it's relevant now (connected to recent reading, trending topic, etc).
**Why 10x**: The Zen feed currently shows external content only. Your own knowledge is the most valuable content. Spaced repetition meets ambient discovery.
**Impact**: Users rediscover their own saves without searching. Creates "aha" moments. Makes the feed personal in a way no other tool matches.
**Effort**: Medium
**Score**: 🔥

### 3. Quick Capture Enhancements
**What**: Capture images, screenshots, annotations (highlight + note), and page snapshots (reader-mode extraction of full articles). Tag captures with custom labels.
**Why 10x**: Text-only capture limits what you can save. Half of what's interesting on the web is visual. And "save without context" leads to snippets you can't remember why you saved.
**Impact**: More captures = richer knowledge base = better RAG answers = more value.
**Effort**: Medium
**Score**: 👍

### 4. Export & Interop
**What**: Export your knowledge base to Markdown, Obsidian, Notion, Logseq, Anki. Import from bookmarks, Pocket, Instapaper.
**Why 10x**: People won't commit to a knowledge tool that's a dead end. Import lowers the barrier. Export eliminates lock-in anxiety.
**Impact**: Unlocks users who are already invested in other tools. "I'll try Sonto because I can always leave."
**Effort**: Medium
**Score**: 👍

### 5. Semantic Bookmarks
**What**: Replace Chrome's bookmark system. Every bookmarked page gets auto-summarized and embedded. Search bookmarks by meaning, not just title. "That article about how trees communicate underground" actually finds it.
**Why 10x**: Chrome bookmarks are broken — everyone has hundreds they never revisit because search is title-only. Sonto already has the embedding pipeline. This is a natural extension.
**Impact**: Solves a universal pain point. Could be the gateway feature that gets people to install Sonto.
**Effort**: Medium
**Score**: 🔥

### 6. Programmable Zen Sources via API
**What**: Let users add any JSON/API endpoint as a Zen source, not just RSS. Provide a simple schema: `{ text, image?, link?, attribution? }`. Community-shared source configs.
**Why 10x**: 13 hardcoded sources can't match everyone's interests. Let power users wire in NASA APOD, Arxiv abstracts, Wikipedia random, stock alerts, weather poetry — anything.
**Impact**: Turns Zen from "our curation" to "your curation." Power users become evangelists.
**Effort**: Medium
**Score**: 👍

---

## Small Gems

### 1. "Why Did I Save This?" — Auto-Context on Capture
**What**: When capturing, auto-extract 1-2 sentences of surrounding context from the page. Store alongside the snippet so you remember the context later.
**Why powerful**: Snippets without context become mysterious in 2 weeks. This tiny addition makes every saved snippet 3x more useful when you find it later.
**Effort**: Low
**Score**: 🔥

### 2. Keyboard-First Quick Search
**What**: `Alt+Shift+F` opens a floating search bar (like Spotlight/Alfred) over any page. Type a question, get instant results from your knowledge base without opening the sidebar.
**Why powerful**: Opening the sidebar, switching to Browse/Chat, typing a query — too many steps. One shortcut to search your brain changes how often people reach for Sonto.
**Effort**: Low
**Score**: 🔥

### 3. "Save This Page" One-Click
**What**: Click the extension icon (or shortcut) to auto-extract and save the page's main content (article text, not nav/ads). No highlighting needed.
**Why powerful**: Highlighting specific text is high-friction. Most of the time you just want to save "this article." Reader-mode extraction + one click.
**Effort**: Low
**Score**: 🔥

### 4. Snippet Count Badge
**What**: Show badge on extension icon: number of snippets from current domain. Click to see them. "You've saved 7 things from this site."
**Why powerful**: Ambient awareness of your relationship with a site. Creates a collecting instinct. Zero-effort feature that makes the extension feel alive.
**Effort**: Low
**Score**: 👍

### 5. Pin Favorite Zen Bubbles
**What**: Heart/pin a bubble in Zen feed to prevent it from fading out. Pinned items collect in a "Favorites" section accessible from Browse.
**Why powerful**: The feed is ephemeral by design, but sometimes you see something you want to keep. Right now, you lose it. One button bridges ambient discovery and permanent collection.
**Effort**: Low
**Score**: 🔥

### 6. Dark/Light Theme Toggle
**What**: Add a theme toggle. Currently the sidebar is dark-only.
**Why powerful**: Some people browse in light mode. A dark sidebar next to a white page is jarring. Theme mismatch is a real reason people close sidebars.
**Effort**: Low
**Score**: 👍

### 7. "Read Later" Queue
**What**: Save a URL to a read-later list without capturing content. When you open it later, Sonto auto-captures the content.
**Why powerful**: Different intent than "save this text." Sometimes you find something but don't have time to read it. Simple queue with auto-capture on read.
**Effort**: Low
**Score**: 👍

### 8. Chat Conversation History
**What**: Persist chat conversations so you can revisit past Q&A sessions.
**Why powerful**: Currently chat resets. If you had a great RAG answer last week, it's gone. Persistence makes chat a knowledge artifact, not a throwaway interaction.
**Effort**: Low
**Score**: 👍

---

## Recommended Priority

### Do Now (Quick wins, ship this week)
1. **"Why Did I Save This?" auto-context** — Surrounding text on capture. Makes every snippet permanently more useful.
2. **Pin favorite Zen bubbles** — One button, bridges ephemeral feed to permanent saves. Users will love this.
3. **"Save This Page" one-click** — Reader-mode extraction on icon click. Removes the biggest friction in the capture flow.
4. **Keyboard quick search** — `Alt+Shift+F` floating search. Changes how often people use Sonto from "sometimes" to "constantly."

### Do Next (High leverage, next 2-4 weeks)
1. **Smart resurfacing in Zen feed** — Mix in user's own past snippets. This is the single feature that makes Sonto feel like YOUR tool, not just a news reader.
2. **Weekly digest** — Close the capture-reflect loop. Creates a ritual. Makes the knowledge base feel alive.
3. **Semantic bookmarks** — Solve a universal Chrome pain point. Could be the viral hook.

### Explore (Strategic bets, worth investigating)
1. **Knowledge graph + connections** — Transforms Sonto from storage to thinking tool. Hard to build well, but the upside is enormous. Start with simple "related snippets" before going full graph.
2. **Active reading assistant** — The most ambitious idea here. If done right, it's genuinely a new category. Start with a simple "you've read about this before" nudge on pages related to saved content.
3. **Export & interop** — Obsidian/Notion export removes commitment anxiety. Import from Pocket/bookmarks bootstraps the knowledge base.

### Backlog (Good but not now)
1. **Cross-device sync** — Important eventually, but the product needs to prove its value on one device first.
2. **Shared knowledge spaces** — Compelling but conflicts with local-first DNA. Revisit when there's demand.
3. **Programmable Zen sources** — Power user feature. Current 13 sources + custom RSS covers most people.
4. **Dark/light theme** — Quality of life, not game-changing. Do it when polishing.
5. **Chat history persistence** — Nice to have. Do it alongside the weekly digest work.
6. **Read later queue** — Useful but overlaps with existing browser features.

---

## The Big Insight

Sonto's capture pipeline is solid. The Zen feed is genuinely unique. But the gap is between capture and retrieval. Right now:

**Capture → black hole → manual search**

The 10x move is filling that gap with intelligence:

**Capture → connections → resurfacing → reflection → insight**

The features that matter most are the ones that bring your knowledge BACK to you without you asking: resurfacing in the feed, weekly digests, "you've read about this" nudges, related snippet suggestions. That's what turns a tool into a companion.

---

## Questions

### Answered
- **Q**: What AI providers are supported? **A**: OpenAI (gpt-4o-mini, gpt-4.1-mini, gpt-4.1) and Gemini (2.5-flash, 2.5-pro). BYOK model.
- **Q**: Is there any server component? **A**: No. Fully client-side. API calls go directly to OpenAI/Gemini from the extension.
- **Q**: How many Zen sources exist? **A**: 13 fetchers (HN, Reddit, 3 museums, Mars rover, RSS feeds, proverbs, haiku, oblique strategies, philosophy, Smithsonian, Atlas Obscura) plus custom RSS and LLM-generated facts as fallback.

### Blockers
- **Q**: What's the current user base size? Would help prioritize viral/growth features vs. retention features.
- **Q**: Any analytics on which features get used most? (Zen vs Browse vs Chat split)
- **Q**: Is there appetite for any server-side component, or is local-only a hard constraint?
- **Q**: What's the release cadence? Weekly? Monthly? Helps calibrate "Do Now" vs "Do Next."

## Next Steps
- [ ] Validate: Do users actually revisit their saved snippets? (If not, resurfacing is even more critical)
- [ ] Prototype: Smart resurfacing — mix 1 in 5 Zen bubbles from user's own saves
- [ ] Prototype: Floating quick search bar
- [ ] Research: Reader-mode content extraction (Readability.js or similar)
- [ ] Decide: Knowledge graph scope — start with "related snippets" panel or go bigger?
