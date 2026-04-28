import { LLMSettings } from "../../shared/llmSettings.ts";
import { WebMCPTool } from "../agent/webMcp.tsx";
import {
  OpenAIChatMessage,
  buildOpenAIChatCompletionRequest,
  chatCompletionsUrl,
  extractOpenAIMessage,
  renderToolCallsForTextFallback,
} from "./openAICompatibleProviderCore.ts";

export interface OpenAICompatibleGenerationResult {
  text: string;
  promptTokens: number;
  generatedTokens: number;
}

export const generateWithOpenAICompatibleApi = async ({
  settings,
  messages,
  tools,
}: {
  settings: LLMSettings;
  messages: OpenAIChatMessage[];
  tools: WebMCPTool[];
}): Promise<OpenAICompatibleGenerationResult> => {
  const response = await fetch(chatCompletionsUrl(settings.openAIBaseUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(settings.openAIApiKey.trim()
        ? { Authorization: `Bearer ${settings.openAIApiKey.trim()}` }
        : {}),
    },
    body: JSON.stringify(
      buildOpenAIChatCompletionRequest({
        model: settings.openAIModel,
        messages,
        tools,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
      })
    ),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Local OpenAI-compatible API returned ${response.status}: ${body || response.statusText}`
    );
  }

  const json = await response.json();
  const extracted = extractOpenAIMessage(json);
  const renderedToolCalls = renderToolCallsForTextFallback(extracted.toolCalls);
  const text = [extracted.content, renderedToolCalls].filter(Boolean).join("\n");

  return {
    text,
    promptTokens: extracted.usage?.prompt_tokens ?? 0,
    generatedTokens: extracted.usage?.completion_tokens ?? 0,
  };
};
