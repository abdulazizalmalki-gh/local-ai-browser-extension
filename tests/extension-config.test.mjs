import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const read = (path) => readFileSync(join(root, path), "utf8");

test("Granite is the default in-browser model for first-run downloads", () => {
  const constants = read("src/shared/constants.ts");
  const settings = read("src/shared/llmSettings.ts");

  assert.match(constants, /granite3B:\s*{[\s\S]*modelId:\s*"onnx-community\/granite-4\.0-micro-ONNX-web"/);
  assert.match(constants, /export const TEXT_GENERATION_ID = "granite3B";/);
  assert.match(settings, /inBrowserModelId:\s*"granite3B"/);
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
