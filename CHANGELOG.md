# Changelog

## 0.1.0 - 2026-11-18

- `mythos-router:general`, a general-purpose agent type with the caller's tools, and `mythos-router:analyst`,
  a read-only one (`Read`, `Grep`, `Glob`), both pinned to Claude Mythos. A caller's alias in the Agent tool's
  `model` parameter does not move them off it.
- `/mythos-subagents on|all|off` routes other subagents to Mythos for the session: `on` covers
  general-purpose agents whose caller names no model, `all` every new subagent, teammate and workflow agent.
  Forks and resumed agents keep their model. Only the session's owner can turn routing on.
- The `routing` option sets the mode each session starts in.
- The `model` option sets the Mythos model ID and accepts only `claude-mythos-*` IDs.
- The `autoUpgrade` option, off by default, checks once a day for a newer Mythos release with a request capped
  at 16 output tokens to each of the next model IDs, and uses the newest that answers while it stays on.
  `/mythos-subagents check` runs the check at once.
- A toast names any Mythos spawn that started on another model, such as under
  `CLAUDE_CODE_SUBAGENT_MODEL_FORCE` or without Mythos access.
