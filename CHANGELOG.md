# Changelog

## 0.1.0 (2026-10-26)

- Initial release.
- CLI: `diceport roll <notation>` rolls dice in `NdM` notation with an
  optional `+N`/`-N` modifier; `diceport flip` flips a coin;
  `diceport random <min> <max>` picks an integer in an inclusive
  range. All accept `--seed N` and `--json`.
- MCP server (`diceport mcp`, stdio) with three tools: `roll_dice`,
  `flip_coin`, and `random_number`.
- Seeded calls are deterministic: a mulberry32 generator keyed by the
  seed reproduces the same faces, flips, and numbers on every run.
  Roll results report each individual face alongside the total.
