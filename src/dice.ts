/**
 * diceport core: dice rolls, coin flips, and bounded random integers.
 *
 * Randomness comes in two flavours. Without a seed, values are drawn
 * from Math.random. With a seed, a mulberry32 generator is used: a
 * small, well-known 32-bit PRNG whose entire state is the seed, so the
 * same seed always produces the same sequence — which is what makes a
 * seeded roll testable and a reported result checkable.
 *
 * Dice notation is NdM with an optional flat modifier: "2d6", "d20"
 * (one die), "3d8+2", "1d100-5". Counts and sides must be positive.
 */
import type { FlipCoinResult, RandomNumberResult, RollDiceResult } from "./types.js";

export const VERSION = "0.1.0";

type Rng = () => number;

/** mulberry32: deterministic PRNG seeded from a single integer. */
export function mulberry32(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rngFor(seed: number | undefined): Rng {
  if (seed === undefined) return Math.random;
  if (!Number.isInteger(seed)) throw new Error(`Seed must be an integer, got ${seed}`);
  return mulberry32(seed);
}

function integerInRange(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export interface ParsedNotation {
  count: number;
  sides: number;
  modifier: number;
}

const NOTATION_RE = /^(\d*)d(\d+)([+-]\d+)?$/i;

export function parseNotation(notation: string): ParsedNotation {
  const raw = typeof notation === "string" ? notation.trim() : "";
  const m = NOTATION_RE.exec(raw.replace(/\s+/g, ""));
  if (!m) {
    throw new Error(
      `Invalid dice notation: '${notation}' (expected NdM with an optional +N or -N modifier, e.g. 2d6+3)`,
    );
  }
  const count = m[1] === "" ? 1 : Number(m[1]);
  const sides = Number(m[2]);
  const modifier = m[3] ? Number(m[3]) : 0;
  if (!Number.isInteger(count) || count < 1) {
    throw new Error(`Dice count must be at least 1 in notation '${notation}'`);
  }
  if (!Number.isInteger(sides) || sides < 2) {
    throw new Error(`Dice must have at least 2 sides in notation '${notation}'`);
  }
  return { count, sides, modifier };
}

export function rollDice(notation: string, seed?: number): RollDiceResult {
  const { count, sides, modifier } = parseNotation(notation);
  const rng = rngFor(seed);
  const rolls: number[] = [];
  for (let i = 0; i < count; i++) rolls.push(integerInRange(rng, 1, sides));
  const total = rolls.reduce((sum, face) => sum + face, 0) + modifier;
  const result: RollDiceResult = {
    notation: `${count}d${sides}${modifier === 0 ? "" : modifier > 0 ? `+${modifier}` : `${modifier}`}`,
    rolls,
    modifier,
    total,
  };
  if (seed !== undefined) result.seed = seed;
  return result;
}

export function flipCoin(seed?: number): FlipCoinResult {
  const rng = rngFor(seed);
  const result: FlipCoinResult = { result: rng() < 0.5 ? "heads" : "tails" };
  if (seed !== undefined) result.seed = seed;
  return result;
}

export function randomNumber(min: number, max: number, seed?: number): RandomNumberResult {
  if (!Number.isInteger(min) || !Number.isInteger(max)) {
    throw new Error(`min and max must be integers, got min=${min}, max=${max}`);
  }
  if (max < min) throw new Error(`max (${max}) must be greater than or equal to min (${min})`);
  const rng = rngFor(seed);
  const result: RandomNumberResult = { min, max, result: integerInRange(rng, min, max) };
  if (seed !== undefined) result.seed = seed;
  return result;
}
