import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

export default class GoogleProvider extends BaseProvider {
  name = 'Google';
  getApiKeyLink = 'https://aistudio.google.com/app/apikey';

  config = {
    apiTokenKey: 'GOOGLE_GENERATIVE_AI_API_KEY',
  };

  staticModels: ModelInfo[] = [
    // Gemini 2.5 Flash: 1M context, fast and capable 2025 model
    {
      name: 'gemini-2.5-flash',
      label: 'Gemini 2.5 Flash',
      provider: 'Google',
      maxTokenAllowed: 1048576,
      maxCompletionTokens: 65536,
    },
    // Gemini 2.5 Pro: 1M context, flagship 2025 model
    {
      name: 'gemini-2.5-pro',
      label: 'Gemini 2.5 Pro',
      provider: 'Google',
      maxTokenAllowed: 1048576,
      maxCompletionTokens: 65536,
    },
    // Gemini 2.5 Flash-Lite: 1M context, lightweight fast model
    {
      name: 'gemini-2.5-flash-lite',
      label: 'Gemini 2.5 Flash Lite',
      provider: 'Google',
      maxTokenAllowed: 1048576,
      maxCompletionTokens: 32768,
    },
    // Gemini 2.0 Flash: 1M context, stable previous gen
    {
      name: 'gemini-2.0-flash',
      label: 'Gemini 2.0 Flash',
      provider: 'Google',
      maxTokenAllowed: 1048576,
      maxCompletionTokens: 8192,
    },
    // Gemini 1.5 Pro: 2M context, stable fallback
    {
      name: 'gemini-1.5-pro',
      label: 'Gemini 1.5 Pro',
      provider: 'Google',
      maxTokenAllowed: 2000000,
      maxCompletionTokens: 8192,
    },
    // Gemini 1.5 Flash: 1M context, fast stable fallback
    {
      name: 'gemini-1.5-flash',
      label: 'Gemini 1.5 Flash',
      provider: 'Google',
      maxTokenAllowed: 1000000,
      maxCompletionTokens: 8192,
    },
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
      defaultApiTokenKey: 'GOOGLE_GENERATIVE_AI_API_KEY',
    });

    if (!apiKey) {
      throw `Missing Api Key configuration for ${this.name} provider`;
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
      headers: {
        ['Content-Type']: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models from Google API: ${response.status} ${response.statusText}`);
    }

    const res = (await response.json()) as any;

    if (!res.models || !Array.isArray(res.models)) {
      throw new Error('Invalid response format from Google API');
    }

    const staticModelIds = this.staticModels.map((m) => m.name);

    const data = res.models.filter((model: any) => {
      const modelName = model.name.replace('models/', '');
      const hasGoodTokenLimit = (model.outputTokenLimit || 0) > 8000;
      const isStable = !model.name.includes('exp') || model.name.includes('flash-exp');

      return hasGoodTokenLimit && isStable && !staticModelIds.includes(modelName);
    });

    return data.map((m: any) => {
      const modelName = m.name.replace('models/', '');

      let contextWindow = 32000;

      if (m.inputTokenLimit && m.outputTokenLimit) {
        contextWindow = m.inputTokenLimit;
      } else if (modelName.includes('gemini-1.5-pro')) {
        contextWindow = 2000000;
      } else if (modelName.includes('gemini-1.5-flash')) {
        contextWindow = 1000000;
      } else if (modelName.includes('gemini-2.0-flash') || modelName.includes('gemini-2.5')) {
        contextWindow = 1000000;
      } else if (modelName.includes('gemini-pro')) {
        contextWindow = 32000;
      }

      const maxAllowed = 2000000;
      const finalContext = Math.min(contextWindow, maxAllowed);

      let completionTokens = 8192;

      if (m.outputTokenLimit && m.outputTokenLimit > 0) {
        completionTokens = Math.min(m.outputTokenLimit, 65536);
      }

      return {
        name: modelName,
        label: `${m.displayName} (${finalContext >= 1000000 ? Math.floor(finalContext / 1000000) + 'M' : Math.floor(finalContext / 1000) + 'k'} context)`,
        provider: this.name,
        maxTokenAllowed: finalContext,
        maxCompletionTokens: completionTokens,
      };
    });
  }

  getModelInstance(options: {
    model: string;
    serverEnv: any;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv, apiKeys, providerSettings } = options;

    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'GOOGLE_GENERATIVE_AI_API_KEY',
    });

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    const google = createGoogleGenerativeAI({
      apiKey,
    });

    return google(model);
  }
}
