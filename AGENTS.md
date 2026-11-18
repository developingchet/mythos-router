# AGENTS.md

mythos-router is a Claude Code plugin and single-plugin marketplace that lets agents on any model start
subagents on Claude Mythos. README.md describes it for users; this file is for working on it.

## Layout

- `.claude-plugin/plugin.json`: manifest, `userConfig` options (`routing`, `model`, `autoUpgrade`) and the
  `engines` floor. `.claude-plugin/marketplace.json` lists the plugin with `"source": "./"`.
- `agents/general.md`, `agents/analyst.md`: Claude Code subagent definitions pinned to Mythos. They must work
  without the hooks module, so each keeps `model:` set to the default model ID.
- `skills/delegating-to-mythos/`: a skill in the Agent Skills format.
- `hooks/`: the hooks module (a Claude Code mod). `register.ts` hooks `session.start`, `agent.spawn` and
  `command.run`; `model-id.ts` parses and compares Mythos IDs; `upgrade.ts` holds the release check.
- `types/index.d.ts`: the `$.state` contract. `tests/`: `claude plugin test` suites and fixtures.

## Commands

```sh
claude --plugin-dir .            # run it; the first interactive run writes .claude-plugin/types/
claude plugin validate --strict . # must pass, warnings included
claude plugin test .              # every *.test.ts
tsc -p .                          # after the types exist
```

CI runs `validate --strict` and `test` on Windows and Ubuntu against the Claude Code release pinned in
`.github/ci/`, and validates the skill with the reference validator, `agentskills validate
skills/delegating-to-mythos` from the `skills-ref` package, installed from the hash-pinned
`.github/ci/requirements.txt`. Dependabot proposes each new Claude Code release as a pull
request; every CI dependency stays pinned by version and hash.

## Code rules the engine enforces

- A helper that takes `$`, other than a hook passed to `on(…)` or `.catch(…)`, must be a function declaration
  at the top level of its file or imported from another file of the module; an arrow-function helper, or one
  declared inside `register`, fails to load.
- The atom in `register.ts` names the plugin as `'mythos-router'`; it must match `name` in `plugin.json`.
- A `$.state` value is never `undefined`; `null` means "not set this session".
- Gating hooks (`agent.spawn`, `command.run`) carry a `.catch`. `agent.spawn` fails open; the command fails
  with a message.
- Forks and resumed spawns take no model rewrite; leave them to `next(e)`.

## Behaviour that must not change without a decision

- Only the `composer`, `bridge` and `sdk` origins may turn routing on or run `check`; every origin may turn it
  off.
- `model` accepts only `claude-mythos-*` IDs. `autoUpgrade` stays off by default, and a stored newer model
  applies only while it is on.
- The release check counts a model as present only on an answer or an `empty-reply`.

## Changes

- Add or update tests for any change in behaviour. The tests stand in for the engine; routing changes also
  need a live check, as CONTRIBUTING.md describes.
- Update README.md and CHANGELOG.md when behaviour or options change.
- Commits follow Conventional Commits. Write commit messages, comments and docs for a stranger reading the
  repository: no first-person reports on the work and no tool attribution.
- Keep `skills/` conformant with the [Agent Skills specification](https://agentskills.io/specification) and this
  file with [AGENTS.md](https://agents.md).
