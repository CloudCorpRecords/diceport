#!/usr/bin/env node
/**
 * diceport CLI.
 *
 *   diceport roll <notation> [--seed N] [--json]
 *   diceport flip [--seed N] [--json]
 *   diceport random <min> <max> [--seed N] [--json]
 *   diceport mcp
 *
 * Exit codes: 0 success, 1 roll/range error, 2 usage error.
 * A given seed always produces the same result.
 */
import { flipCoin, randomNumber, rollDice, VERSION } from "./dice.js";

function usage(): never {
  console.error(`Usage:
  diceport roll <notation> [--seed N] [--json]
  diceport flip [--seed N] [--json]
  diceport random <min> <max> [--seed N] [--json]
  diceport mcp
  diceport --version`);
  process.exit(2);
}

function parseOptions(rest: string[]): { positional: string[]; seed?: number; asJson: boolean } {
  const positional: string[] = [];
  let seed: number | undefined;
  let asJson = false;
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === "--json") {
      asJson = true;
    } else if (arg === "--seed") {
      const raw = rest[++i];
      if (raw === undefined || !Number.isInteger(Number(raw))) usage();
      seed = Number(raw);
    } else if (arg.startsWith("--seed=")) {
      const raw = arg.slice("--seed=".length);
      if (!Number.isInteger(Number(raw))) usage();
      seed = Number(raw);
    } else if (arg.startsWith("--")) {
      usage();
    } else {
      positional.push(arg);
    }
  }
  return { positional, seed, asJson };
}

function intArg(raw: string | undefined): number {
  if (raw === undefined || !Number.isInteger(Number(raw))) usage();
  return Number(raw);
}

async function main(): Promise<void> {
  const [cmd, ...rest] = process.argv.slice(2);
  if (cmd === "--version" || cmd === "-v") {
    console.log(VERSION);
    return;
  }
  if (cmd === "mcp") {
    await import("./mcp.js");
    return;
  }
  if (!cmd) usage();
  try {
    if (cmd === "roll") {
      const { positional, seed, asJson } = parseOptions(rest);
      const [notation] = positional;
      if (!notation) usage();
      const result = rollDice(notation, seed);
      if (asJson) console.log(JSON.stringify(result, null, 2));
      else console.log(`${result.notation}: [${result.rolls.join(", ")}] total ${result.total}`);
    } else if (cmd === "flip") {
      const { seed, asJson } = parseOptions(rest);
      const result = flipCoin(seed);
      if (asJson) console.log(JSON.stringify(result, null, 2));
      else console.log(result.result);
    } else if (cmd === "random") {
      const { positional, seed, asJson } = parseOptions(rest);
      const min = intArg(positional[0]);
      const max = intArg(positional[1]);
      const result = randomNumber(min, max, seed);
      if (asJson) console.log(JSON.stringify(result, null, 2));
      else console.log(String(result.result));
    } else {
      usage();
    }
  } catch (err) {
    console.error(`error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

void main();
