import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const read = (path) => readFileSync(join(root, path), "utf8");

test("Qwen is the default in-browser model for first-run downloads", () => {
  const constants = read("src/shared/constants.ts");
  const settings = read("src/shared/llmSettings.ts");

  assert.match(constants, /qwen3_1_7B:\s*{[\s\S]*modelId:\s*"onnx-community\/Qwen3-1\.7B-ONNX"/);
  assert.match(constants, /export const TEXT_GENERATION_ID = "qwen3_1_7B";/);
  assert.match(settings, /inBrowserModelId:\s*"qwen3_1_7B"/);
});

test("extension package, manifest, and browser title are model-agnostic", () => {
  const pkg = JSON.parse(read("package.json"));
  const manifest = JSON.parse(read("public/manifest.json"));
  const sidebarHtml = read("src/sidebar/index.html");

  const namingText = [
    pkg.name,
    pkg.description,
    manifest.name,
    manifest.description,
    sidebarHtml.match(/<title>(.*?)<\/title>/)?.[1] ?? "",
  ].join("\n");

  assert.doesNotMatch(namingText, /gemma/i);
  assert.match(manifest.name, /Local AI Browser Assistant/);
});
