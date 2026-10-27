import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { flipCoin, mulberry32, parseNotation, randomNumber, rollDice } from "../src/dice.js";

describe("mulberry32", () => {
  it("is deterministic for a given seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    assert.deepEqual([a(), a(), a()], [b(), b(), b()]);
  });

  it("produces values in [0, 1)", () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      assert.ok(v >= 0 && v < 1, String(v));
    }
  });
});

describe("parseNotation", () => {
  it("parses NdM with optional modifier", () => {
    assert.deepEqual(parseNotation("2d6"), { count: 2, sides: 6, modifier: 0 });
    assert.deepEqual(parseNotation("3d8+2"), { count: 3, sides: 8, modifier: 2 });
    assert.deepEqual(parseNotation("1d100-5"), { count: 1, sides: 100, modifier: -5 });
    assert.deepEqual(parseNotation("d20"), { count: 1, sides: 20, modifier: 0 });
  });

  it("rejects malformed notation", () => {
    for (const bad of ["", "2x6", "0d6", "2d1", "d", "2d6+", "six"]) {
      assert.throws(() => parseNotation(bad), Error, bad);
    }
  });
});

describe("rollDice", () => {
  it("rolls within range and totals the faces plus the modifier", () => {
    const r = rollDice("3d6+2", 1234);
    assert.equal(r.rolls.length, 3);
    for (const face of r.rolls) assert.ok(face >= 1 && face <= 6, String(face));
    assert.equal(r.total, r.rolls.reduce((s, f) => s + f, 0) + 2);
    assert.equal(r.modifier, 2);
    assert.equal(r.notation, "3d6+2");
    assert.equal(r.seed, 1234);
  });

  it("is reproducible for the same seed and differs across seeds", () => {
    assert.deepEqual(rollDice("4d6", 99), rollDice("4d6", 99));
    assert.notDeepEqual(rollDice("4d6", 1).rolls, rollDice("4d6", 2).rolls);
  });

  it("omits the seed when none was given", () => {
    const r = rollDice("1d6");
    assert.equal("seed" in r, false);
    assert.ok(r.total >= 1 && r.total <= 6);
  });
});

describe("flipCoin", () => {
  it("returns heads or tails and is reproducible when seeded", () => {
    assert.ok(["heads", "tails"].includes(flipCoin().result));
    assert.equal(flipCoin(5).result, flipCoin(5).result);
    assert.equal(flipCoin(5).seed, 5);
  });
});

describe("randomNumber", () => {
  it("stays inside the inclusive bounds", () => {
    for (let seed = 0; seed < 50; seed++) {
      const r = randomNumber(3, 7, seed);
      assert.ok(r.result >= 3 && r.result <= 7, String(r.result));
    }
    assert.deepEqual(randomNumber(1, 10, 8), randomNumber(1, 10, 8));
  });

  it("handles a single-value range", () => {
    assert.equal(randomNumber(4, 4, 1).result, 4);
  });

  it("rejects inverted and non-integer ranges", () => {
    assert.throws(() => randomNumber(10, 1), /greater than or equal/);
    assert.throws(() => randomNumber(1.5, 5), /must be integers/);
  });
});
