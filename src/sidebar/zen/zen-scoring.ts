// Copyright (c) Artem Iagovdik. All rights reserved.
// Licensed under the MIT License.

import type { SeenItemEntry, SontoItem } from '../../shared/types';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
  'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
  'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us',
  'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'from', 'as', 'if', 'than',
  'so', 'very', 'just', 'now', 'then', 'here', 'there', 'up', 'out', 'down', 'off', 'over',
  'under', 'again', 'further', 'once', 'more', 'most', 'other', 'some', 'any', 'each',
  'few', 'much', 'many', 'all', 'both', 'either', 'neither', 'one', 'two', 'first',
  'last', 'good', 'new', 'old', 'great', 'high', 'small', 'different', 'large', 'next',
  'early', 'young', 'important', 'public', 'same', 'able', 'only', 'own', 'such',
]);

export interface ScoreContext {
  daySeed: number;
  seenItems: Record<string, SeenItemEntry>;
  dismissedItems: Record<string, SeenItemEntry>;
  sourceSignals: Record<string, number>;
  lastType?: string;
  zenifiedItems: SontoItem[];
}

export interface ScoredItem {
  id: string;
  source: string;
  contentType: string;
  score: number;
  freshnessBoost: number;
  noveltyBoost: number;
  diversityBoost: number;
  repeatPenalty: number;
  dismissalPenalty: number;
  seedNoise: number;
  isSurprise: boolean;
}

function getDaySeed(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const key = `${year}-${month}-${day}`;
  return hashString(key);
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export function calculateFreshnessBoost(seenAt: number | undefined): number {
  if (!seenAt) return 0;

  const hoursSinceSeen = (Date.now() - seenAt) / HOUR_MS;

  if (hoursSinceSeen < 1) return -2;
  if (hoursSinceSeen < 4) return -1.5;
  if (hoursSinceSeen < 12) return -1;
  if (hoursSinceSeen < 24) return -0.5;

  return Math.exp(-hoursSinceSeen / 48);
}

export function calculateNoveltyBoost(seenCount: number): number {
  if (seenCount === 0) return 0.5;
  if (seenCount === 1) return 0.2;
  return Math.max(0, 0.1 - (seenCount - 2) * 0.05);
}

export function calculateRepeatPenalty(seenAt: number | undefined): number {
  if (!seenAt) return 0;

  const hoursSinceSeen = (Date.now() - seenAt) / HOUR_MS;

  if (hoursSinceSeen < 1) return 3;
  if (hoursSinceSeen < 6) return 2;
  if (hoursSinceSeen < 24) return 1;

  return Math.exp(-hoursSinceSeen / 12) * 0.5;
}

export function calculateDismissalPenalty(
  dismissed: boolean | undefined,
  dismissedCount: number | undefined,
): number {
  if (!dismissed) return 0;

  const count = dismissedCount ?? 1;

  if (count === 1) return 0.5;
  if (count === 2) return 1;
  return Math.min(2, 0.5 + count * 0.3);
}

export function calculateDiversityBoost(
  contentType: string,
  lastType: string | undefined,
): number {
  if (!lastType) return 0;
  if (contentType === lastType) return -0.3;
  return 0.1;
}

export function generateSeedNoise(itemId: string, daySeed: number): number {
  const combinedSeed = hashString(itemId) + daySeed;
  return seededRandom(combinedSeed) * 0.12;
}

export function scoreCandidate(
  candidate: {
    id: string;
    source: string;
    contentType: string;
    seenAt?: number;
    dismissed?: boolean;
    dismissedCount?: number;
    sourceWeight?: number;
  },
  context: ScoreContext,
): ScoredItem {
  const { seenItems, dismissedItems, sourceSignals, lastType, daySeed } = context;

  const seenEntry = seenItems[candidate.id];
  const dismissedEntry = dismissedItems[candidate.id];

  const seenAt = seenEntry?.seenAt;
  const seenCount = seenEntry ? 1 : 0;

  const dismissed = dismissedEntry?.dismissed ?? false;
  const dismissedCount = dismissedEntry?.dismissedCount ?? 0;

  const baseSourceWeight = candidate.sourceWeight ?? 1;
  const signalBoost = sourceSignals[candidate.source] ?? 0;
  const sourceWeight = baseSourceWeight * (1 + Math.min(signalBoost, 12) * 0.15);

  const freshnessBoost = calculateFreshnessBoost(seenAt);
  const noveltyBoost = calculateNoveltyBoost(seenCount);
  const diversityBoost = calculateDiversityBoost(candidate.contentType, lastType);
  const repeatPenalty = calculateRepeatPenalty(seenAt);
  const dismissalPenalty = calculateDismissalPenalty(dismissed, dismissedCount);
  const seedNoise = generateSeedNoise(candidate.id, daySeed);

  const score =
    sourceWeight +
    freshnessBoost +
    noveltyBoost +
    diversityBoost -
    repeatPenalty -
    dismissalPenalty +
    seedNoise;

  return {
    id: candidate.id,
    source: candidate.source,
    contentType: candidate.contentType,
    score,
    freshnessBoost,
    noveltyBoost,
    diversityBoost,
    repeatPenalty,
    dismissalPenalty,
    seedNoise,
    isSurprise: false,
  };
}

export function selectWithSurprise<T>(
  items: T[],
  scorer: (item: T, index: number) => ScoredItem,
  surpriseProbability = 0.15,
): { selected: T; scoreInfo: ScoredItem; isSurprise: boolean } | null {
  if (items.length === 0) return null;

  const scored = items.map((item, idx) => ({
    item,
    scoreInfo: scorer(item, idx),
    originalIndex: idx,
  }));

  scored.sort((a, b) => b.scoreInfo.score - a.scoreInfo.score);

  const topCandidates = scored.slice(0, Math.min(5, scored.length));

  const isSurprise = Math.random() < surpriseProbability && scored.length > 3;

  if (isSurprise) {
    const surprisePool = scored.slice(Math.floor(scored.length * 0.3));
    const surpriseIdx = Math.floor(Math.random() * Math.min(surprisePool.length, 5));
    const surprise = surprisePool[surpriseIdx];
    if (surprise) {
      return {
        selected: surprise.item,
        scoreInfo: { ...surprise.scoreInfo, isSurprise: true },
        isSurprise: true,
      };
    }
  }

  const pickIdx = Math.floor(Math.random() * Math.min(topCandidates.length, 3));
  const pick = topCandidates[pickIdx];

  return {
    selected: pick.item,
    scoreInfo: pick.scoreInfo,
    isSurprise: false,
  };
}

export function createScoreContext(
  seenItems: Record<string, SeenItemEntry>,
  dismissedItems: Record<string, SeenItemEntry>,
  sourceSignals: Record<string, number>,
  lastType?: string,
  zenifiedItems: SontoItem[] = [],
): ScoreContext {
  return {
    daySeed: getDaySeed(),
    seenItems,
    dismissedItems,
    sourceSignals,
    lastType,
    zenifiedItems,
  };
}

export function extractKeywords(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
    .map((w) => w.replace(/(?:s|es|ing|ed)$/, ''));

  return new Set(words);
}

export function calculateKeywordMatch(
  text: string,
  keywords: Set<string>,
): number {
  const textKeywords = extractKeywords(text);
  const intersection = new Set([...textKeywords].filter((k) => keywords.has(k)));

  if (intersection.size === 0) return 0;

  const union = new Set([...textKeywords, ...keywords]);
  return intersection.size / union.size;
}

export function findBestKeywordMatch(
  candidates: SontoItem[],
  targetText: string,
  minScore = 0.1,
): SontoItem | null {
  const targetKeywords = extractKeywords(targetText);

  if (targetKeywords.size === 0) return null;

  let bestMatch: SontoItem | null = null;
  let bestScore = minScore;

  for (const candidate of candidates) {
    const textToMatch = [candidate.content, candidate.title ?? '', ...candidate.tags].join(' ');
    const score = calculateKeywordMatch(textToMatch, targetKeywords);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = candidate;
    }
  }

  return bestMatch;
}
