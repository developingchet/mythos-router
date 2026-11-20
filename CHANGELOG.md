# Changelog

## Unreleased

- The `effort` option sets the effort level of `mythos-router:general` and `mythos-router:analyst`: `auto`, the
  default, keeps the model's own, or `low`, `medium`, `high`, `xhigh` or `max`. The interactive install asks
  for it with the other options. The session's effort does not reach a subagent on another model, so until now
  the agent types always ran at Mythos's default. `/mythos-subagents status` shows the level.

## 0.0.1 - 2026-11-18

- `mythos-router:general`, a general-purpose agent type with the caller's tools, and `mythos-router:analyst`,
  a read-only one (`Read`, `Grep`, `Glob`), both pinned to Claude Mythos. A caller's alias in the Agent tool's
  `model` parameter does not move them off it.
- `/mythos-subagents on|all|off` routes other subagents to Mythos for the session: `on` covers
  general-purpose agents whose caller names no model, `all` every new subagent, teammate and workflow agent.
  Forks and resumed agents keep their model. Only the session's owner can turn routing on.
- The `mythos-router:delegating-to-mythos` skill, in the Agent Skills format, tells the main agent which type
  to start, how to brief it, and what keeps work off Mythos or makes it costly.
- The `routing` option sets the mode each session starts in.
- The `model` option sets the Mythos model ID and accepts only `claude-mythos-*` IDs.
- The `autoUpgrade` option, off by default, checks once a day for a newer Mythos release with a request capped
  at 16 output tokens to each of the next model IDs, and uses the newest that answers while it stays on.
  `/mythos-subagents check` runs the check at once.
- A toast names any Mythos spawn that started on another model, such as under
  `CLAUDE_CODE_SUBAGENT_MODEL_FORCE` or without Mythos access.
