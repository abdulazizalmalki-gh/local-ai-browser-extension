import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const read = (path) => readFileSync(join(root, path), "utf8");

test("setup and download screens use flex remaining height with scrolling instead of overflowing below the sidebar", () => {
  const app = read("src/sidebar/App.tsx");

  assert.match(app, /<SettingsHeader[^>]*className="flex-shrink-0"/);
  assert.match(app, /className="flex-1 min-h-0 overflow-y-auto/);
  assert.doesNotMatch(app, /justify-center h-full w-full flex-col gap-8 px-6/);
});

test("download progress rows can wrap long model ids in narrow side panel widths", () => {
  const app = read("src/sidebar/App.tsx");

  assert.match(app, /break-words/);
  assert.match(app, /overflow-wrap-anywhere/);
});
