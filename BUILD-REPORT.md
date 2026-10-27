# diceport — Build Report

MCP Rebuild 100, Tier A. Clean-room rebuild of the "dice-roller" MCP
server, built from the docs-derived tool spec in
`harness/fixtures/dice-roller-tools-original.json` only (fixture
`_source` states docs-derived, not hand-probed). Local build only —
nothing pushed or published.

Identity: repo `diceport`, npm `@reneturcios/diceport`,
MCP name `io.github.CloudCorpRecords/diceport`, version `0.1.0`.

## Files created (19/19 per TEMPLATE.md checklist)

- `package.json` — bin `diceport: dist/cli.js`, `mcpName` set,
  scripts build=`tsc` / dev=`tsx src/cli.ts` / test=`tsx --test test/*.test.ts`
- `server.json` — description "Dice rolls, coin flips, and random
  numbers, reproducible with a seed." = **69 chars** (≤100 ✓); npm
  entry carries `version: 0.1.0`; OCI entry
  `ghcr.io/cloudcorprecords/diceport:0.1.0` carries **no** `version`
  field (verified programmatically)
- `Dockerfile` — node:20-alpine two-stage, ENTRYPOINT
  `node /app/dist/cli.js`, CMD `mcp`, label
  `io.modelcontextprotocol.server.name="io.github.CloudCorpRecords/diceport"`
- `tsconfig.json` (identical to clockport's), `.gitignore`,
  `LICENSE` (MIT, Copyright (c) 2026 Rene Turcios), `README.md` (fresh
  text), `CHANGELOG.md` (single 0.1.0 entry, 2026-10-26)
- `src/index.ts`, `src/cli.ts` (`mcp`, `roll <notation> [--seed N]`,
  `flip [--seed N]`, `random <min> <max> [--seed N]`, `--version`;
  exit 2 usage / 1 roll error), `src/mcp.ts`, `src/types.ts`,
  `src/dice.ts` (core logic, `VERSION = "0.1.0"`)
- `test/dice.test.ts`
- `.github/workflows/{ci,publish,publish-container,registry-publish}.yml`
  (copied from clockport; image name and smoke-test server name changed)

## Implementation notes

- Dice notation is `NdM` with an optional flat modifier (`2d6`,
  `d20`, `3d8+2`, `1d100-5`); count must be ≥1 and sides ≥2. A roll
  result lists every individual face, the modifier, and the total.
- Seeded calls are deterministic via a mulberry32 PRNG keyed by the
  seed (same seed, same sequence); unseeded calls use `Math.random`.
  A supplied seed is echoed in the result; `flip_coin` takes only the
  optional seed (its schema carries `required: []`, matching the
  fixture exactly).
- `src/mcp.ts` uses the SDK's low-level `Server` following clockport's
  verified pattern (still `@modelcontextprotocol/sdk`, zod still
  validates every `tools/call`): `McpServer`'s zod-to-JSON-Schema
  conversion injects `$schema` / `additionalProperties` keys absent
  from the spec, which caps parity below 100. The low-level server
  serves `tools/list` with the spec's exact input schemas.

## Verification (exact outputs)

### 1. Build
```
$ ./node_modules/.bin/tsc ; echo exit=$?
diceport tsc exit=0
```
`dist/` produced (cli.js, dice.js, mcp.js, index.js, types.js, plus
.d.ts/.js.map); `dist/cli.js` exists.

### 2. Tests
```
$ ./node_modules/.bin/tsx --test test/*.test.ts
ℹ tests 11
ℹ pass 11
ℹ fail 0
```
Covers: mulberry32 determinism and range, notation parsing (including
bare `d20` and negative modifiers) and rejection, seeded roll
reproducibility and totals, unseeded seed omission, seeded coin
flips, inclusive random bounds over 50 seeds, single-value ranges,
and inverted / non-integer range errors.

### 3. CLI + MCP smoke
`roll 2d6+3 --seed 42` -> `2d6+3: [4, 3] total 10`, identical on a
second run; `flip --seed 7` -> `heads`; `random 1 100 --seed 42` ->
`61`; `--version` -> `0.1.0`; `roll 2x6` exits 1; unknown command
exits 2 with Usage. MCP tools/list and tools/call were exercised
live by the parity harness (stdio, below).

### 4. Parity (harness, from ~/workspace/mcp-rebuild-100/harness/)
```
$ python3 parity.py --original fixtures/dice-roller-tools-original.json \
    --rebuild "stdio:node /home/hatch/workspace/mcp-rebuild-100/builds/diceport/dist/cli.js mcp" \
    --out /home/hatch/workspace/mcp-rebuild-100/builds/diceport/parity-out
verdict=PASS parity_pct=100.0 original_tools=3 rebuild_tools=3 missing=[] extra=[] schema_diffs=[]
(exit 0)
```

## Lockfile status

**Clean lockfile regen required before publish.** `package-lock.json`
was copied from clockport's and edited with the file edit tool only:
top-level `name`, root package `name`, and root package `bin` key
changed clockport -> diceport (dependency ranges are identical, so
the tree is unchanged). Per the fleet lesson in TEMPLATE.md §2 item 6,
a lockfile must be generated clean (no `node_modules` present) before
first publish — do not publish from this lockfile as-is.
`node_modules` in this build dir is a `cp -a` copy of clockport's
(local build only, gitignored).

## Blockers

None for the local build. Notes for the publish wave:
- Regenerate `package-lock.json` clean before first publish (above).
- Container build not exercised locally; the publish-container
  workflow smoke-tests the image at publish time.
