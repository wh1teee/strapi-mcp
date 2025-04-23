import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: "test-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

// Add a simple tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "hello_world",
        description: "A simple hello world tool",
        inputSchema: {
          type: "object",
          properties: {}
        }
      }
    ]
  };
});

async function main() {
  console.error("[Setup] Starting Test MCP server");
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[Setup] Test MCP server running");
}

main().catch((error) => {
  console.error("[Error] Server error:", error);
  process.exit(1);
}); 