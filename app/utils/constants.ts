import { LLMManager } from '~/lib/modules/llm/manager';

const llmManager = LLMManager.getInstance();

export const DEFAULT_MODEL = 'gpt-4o';
export const DEFAULT_PROVIDER = llmManager.getDefaultProvider();

export const PROMPT_COOKIE_KEY = 'cachedPrompt';

export const PROVIDER_LIST = llmManager.getAllProviders();
