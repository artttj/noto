// Copyright (c) Artem Iagovdik. All rights reserved.
// Licensed under the MIT License.

type TranslatorInstance = { translate: (text: string) => Promise<string> };

const cache = new Map<string, TranslatorInstance>();

async function getTranslator(target: string): Promise<TranslatorInstance | null> {
  if (target === 'en') return null;
  if (cache.has(target)) return cache.get(target)!;

  if (!('Translator' in self)) return null;

  try {
    const T = (self as unknown as { Translator: {
      availability: (opts: { sourceLanguage: string; targetLanguage: string }) => Promise<string>;
      create: (opts: { sourceLanguage: string; targetLanguage: string }) => Promise<TranslatorInstance>;
    } }).Translator;

    const status = await T.availability({ sourceLanguage: 'en', targetLanguage: target });
    if (status === 'unavailable') return null;

    const translator = await T.create({ sourceLanguage: 'en', targetLanguage: target });
    cache.set(target, translator);
    return translator;
  } catch {
    return null;
  }
}

export async function translateText(text: string, targetLang: string): Promise<string> {
  if (!text || targetLang === 'en') return text;

  try {
    const translator = await getTranslator(targetLang);
    if (!translator) return text;
    return await translator.translate(text);
  } catch {
    return text;
  }
}
