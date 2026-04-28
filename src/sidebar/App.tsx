import { useCallback, useEffect, useState } from "react";

import {
  BackgroundMessages,
  BackgroundTasks,
  ResponseStatus,
} from "../shared/types.ts";
import Chat from "./chat/Chat.tsx";
import SettingsHeader from "./components/SettingsHeader.tsx";
import { Button, Loader, Message, Slider } from "./theme";
import { formatBytes } from "./utils/format.ts";

enum AppStatus {
  IDLE,
  CHECKING,
  NEEDS_DOWNLOAD,
  DOWNLOADING,
  READY,
  ERROR,
}

export default function App() {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [modelSize, setModelSize] = useState<number>(0);
  const [downloadingModels, setDownloadingModels] = useState<
    Record<string, number>
  >({});

  const checkModels = useCallback(() => {
    setStatus(AppStatus.CHECKING);
    setError(null);
    chrome.runtime.sendMessage(
      { type: BackgroundTasks.CHECK_MODELS },
      (
        e:
          | {
              results: Array<{
                size: number;
                cached: boolean;
                modelId: string;
              }>;
              status: ResponseStatus.SUCCESS;
            }
          | {
              error: string;
              status: ResponseStatus.ERROR;
            }
      ) => {
        if (e.status === ResponseStatus.SUCCESS) {
          setModelSize(e.results.reduce((acc, model) => acc + model.size, 0));
          if (Boolean(e.results.find((r) => !r.cached))) {
            setStatus(AppStatus.NEEDS_DOWNLOAD);
          } else {
            setStatus(AppStatus.READY);
          }
        }
        if (e.status === ResponseStatus.ERROR) {
          setError(e.error);
          setStatus(AppStatus.ERROR);
        }
      }
    );
  }, []);

  useEffect(() => {
    const messageListener = (message: any) => {
      if (message.type === BackgroundMessages.DOWNLOAD_PROGRESS) {
        setDownloadingModels((prev) => ({
          ...prev,
          [message.modelId]: message.percentage,
        }));
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);
    checkModels();

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, [checkModels]);

  const appShellClassName = "h-full w-full flex flex-col overflow-hidden";
  const setupPanelClassName =
    "flex-1 min-h-0 overflow-y-auto bg-chrome-bg-primary px-6 py-6";
  const centeredSetupContentClassName =
    "min-h-full flex items-center justify-center flex-col gap-8";

  if (status === AppStatus.ERROR) {
    return (
      <div className={appShellClassName}>
        <SettingsHeader className="flex-shrink-0" onSettingsChanged={checkModels} />
        <div className={setupPanelClassName}>
          <div className={centeredSetupContentClassName}>
            <Message type="error" title="Setup error">
              {error}
            </Message>
          </div>
        </div>
      </div>
    );
  }

  if (status === AppStatus.IDLE || status === AppStatus.CHECKING) {
    return (
      <div className={appShellClassName}>
        <SettingsHeader className="flex-shrink-0" onSettingsChanged={checkModels} />
        <div className={setupPanelClassName}>
          <div className={centeredSetupContentClassName}>
            <Loader />
          </div>
        </div>
      </div>
    );
  }

  if (status === AppStatus.NEEDS_DOWNLOAD || status === AppStatus.DOWNLOADING) {
    return (
      <div className={appShellClassName}>
        <SettingsHeader className="flex-shrink-0" onSettingsChanged={checkModels} />
        <div className={setupPanelClassName}>
          <div className={centeredSetupContentClassName}>
            <div className="text-center max-w-md w-full">
              <h1 className="text-3xl font-normal text-chrome-text-primary mb-2">
                Download browser models
              </h1>
              <p className="text-sm text-chrome-text-secondary mb-6">
                Download the required in-browser models. In local API mode this is
                only the all-MiniLM embedding model used for website/history RAG.
              </p>
              <Button
                loading={status === AppStatus.DOWNLOADING}
                onClick={() => {
                  setStatus(AppStatus.DOWNLOADING);
                  chrome.runtime.sendMessage(
                    { type: BackgroundTasks.INITIALIZE_MODELS },
                    () => checkModels()
                  );
                }}
                className="w-full"
              >
                Download Models ({formatBytes(modelSize)})
              </Button>
            </div>
            <div className="w-full max-w-md flex flex-col gap-2 break-words overflow-wrap-anywhere">
              {Object.entries(downloadingModels).map(([id, progress]) => (
                <Slider
                  key={id}
                  text={`${id} (${progress.toFixed(0)}%)`}
                  width={progress}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={appShellClassName}>
      <SettingsHeader className="flex-shrink-0" onSettingsChanged={checkModels} />
      <main className="flex-1 min-h-0 overflow-y-auto bg-chrome-bg-primary">
        <Chat />
      </main>
    </div>
  );
}
