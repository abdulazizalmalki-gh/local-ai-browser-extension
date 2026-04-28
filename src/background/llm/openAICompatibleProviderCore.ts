import type { WebMCPTool } from "../agent/webMcp.tsx";

export type OpenAIChatRole = "system" | "user" | "assistant" | "tool";

export interface OpenAIChatMessage {
  role: OpenAIChatRole;
  content: string;
  tool_call_id?: string;
  name?: string;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string | Record<string, any> };
  }>;
}

export interface OpenAIRequestParams {
  model: string;
  messages: OpenAIChatMessage[];
  tools: WebMCPTool[];
  temperature: number;
  maxTokens: number;
}

export interface ExtractedOpenAIMessage {
  content: string;
  toolCalls: Array<{
    id: string;
    name: string;
    arguments: Record<string, any>;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export const chatCompletionsUrl = (baseUrl: string): string => {
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  if (trimmed.endsWith("/chat/completions")) return trimmed;
  return `${trimmed}/chat/completions`;
};

export const buildOpenAIChatCompletionRequest = ({
  model,
  messages,
  tools,
  temperature,
  maxTokens,
}: OpenAIRequestParams) => ({
  model,
  messages,
  tools: tools.map((tool) => ({
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
    },
  })),
  tool_choice: "auto",
  temperature,
  max_tokens: maxTokens,
  stream: false,
});

const parseToolArguments = (value: unknown): Record<string, any> => {
  if (!value) return {};
  if (typeof value === "object") return value as Record<string, any>;
  if (typeof value !== "string") return {};

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

export const renderToolCallsForTextFallback = (
  toolCalls: ExtractedOpenAIMessage["toolCalls"]
): string =>
  toolCalls
    .map(
      ({ name, arguments: args }) =>
        `<|tool_call>call:${name}${JSON.stringify(args)}<tool_call|>`
    )
    .join("");

export const extractOpenAIMessage = (response: any): ExtractedOpenAIMessage => {
  const choice = response?.choices?.[0];
  const message = choice?.message || {};
  const content = typeof message.content === "string" ? message.content : "";
  const rawToolCalls = Array.isArray(message.tool_calls)
    ? message.tool_calls
    : [];

  const toolCalls = rawToolCalls
    .map((toolCall: any, index: number) => {
      const name = toolCall?.function?.name;
      if (typeof name !== "string" || !name.trim()) return null;

      return {
        id:
          typeof toolCall.id === "string" && toolCall.id.trim()
            ? toolCall.id
            : `call_${index}`,
        name,
        arguments: parseToolArguments(toolCall?.function?.arguments),
      };
    })
    .filter(Boolean) as ExtractedOpenAIMessage["toolCalls"];

  return {
    content,
    toolCalls,
    usage: response?.usage,
  };
};
