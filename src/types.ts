/**
 * diceport types.
 *
 * A roll result keeps the individual dice alongside the total, so a
 * caller can show the faces that produced a number instead of trusting
 * a bare sum. When a seed was supplied it is echoed back, marking the
 * result as reproducible.
 */

export interface RollDiceResult {
  notation: string;
  rolls: number[];
  modifier: number;
  total: number;
  seed?: number;
}

export interface FlipCoinResult {
  result: "heads" | "tails";
  seed?: number;
}

export interface RandomNumberResult {
  min: number;
  max: number;
  result: number;
  seed?: number;
}
