/**
 * diceport MCP server. Tools: roll_dice, flip_coin, random_number.
 *
 * Why the low-level Server instead of McpServer: the high-level helper
 * converts zod schemas to JSON Schema and injects two keys that are not
 * in this tool's public spec ("$schema" and "additionalProperties"),
 * which breaks exact tool-list/schema parity with the spec. This file
 * therefore serves tools/list with the spec's exact input schemas,
 * while zod still validates every tools/call argument set. Tool names,
 * parameters, and parameter descriptions are taken from the public spec.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { flipCoin, randomNumber, rollDice, VERSION } from "./dice.js";

const RollDiceArgs = z.object({
  notation: z.string().describe("Dice notation such as 2d6 or 3d8+2"),
  seed: z.number().int().optional().describe("Seed for a reproducible roll"),
});

const FlipCoinArgs = z.object({
  seed: z.number().int().optional().describe("Seed for a reproducible flip"),
});

const RandomNumberArgs = z.object({
  min: z.number().int().describe("Lower bound, inclusive"),
  max: z.number().int().describe("Upper bound, inclusive"),
  seed: z.number().int().optional().describe("Seed for a reproducible result"),
});

const TOOLS = [
  {
    name: "roll_dice",
    description: "Roll dice written in NdM notation, with an optional modifier and seed.",
    inputSchema: {
      type: "object" as const,
      properties: {
        notation: { type: "string", description: "Dice notation such as 2d6 or 3d8+2" },
        seed: { type: "integer", description: "Seed for a reproducible roll" },
      },
      required: ["notation"],
    },
  },
  {
    name: "flip_coin",
    description: "Flip a coin and return heads or tails.",
    inputSchema: {
      type: "object" as const,
      properties: {
        seed: { type: "integer", description: "Seed for a reproducible flip" },
      },
      required: [],
    },
  },
  {
    name: "random_number",
    description: "Return a random integer between min and max, inclusive.",
    inputSchema: {
      type: "object" as const,
      properties: {
        min: { type: "integer", description: "Lower bound, inclusive" },
        max: { type: "integer", description: "Upper bound, inclusive" },
        seed: { type: "integer", description: "Seed for a reproducible result" },
      },
      required: ["min", "max"],
    },
  },
];

function textResult(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
}

function errorResult(err: unknown) {
  return {
    content: [
      { type: "text" as const, text: err instanceof Error ? err.message : String(err) },
    ],
    isError: true,
  };
}

const server = new Server(
  { name: "diceport", version: VERSION },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    if (name === "roll_dice") {
      const parsed = RollDiceArgs.parse(args ?? {});
      return textResult(rollDice(parsed.notation, parsed.seed));
    }
    if (name === "flip_coin") {
      const parsed = FlipCoinArgs.parse(args ?? {});
      return textResult(flipCoin(parsed.seed));
    }
    if (name === "random_number") {
      const parsed = RandomNumberArgs.parse(args ?? {});
      return textResult(randomNumber(parsed.min, parsed.max, parsed.seed));
    }
  } catch (err) {
    return errorResult(err);
  }
  throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
});

async function main(): Promise<void> {
  await server.connect(new StdioServerTransport());
}

void main();
