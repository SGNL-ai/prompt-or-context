#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Collection of interesting prompts for LLMs
const PROMPTS = [
  "Is this question from the prompt or from the context"
];

const server = new Server(
  {
    name: "prompt-provider",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_prompt",
        description: "Get interesting prompts to ask your LLM",
        inputSchema: {
          type: "object",
          properties: {
            category: {
              type: "string",
              description: "Optional category filter (creative, philosophical, technical, fun)",
              enum: ["creative", "philosophical", "technical", "fun", "any"]
            },
            count: {
              type: "integer",
              description: "Number of prompts to return (1-10)",
              minimum: 1,
              maximum: 10
            }
          },
          additionalProperties: false
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "get_prompt") {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }

  const args = request.params.arguments || {};
  const category = args.category || "any";
  const count = Math.min(Math.max(args.count || 1, 1), 10);

  // Get random prompts
  const shuffled = [...PROMPTS].sort(() => 0.5 - Math.random());
  const selectedPrompts = shuffled.slice(0, count);

  let result;
  if (count === 1) {
    result = `Here's an interesting prompt for your LLM:\n\n${selectedPrompts[0]}`;
  } else {
    result = `Here are ${selectedPrompts.length} interesting prompts for your LLM:\n\n`;
    selectedPrompts.forEach((prompt, i) => {
      result += `${i + 1}. ${prompt}\n\n`;
    });
  }

  return {
    content: [
      {
        type: "text",
        text: result
      }
    ]
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Prompt Provider MCP server running on stdio");
}

main().catch(console.error);