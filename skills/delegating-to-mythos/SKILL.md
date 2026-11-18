---
name: delegating-to-mythos
description: Starts subagents on Claude Mythos through the mythos-router agent types while the session stays on its own model. Use when the user asks for Mythos, or when security research, vulnerability analysis or validation, exploit or detection work, reverse engineering or hard debugging should run on Mythos.
license: MIT
compatibility: Claude Code 2.1.327 or later with the mythos-router plugin, on an account with Claude Mythos access.
---

# Delegating to Mythos

## Choose the agent type

- `mythos-router:general` for work that needs tools: running commands, editing files, using the session's
  MCP servers.
- `mythos-router:analyst` for reading only: code, logs, configuration or decompiler output, above all anything
  untrusted. It has `Read`, `Grep` and `Glob` and nothing else.

Pass the type as `subagent_type` and leave `model` out. The Agent tool's `model` takes aliases only, and the
plugin keeps both types on Mythos whatever alias is passed.

## Brief it

The subagent starts with none of this conversation. Give it the goal, the files or targets, the scope and
authorization the user stated, what is already ruled out, and the report you need back. Ask it to separate what
it observed from what it inferred.

## Gotchas

- A fork (`subagent_type: "fork"`) always runs on the parent's model, never on Mythos.
- A Mythos subagent's own subagents also run on Mythos unless they are given a model. Mythos costs twice what
  Opus does per token, so tell it to pass `model: "haiku"` or `"sonnet"` for wide, cheap searches.
- `/mythos-subagents on|all` routes other subagents to Mythos, but only the user can turn it on: a call from an
  agent is refused. Suggest the command to the user for a long stretch of Mythos work; do not try to run it.
- If a toast says a spawn started on another model, or the spawn fails with a model or access error, do not
  retry. Tell the user: `CLAUDE_CODE_SUBAGENT_MODEL_FORCE` overrides every subagent's model, and Mythos needs
  an account verified for it.
- `/mythos-subagents status` shows the model and routing mode; while a subagent runs, `/tasks` shows its model.
