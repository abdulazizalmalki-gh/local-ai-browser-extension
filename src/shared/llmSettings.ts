import {
  TEXT_GENERATION_ID,
  isBrowserTextGenerationModel,
} from "./constants.ts";

export type LLMProvider = "transformers" | "openai-compatible";

export interface LLMSettings {
  provider: LLMProvider;
  inBrowserModelId: string;
  openAIBaseUrl: string;
  openAIModel: string;
  openAIApiKey: string;
  temperature: number;
  maxTokens: number;
}

export const LLM_SETTINGS_STORAGE_KEY = "llmSettings";

export const DEFAULT_LLM_SETTINGS: LLMSettings = {
  provider: "transformers",
  inBrowserModelId: "granite3B",
  openAIBaseUrl: "http://127.0.0.1:11434/v1",
  openAIModel: "granite-4.0-3b",
  openAIApiKey: "",
  temperature: 0,
  maxTokens: 1024,
};

export const normalizeLLMSettings = (
  value: Partial<LLMSettings> | undefined | null
): LLMSettings => {
  const normalized = {
    ...DEFAULT_LLM_SETTINGS,
    ...(value || {}),
    temperature:
      typeof value?.temperature === "number"
        ? value.temperature
        : DEFAULT_LLM_SETTINGS.temperature,
    maxTokens:
      typeof value?.maxTokens === "number"
        ? value.maxTokens
        : DEFAULT_LLM_SETTINGS.maxTokens,
  };

  if (!isBrowserTextGenerationModel(normalized.inBrowserModelId)) {
    normalized.inBrowserModelId = TEXT_GENERATION_ID;
  }

  return normalized;
};

export const getLLMSettings = async (): Promise<LLMSettings> => {
  const result = await chrome.storage.local.get([LLM_SETTINGS_STORAGE_KEY]);
  return normalizeLLMSettings(result[LLM_SETTINGS_STORAGE_KEY]);
};

export const saveLLMSettings = async (settings: LLMSettings): Promise<void> => {
  await chrome.storage.local.set({
    [LLM_SETTINGS_STORAGE_KEY]: normalizeLLMSettings(settings),
  });
};
