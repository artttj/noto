import { pipeline, type FeatureExtractionPipeline } from '@huggingface/transformers';
import { EMBEDDING_MODEL } from '../shared/constants';

let pipelineInstance: FeatureExtractionPipeline | null = null;

async function getPipeline(): Promise<FeatureExtractionPipeline> {
  if (!pipelineInstance) {
    pipelineInstance = await pipeline('feature-extraction', EMBEDDING_MODEL);
  }
  return pipelineInstance;
}

async function embed(text: string): Promise<number[]> {
  const extractor = await getPipeline();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data as Float32Array);
}

chrome.runtime.onMessage.addListener((message: { type: string; text?: string }, _sender, sendResponse) => {
  if (message.type !== 'SONTO_EMBED') return;

  embed(message.text ?? '')
    .then((embedding) => sendResponse({ ok: true, embedding }))
    .catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Embedding failed';
      sendResponse({ ok: false, error: msg });
    });

  return true;
});
