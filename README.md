# diceport

diceport rolls dice, flips coins, and picks random integers. It is
built for the moments when a script or an agent needs a fair,
explainable bit of chance: a roll reports every face that went into
its total, and any call can take a seed that makes the outcome
reproducible — same seed, same result, every time.

## Install

```bash
npx @reneturcios/diceport roll 2d6
```

Or run the container image:

```bash
docker run -i ghcr.io/cloudcorprecords/diceport
```

The container defaults to the MCP server (see below). Pass CLI
arguments to use it as a CLI instead.

## CLI

```bash
# Roll dice in NdM notation, with an optional +N / -N modifier
diceport roll 2d6
# 2d6: [3, 5] total 8
diceport roll 3d8+2 --seed 42   # reproducible

# Flip a coin
diceport flip                   # heads (or tails)
diceport flip --seed 7 --json

# Pick an integer between two bounds, inclusive
diceport random 1 100
diceport random 1 100 --seed 42

diceport --version
```

Notation is `NdM`: roll N dice with M sides each. The count may be
left off (`d20` rolls one die) and a flat modifier may be appended
(`2d6+3`, `1d100-5`).

Exit codes: `0` on success, `1` when a roll or range cannot be done
(bad notation, an inverted range — the error says why), `2` for usage
errors.

## MCP server

One bin serves both faces. The `mcp` subcommand starts a stdio MCP
server:

```bash
npx -y @reneturcios/diceport mcp
```

MCP client configuration:

```json
{
  "mcpServers": {
    "diceport": {
      "command": "npx",
      "args": ["-y", "@reneturcios/diceport", "mcp"]
    }
  }
}
```

### Tools

| Tool | Input | What it returns |
| --- | --- | --- |
| `roll_dice` | `notation` (string, required, e.g. `2d6+3`), `seed` (integer, optional) | Every individual face rolled, the modifier, and the total. |
| `flip_coin` | `seed` (integer, optional) | `heads` or `tails`. |
| `random_number` | `min`, `max` (integers, required), `seed` (integer, optional) | One integer between `min` and `max`, inclusive. |

Seeded calls use a mulberry32 generator, so a seed fully determines
the outcome and any reported result can be replayed. Unseeded calls
draw from the platform random source.

## Development

```bash
npm install
npm run build   # tsc -> dist/
npm test        # node test runner over test/*.test.ts, no network
npm run dev     # run the CLI from source via tsx
```

## License

MIT — see `LICENSE`.
