import { useEffect, useState } from "react";

import {
  TEXT_GENERATION_MODEL_OPTIONS,
} from "../../shared/constants.ts";
import {
  DEFAULT_LLM_SETTINGS,
  LLMSettings,
  getLLMSettings,
  saveLLMSettings,
} from "../../shared/llmSettings.ts";
import { BackgroundTasks } from "../../shared/types.ts";
import { Button, InputSelect, InputText } from "../theme";
import cn from "../utils/classnames.ts";

interface SettingsHeaderProps {
  className?: string;
  onSettingsChanged?: () => void;
}

export default function SettingsHeader({
  className = "",
  onSettingsChanged = () => {},
}: SettingsHeaderProps) {
  const [settings, setSettings] = useState<LLMSettings>(DEFAULT_LLM_SETTINGS);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    getLLMSettings().then(setSettings);
  }, []);

  const update = <K extends keyof LLMSettings>(key: K, value: LLMSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setIsSaved(false);
  };

  const save = async () => {
    await saveLLMSettings(settings);
    chrome.runtime.sendMessage({ type: BackgroundTasks.LLM_SETTINGS_UPDATED });
    setIsSaved(true);
    onSettingsChanged();
  };

  return (
    <header
      className={cn(
        className,
        "border-b border-chrome-border bg-chrome-bg-primary px-6 py-4"
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-normal text-chrome-text-primary leading-tight">
            Local AI Browser Assistant
          </h1>
          <p className="text-sm text-chrome-text-secondary mt-1">
            {settings.provider === "openai-compatible"
              ? `OpenAI-compatible API: ${settings.openAIModel}`
              : `In-browser model: ${
                  TEXT_GENERATION_MODEL_OPTIONS.find(
                    (model) => model.id === settings.inBrowserModelId
                  )?.title || settings.inBrowserModelId
                }`}
            {" · embeddings stay in-browser with all-MiniLM"}
          </p>
        </div>
        <Button type="button" color="secondary" onClick={() => setIsOpen(!isOpen)}>
          AI Settings
        </Button>
      </div>

      {isOpen && (
        <div className="mt-4 grid grid-cols-1 gap-4 rounded-md border border-chrome-border bg-chrome-bg-secondary p-4">
          <InputSelect
            id="provider"
            label="LLM provider"
            value={settings.provider}
            onChange={(e) =>
              update(
                "provider",
                e.target.value as LLMSettings["provider"]
              )
            }
            options={[
              { value: "transformers", label: "In-browser Transformers.js" },
              {
                value: "openai-compatible",
                label: "Local OpenAI-compatible API",
              },
            ]}
          />

          {settings.provider === "transformers" ? (
            <InputSelect
              id="in-browser-model"
              label="In-browser chat model"
              value={settings.inBrowserModelId}
              onChange={(e) => update("inBrowserModelId", e.target.value)}
              options={TEXT_GENERATION_MODEL_OPTIONS.map((model) => ({
                value: model.id,
                label: `${model.title} — ${model.modelId}`,
              }))}
            />
          ) : (
            <>
              <InputText
                id="openai-base-url"
                label="OpenAI-compatible base URL"
                value={settings.openAIBaseUrl}
                onChange={(e) => update("openAIBaseUrl", e.target.value)}
                placeholder="http://127.0.0.1:11434/v1"
              />
              <InputText
                id="openai-model"
                label="Model name"
                value={settings.openAIModel}
                onChange={(e) => update("openAIModel", e.target.value)}
                placeholder="granite-4.0-3b"
              />
              <InputText
                id="openai-api-key"
                label="API key (optional)"
                type="password"
                value={settings.openAIApiKey}
                onChange={(e) => update("openAIApiKey", e.target.value)}
                placeholder="Leave empty for Ollama/LM Studio"
              />
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <InputText
              id="temperature"
              label="Temperature"
              type="number"
              min={0}
              max={2}
              step={0.1}
              value={settings.temperature}
              onChange={(e) => update("temperature", Number(e.target.value))}
            />
            <InputText
              id="max-tokens"
              label="Max tokens"
              type="number"
              min={1}
              max={8192}
              step={1}
              value={settings.maxTokens}
              onChange={(e) => update("maxTokens", Number(e.target.value))}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-chrome-text-secondary">
              Changing settings clears the current chat. OpenAI-compatible mode
              still uses in-browser all-MiniLM embeddings for page/history RAG.
            </p>
            <Button type="button" color="primary" onClick={save}>
              {isSaved ? "Saved" : "Save"}
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
