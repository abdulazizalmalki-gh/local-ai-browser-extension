# Local AI Browser Assistant – Privacy Policy

Last updated: April 29, 2026

## Data Collection

Local AI Browser Assistant does not collect, store, or transmit any personal data to third parties. The extension does not contain analytics, telemetry, or tracking scripts.

## How Your Data Is Used

- **In-browser AI:** When using the built-in local model, all processing happens entirely within your browser. No data leaves your device.
- **OpenAI-compatible APIs:** When you configure an external API endpoint (e.g., vLLM, Ollama, or other OpenAI-compatible servers), your chat messages, webpage content, and tool call data are sent to that endpoint. We have no control over or access to data once it reaches your configured server. You are responsible for reviewing the privacy practices of any third-party service you connect.
- **Local storage:** Chat history, settings, and embeddings are stored locally in your browser using Chrome storage APIs. This data never leaves your device unless you explicitly share it.

## Permissions Explained

- **sidePanel, storage:** To display the AI assistant panel and save your settings and chat history locally.
- **scripting, tabs:** To read the content of the current webpage so the AI can answer questions about what you're viewing.
- **host_permissions (http://*, https://*):** Required to make API requests to the OpenAI-compatible endpoint you configure. These are only used when you explicitly set an API URL.

## Data Retention and Deletion

All locally stored data (chat history, settings, embeddings) can be deleted at any time from the extension settings or by uninstalling the extension.

## Contact

For questions about this policy, contact the developer via [GitHub](https://github.com/abdulazizalmalki-gh).
