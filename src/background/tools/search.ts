import { WebMCPTool } from "../agent/webMcp.tsx";

export const googleSearchTool: WebMCPTool = {
  name: "google_search",
  description:
    "Perform a Google search by opening a new browser tab with the search results",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "The search query to look up on Google",
      },
      active: {
        type: "boolean",
        description: "Whether the new tab should become active (default: true)",
        default: true,
      },
    },
    required: ["query"],
  },
  execute: async (args) => {
    const query = args.query as string;
    const active = args.active !== undefined ? (args.active as boolean) : true;

    if (!query || typeof query !== "string") {
      return `Error: query parameter must be a non-empty string. Received: ${JSON.stringify(args)}`;
    }

    try {
      const encodedQuery = encodeURIComponent(query);
      const searchUrl = `https://www.google.com/search?q=${encodedQuery}`;

      const tab = await chrome.tabs.create({
        url: searchUrl,
        active,
      });

      return `Successfully opened Google search for "${query}" in tab ${tab.id}`;
    } catch (error) {
      return `Error performing Google search: ${error.toString()}`;
    }
  },
};
