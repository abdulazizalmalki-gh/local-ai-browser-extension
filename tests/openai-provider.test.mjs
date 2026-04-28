import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

async function importTs(path) {
  const source = readFileSync(path, "utf8");
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const dir = mkdtempSync(join(tmpdir(), "openai-provider-test-"));
  const out = join(dir, "module.mjs");
  writeFileSync(out, result.outputText);
  return import(pathToFileURL(out));
}

const core = await importTs(new URL("../src/background/llm/openAICompatibleProviderCore.ts", import.meta.url));

test("buildOpenAIChatCompletionRequest sends model, messages, generation options, and tools", () => {
  const request = core.buildOpenAIChatCompletionRequest({
    model: "qwen-local",
    messages: [{ role: "user", content: "Open example.com" }],
    tools: [
      {
        name: "open_url",
        description: "Open a URL",
        inputSchema: {
          type: "object",
          properties: { url: { type: "string", description: "URL" } },
          required: ["url"],
        },
      },
    ],
    temperature: 0.2,
    maxTokens: 128,
  });

  assert.equal(request.model, "qwen-local");
  assert.deepEqual(request.messages, [{ role: "user", content: "Open example.com" }]);
  assert.equal(request.temperature, 0.2);
  assert.equal(request.max_tokens, 128);
  assert.equal(request.stream, false);
  assert.equal(request.tools[0].type, "function");
  assert.equal(request.tools[0].function.name, "open_url");
});

test("normalizeOpenAIBaseUrl trims slashes and appends /chat/completions", () => {
  assert.equal(
    core.chatCompletionsUrl("http://127.0.0.1:11434/v1/"),
    "http://127.0.0.1:11434/v1/chat/completions"
  );
});

test("extractOpenAIMessage handles native tool calls and text content", () => {
  const message = core.extractOpenAIMessage({
    choices: [
      {
        message: {
          content: "I will open it.",
          tool_calls: [
            {
              id: "call_1",
              type: "function",
              function: { name: "open_url", arguments: "{\"url\":\"https://example.com\"}" },
            },
          ],
        },
      },
    ],
  });

  assert.equal(message.content, "I will open it.");
  assert.equal(message.toolCalls[0].name, "open_url");
  assert.deepEqual(message.toolCalls[0].arguments, { url: "https://example.com" });
});
