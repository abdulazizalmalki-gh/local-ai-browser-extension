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

export const generateWithOpenAICompatibleApiStream = async ({
  settings,
  messages,
  tools,
  onToken,
  onDone,
}: {
  settings: LLMSettings;
  messages: OpenAIChatMessage[];
  tools: WebMCPTool[];
  onToken: (token: string) => void;
  onDone?: (result: OpenAICompatibleGenerationResult) => void;
}): Promise<OpenAICompatibleGenerationResult> => {
  const body = buildOpenAIChatCompletionRequest({
    model: settings.openAIModel,
    messages,
    tools,
    temperature: settings.temperature,
    maxTokens: settings.maxTokens,
  });
  body.stream = true;

  const response = await fetch(chatCompletionsUrl(settings.openAIBaseUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...(settings.openAIApiKey.trim()
        ? { Authorization: `Bearer ${settings.openAIApiKey.trim()}` }
        : {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Local OpenAI-compatible API returned ${response.status}: ${text || response.statusText}`
    );
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Response body is null — streaming not supported");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  let streamDone = false;
  let seenData = false;
  // Timeout after receiving first token: if no data for 60s, assume stream is stuck
  let lastTokenTime = 0;
  const STALE_TIMEOUT = 60_000;

  // Accumulate tool call deltas by index for merging across chunks
  const toolCallChunks: Array<{
    id: string;
    name: string;
    arguments: string;
  }> = [];

  while (!streamDone) {
    try {
      const readResult = await Promise.race([
        reader.read(),
        // Abort if stuck (no data for too long after we started receiving)
        new Promise<never>((_, reject) => {
          if (seenData && Date.now() - lastTokenTime > STALE_TIMEOUT) {
            reject(new Error("Stream timed out — no data received"));
          } else {
            setTimeout(() => {}, STALE_TIMEOUT);
          }
        }),
      ]);

      const { value, done } = readResult as { value: Uint8Array | undefined; done: boolean };
      streamDone = done;

      if (value && value.length > 0) {
        lastTokenTime = Date.now();
        buffer += decoder.decode(value, { stream: !done });

        // Split on SSE line boundaries
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;

          seenData = true;
          const data = trimmed.slice(6);
          if (data === "[DONE]") continue;

          try {
            const json = JSON.parse(data);
            const delta = json?.choices?.[0]?.delta;
            if (!delta) continue;

            // Handle text content tokens
            if (typeof delta.content === "string" && delta.content.length > 0) {
              fullText += delta.content;
              onToken(delta.content);
            }

            // Handle tool call delta chunks (vLLM sends these as delta.tool_calls)
            if (Array.isArray(delta.tool_calls)) {
              for (const tc of delta.tool_calls) {
                const idx = tc.index ?? 0;
                if (!toolCallChunks[idx]) {
                  toolCallChunks[idx] = {
                    id: tc.id ?? `call_${idx}`,
                    name: "",
                    arguments: "",
                  };
                }
                if (tc.id) toolCallChunks[idx].id = tc.id;
                if (tc.function?.name) toolCallChunks[idx].name += tc.function.name;
                if (tc.function?.arguments) {
                  toolCallChunks[idx].arguments += tc.function.arguments;
                }
              }
            }

            // vLLM sends usage at the top level of the final chunk
            if (json?.usage) {
              // Render any accumulated tool calls as text
              if (toolCallChunks.length > 0) {
                const rendered = renderAccumulatedToolCalls(toolCallChunks);
                if (rendered) {
                  fullText += rendered;
                  onToken(rendered);
                }
              }
              const result: OpenAICompatibleGenerationResult = {
                text: fullText,
                promptTokens: json.usage.prompt_tokens ?? 0,
                generatedTokens: json.usage.completion_tokens ?? 0,
              };
              onDone?.(result);
              return result;
            }
          } catch {
            // Skip malformed SSE frames
          }
        }
      }
    } catch (err) {
      console.warn("[OpenAI Stream]", err);
      break;
    }
  }

  // Render any remaining tool calls on stream close
  if (toolCallChunks.length > 0) {
    const rendered = renderAccumulatedToolCalls(toolCallChunks);
    if (rendered) {
      fullText += rendered;
      onToken(rendered);
    }
  }

  // If usage was never sent, estimate
  const result: OpenAICompatibleGenerationResult = {
    text: fullText,
    promptTokens: 0,
    generatedTokens: Math.ceil(fullText.length / 4),
  };
  onDone?.(result);
  return result;
};

function renderAccumulatedToolCalls(
  chunks: Array<{ id: string; name: string; arguments: string }>
): string {
  const toolCalls = chunks
    .filter((tc) => tc.name.trim())
    .map((tc) => {
      let parsedArgs: Record<string, any> = {};
      try { parsedArgs = JSON.parse(tc.arguments); } catch {}
      return { id: tc.id, name: tc.name, arguments: parsedArgs };
    });
  return renderToolCallsForTextFallback(toolCalls);
}
