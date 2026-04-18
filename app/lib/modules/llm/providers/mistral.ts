import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createMistral } from '@ai-sdk/mistral';

export default class MistralProvider extends BaseProvider {
  name = 'Mistral';
  getApiKeyLink = 'https://console.mistral.ai/api-keys/';

  config = {
    apiTokenKey: 'MISTRAL_API_KEY',
  };

  staticModels: ModelInfo[] = [
    // Mistral Large 3 (2512): latest flagship
    { name: 'mistral-large-2512', label: 'Mistral Large 3', provider: 'Mistral', maxTokenAllowed: 131072, maxCompletionTokens: 16384 },
    // Mistral Large Latest: alias for latest large
    { name: 'mistral-large-latest', label: 'Mistral Large Latest', provider: 'Mistral', maxTokenAllowed: 131072, maxCompletionTokens: 16384 },
    // Mistral Medium 3 (2505): new mid-tier 2025
    { name: 'mistral-medium-2505', label: 'Mistral Medium 3', provider: 'Mistral', maxTokenAllowed: 131072, maxCompletionTokens: 16384 },
    // Mistral Small 3.2 (2506): cost-efficient 2025
    { name: 'mistral-small-2506', label: 'Mistral Small 3.2', provider: 'Mistral', maxTokenAllowed: 32768, maxCompletionTokens: 8192 },
    // Mistral Small Latest: alias
    { name: 'mistral-small-latest', label: 'Mistral Small Latest', provider: 'Mistral', maxTokenAllowed: 32768, maxCompletionTokens: 8192 },
    // Magistral Medium: reasoning model 2506
    { name: 'magistral-medium-2506', label: 'Magistral Medium', provider: 'Mistral', maxTokenAllowed: 40960, maxCompletionTokens: 16384 },
    // Magistral Small: reasoning model 2506
    { name: 'magistral-small-2506', label: 'Magistral Small', provider: 'Mistral', maxTokenAllowed: 40960, maxCompletionTokens: 16384 },
    // Devstral Medium: coding-focused 2507
    { name: 'devstral-medium-2507', label: 'Devstral Medium', provider: 'Mistral', maxTokenAllowed: 131072, maxCompletionTokens: 16384 },
    // Devstral Small: coding-focused 2505
    { name: 'devstral-small-2505', label: 'Devstral Small', provider: 'Mistral', maxTokenAllowed: 131072, maxCompletionTokens: 16384 },
    // Codestral: code generation
    { name: 'codestral-latest', label: 'Codestral', provider: 'Mistral', maxTokenAllowed: 262144, maxCompletionTokens: 16384 },
    // Ministral 8B: efficient small model
    { name: 'ministral-8b-latest', label: 'Ministral 8B', provider: 'Mistral', maxTokenAllowed: 131072, maxCompletionTokens: 8192 },
    // Open Mistral Nemo: open 12B model
    { name: 'open-mistral-nemo', label: 'Mistral Nemo', provider: 'Mistral', maxTokenAllowed: 128000, maxCompletionTokens: 8192 },
    // Legacy open models
    { name: 'open-mistral-7b', label: 'Mistral 7B', provider: 'Mistral', maxTokenAllowed: 32768, maxCompletionTokens: 8192 },
    { name: 'open-mixtral-8x7b', label: 'Mixtral 8x7B', provider: 'Mistral', maxTokenAllowed: 32768, maxCompletionTokens: 8192 },
    { name: 'open-mixtral-8x22b', label: 'Mixtral 8x22B', provider: 'Mistral', maxTokenAllowed: 65536, maxCompletionTokens: 8192 },
  ];

  getModelInstance(options: {
    model: string;
    serverEnv: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv, apiKeys, providerSettings } = options;

    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'MISTRAL_API_KEY',
    });

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    const mistral = createMistral({
      apiKey,
    });

    return mistral(model);
  }
}
