import type { AppSettings } from './types';

export const STORAGE_KEYS = {
  SETTINGS: 'sonto_settings',
  OPENAI_KEY: 'sonto_openai_key',
  GEMINI_KEY: 'sonto_gemini_key',
} as const;

export const PROVIDER_MODELS: Record<string, string[]> = {
  openai: ['gpt-4o-mini', 'gpt-4.1-mini', 'gpt-4.1'],
  gemini: ['gemini-2.5-flash', 'gemini-2.5-pro'],
};

export const DEFAULT_SETTINGS: AppSettings = {
  llmProvider: 'openai',
  openaiModel: 'gpt-4.1-mini',
  geminiModel: 'gemini-2.5-flash',
  language: 'en',
};

export const MAX_CAPTURE_CHARS = 10000;
export const REQUEST_TIMEOUT_MS = 30000;
export const SEARCH_TOP_K = 10;
export const DB_NAME = 'sonto_db';
export const DB_VERSION = 2;
export const STORE_NAME = 'snippets';
