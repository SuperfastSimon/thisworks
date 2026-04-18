import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export default class OpenAIProvider extends BaseProvider {
  name = 'OpenAI';
  getApiKeyLink = 'https://platform.openai.com/api-keys';

  config = {
    apiTokenKey: 'OPENAI_API_KEY',
  };

  staticModels: ModelInfo[] = [
    // GPT-4o: 128k context, flagship multimodal
    { name: 'gpt-4o', label: 'GPT-4o', provider: 'OpenAI', maxTokenAllowed: 128000, maxCompletionTokens: 16384 },

    // GPT-4o Mini: 128k context, cost-effective
    { name: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'OpenAI', maxTokenAllowed: 128000, maxCompletionTokens: 16384 },

    // GPT-4.1: 1M context, latest generation
    { name: 'gpt-4.1', label: 'GPT-4.1', provider: 'OpenAI', maxTokenAllowed: 1047576, maxCompletionTokens: 32768 },

    // GPT-4.1 Mini: 1M context, faster/cheaper
    { name: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', provider: 'OpenAI', maxTokenAllowed: 1047576, maxCompletionTokens: 32768 },

    // GPT-4.1 Nano: 1M context, fastest/cheapest
    { name: 'gpt-4.1-nano', label: 'GPT-4.1 Nano', provider: 'OpenAI', maxTokenAllowed: 1047576, maxCompletionTokens: 32768 },

    // o3: 200k context, advanced reasoning
    { name: 'o3', label: 'o3', provider: 'OpenAI', maxTokenAllowed: 200000, maxCompletionTokens: 100000 },

    // o4-mini: 200k context, efficient reasoning
    { name: 'o4-mini', label: 'o4-mini', provider: 'OpenAI', maxTokenAllowed: 200000, maxCompletionTokens: 100000 },

    // o3-pro: 200k context, highest reasoning capability
    { name: 'o3-pro', label: 'o3-pro', provider: 'OpenAI', maxTokenAllowed: 200000, maxCompletionTokens: 100000 },

    // o1: 200k context, reasoning model
    { name: 'o1', label: 'o1', provider: 'OpenAI', maxTokenAllowed: 200000, maxCompletionTokens: 100000 },

    // o1-mini: 128k context, fast reasoning
    { name: 'o1-mini', label: 'o1-mini', provider: 'OpenAI', maxTokenAllowed: 128000, maxCompletionTokens: 65536 },

    // GPT-3.5-turbo: legacy, fast and cheap
    { name: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', provider: 'OpenAI', maxTokenAllowed: 16385, maxCompletionTokens: 4096 },
  ];

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv?: Record<string, string>,
  ): Promise<ModelInfo[]> {
    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: settings,
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'OPENAI_API_KEY',
    });

    if (!apiKey) {
      throw `Missing Api Key configuration for ${this.name} provider`;
    }

    const response = await fetch(`https://api.openai.com/v1/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const res = (await response.json()) as any;
    const staticModelIds = this.staticModels.map((m) => m.name);

    const data = res.data.filter(
      (model: any) =>
        model.object === 'model' &&
        (model.id.startsWith('gpt-') || model.id.startsWith('o') || model.id.startsWith('chatgpt-')) &&
        !staticModelIds.includes(model.id),
    );

    return data.map((m: any) => {
      let contextWindow = 32000;

      if (m.context_length) {
        contextWindow = m.context_length;
      } else if (m.id?.includes('gpt-4o') || m.id?.includes('gpt-4.1')) {
        contextWindow = 128000;
      } else if (m.id?.includes('gpt-4-turbo') || m.id?.includes('gpt-4-1106')) {
        contextWindow = 128000;
      } else if (m.id?.includes('gpt-4')) {
        contextWindow = 8192;
      } else if (m.id?.includes('gpt-3.5-turbo')) {
        contextWindow = 16385;
      }

      let maxCompletionTokens = 4096;

      if (m.id?.startsWith('o1-mini')) {
        maxCompletionTokens = 65536;
      } else if (m.id?.startsWith('o1') || m.id?.startsWith('o2') || m.id?.startsWith('o3') || m.id?.startsWith('o4')) {
        maxCompletionTokens = 100000;
      } else if (m.id?.includes('gpt-4o') || m.id?.includes('gpt-4.1')) {
        maxCompletionTokens = 16384;
      } else if (m.id?.includes('gpt-4')) {
        maxCompletionTokens = 8192;
      }

      return {
        name: m.id,
        label: `${m.id} (${Math.floor(contextWindow / 1000)}k context)`,
        provider: this.name,
        maxTokenAllowed: Math.min(contextWindow, 1047576),
        maxCompletionTokens,
      };
    });
  }

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
      defaultApiTokenKey: 'OPENAI_API_KEY',
    });

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    const openai = createOpenAI({
      apiKey,
    });

    return openai(model);
  }
}
