<p align="center">
  <img src=".claude-plugin/icon.png" alt="mythos-router logo: a route that forks, its lit branch ending in a star" width="160">
</p>

# mythos-router

[![Test](https://github.com/developingchet/mythos-router/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/developingchet/mythos-router/actions/workflows/test.yml)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/developingchet/mythos-router/badge)](https://scorecard.dev/viewer/?uri=github.com/developingchet/mythos-router)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A Claude Code plugin that lets agents running on any model start subagents on Claude Mythos, without switching
the main session to Mythos.

Claude Code has no `mythos` model alias, and the Agent tool's `model` parameter takes aliases only, so an agent
on Opus or Fable cannot ask for a Mythos subagent ([Choose a model](https://code.claude.com/docs/en/sub-agents#choose-a-model)).
The plugin adds two agent types pinned to Mythos, and optionally routes other subagents there too.

An independent project, not affiliated with or supported by Anthropic.

## How it works

- **Agent types.** `mythos-router:general` has the caller's tools; `mythos-router:analyst` can only read and
  search files. Both appear in every agent's list of subagent types, so the model picks them when a task
  calls for Mythos, or when you ask for it. Both run on Mythos even when the caller passes an alias in
  `model` (see [Known limits](#known-limits) for the exceptions).
- **Routing.** With routing `on`, general-purpose agents that the caller started without a model run on Mythos
  too; with `all`, every new subagent, teammate and workflow agent does. The `routing` option sets the mode each
  session starts in, and `/mythos-subagents` changes it for one session.
- **Newer releases.** The `model` option names the Mythos model. With `autoUpgrade` on, the plugin checks
  once a day whether a newer Mythos answers and uses it instead.

- **Skill.** `mythos-router:delegating-to-mythos` tells the main agent which type to pick, how to brief it,
  and what to avoid, such as forks (which never leave the parent's model) or a Mythos agent starting costly
  Mythos subagents of its own.

The agent types are plain agent files, so they run on Mythos even if the plugin's hooks module does not load.
Routing, the alias override and the release check come from the hooks module, a
[mod](https://code.claude.com/docs/en/plugins/mods/create) that hooks the `agent.spawn` event and sets the
spawn's `model`.

## Before you install

- **Mythos access.** Claude Mythos is available only to organizations verified through Anthropic's
  verification programs, such as the Cyber Verification Program
  ([Mythos 5.2](https://platform.claude.com/docs/en/models/mythos-5-2/overview)). The plugin chooses the
  model; it grants nothing. To check your account, run `/model claude-mythos-5-2` in a session and send a
  message.
- **Claude Code 2.1.327 or later**, the release it is checked on; `engines` in `plugin.json` states it.
- **Cost.** Mythos is priced like Fable 5.2 and at twice Opus 5.5 per token
  ([Pricing](https://platform.claude.com/docs/en/about-claude/pricing)). Routing `all` sends every subagent
  there; start with `off` or `on`.
- **Trust.** Like every mod, the hooks module runs with your user permissions and is not sandboxed. It makes no
  network requests of its own; the release check, when you turn it on, goes through the session's own API
  client.

## Install

1. Install from a shell:

   ```sh
   claude plugin install mythos-router --marketplace developingchet/mythos-router
   ```

   This adds the marketplace and installs the plugin under the user scope, so it loads in every session and
   project. Routing starts `off` and the release check stays off. To choose otherwise at install time, add
   `--config` once per option, such as `--config routing=on` or `--config autoUpgrade=true`. A shell install
   does not prompt for options, and its closing line lists those left unset; they keep their defaults.

   Or at the prompt of a Claude Code terminal session, where an options screen asks for each value and the user
   scope is first in the list:

   ```text
   /plugin marketplace add developingchet/mythos-router
   /plugin install mythos-router@mythos-router
   ```

   If a session says a reload is pending, run `/reload-plugins`.

2. Check it. `/mythos-subagents status` names the agent types, the model and the routing mode. Then ask for a
   Mythos subagent ("use the mythos-router:general agent to …"); while it runs, `/tasks` shows its model.

The install follows the default branch. Auto-update is off for third-party marketplaces by default; to receive
releases without running `claude plugin update`, open `/plugin`, then **Marketplaces**, select `mythos-router`,
then **Enable auto-update** ([Keep plugins updated](https://code.claude.com/docs/en/plugins/install#keep-plugins-updated)).

### For a team

To offer the plugin in a shared repository, commit this to its `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "mythos-router": { "source": { "source": "github", "repo": "developingchet/mythos-router" } }
  },
  "enabledPlugins": { "mythos-router@mythos-router": true }
}
```

Once a person trusts the folder, the marketplace is registered for them, but enabling a plugin in project
settings does not install it ([Require plugins per repository](https://code.claude.com/docs/en/plugins/org#require-plugins-per-repository)).
Each person installs it once, in the clone:

```sh
claude plugin install mythos-router@mythos-router --scope project
```

Options are read from user and managed settings only, never from a project's
([pluginConfigs](https://code.claude.com/docs/en/settings-reference#pluginconfigs)), so a repository cannot
turn routing on for the people who clone it; each person sets their own, or an administrator sets them in
managed settings.

### Configure, update and remove

```sh
claude plugin configure mythos-router@mythos-router   # show the options and which are set
claude plugin update mythos-router@mythos-router      # fetch the latest version; applies next session or after /reload-plugins
claude plugin disable mythos-router@mythos-router     # stop it without removing it
claude plugin enable mythos-router@mythos-router
claude plugin uninstall mythos-router@mythos-router
```

To change an option, use its row in `/config` (the change reloads the plugin at once), or
`/plugin configure mythos-router@mythos-router` in a session. From a shell,
`claude plugin configure mythos-router@mythos-router --values-stdin` reads the values as JSON. See the
[plugin CLI reference](https://code.claude.com/docs/en/plugins/cli-reference).

### Install a release

A marketplace added with `#<tag>` installs the tree of that release. Each
[release](https://github.com/developingchet/mythos-router/releases) is tagged `mythos-router--v<version>`, and
its notes give the exact commands and how to verify the signed zip:

```sh
claude plugin marketplace add developingchet/mythos-router#mythos-router--v<version>
claude plugin install mythos-router@mythos-router
```

To pin an install made from the default branch, remove the marketplace first. Removing it also uninstalls the
plugin and deletes its saved options:

```sh
claude plugin marketplace remove mythos-router
```

### Installing from a clone

```sh
git clone https://github.com/developingchet/mythos-router
claude --plugin-dir ./mythos-router
```

`--plugin-dir` loads it for that session only. To load the clone in every session, add it as a marketplace
and install from it (`claude plugin marketplace add ./mythos-router`, then
`claude plugin install mythos-router@mythos-router`).

## Using it

Nothing changes until a task calls for Mythos. Then:

- **Ask for it.** "Have a Mythos agent review this parser for memory-safety bugs" or "use
  mythos-router:analyst on these decompiler listings". The main agent starts the subagent; your session stays
  on its own model.
- **Let the model choose.** The agent types' descriptions name security research, vulnerability analysis,
  reverse engineering and hard debugging, so an agent may pick them for that work unprompted.
- **Route a stretch of work.** `/mythos-subagents all` before a security review sends every subagent to Mythos;
  `/mythos-subagents off` afterwards. The status line shows `subagents: Mythos (all)` while it is on.
- **Read-only analysis.** `mythos-router:analyst` cannot run commands, edit files or reach the network, which
  suits code or output you don't trust.

A Mythos agent's own subagents run on Mythos too unless given another model; its prompt tells it to hand cheap
searches to a smaller one.

### /mythos-subagents

| Argument | Effect |
| --- | --- |
| `status` (or nothing) | Shows the agent types, the model and the routing mode |
| `on` | For this session, general-purpose agents run on Mythos when the caller names no model |
| `all` | For this session, every new subagent, teammate and workflow agent runs on Mythos |
| `off` | For this session, only the agent types run on Mythos |
| `check` | Looks for a newer Mythos release now |

Forks always inherit the parent's model, and resumed agents keep theirs. Only the session's owner can turn
routing on or run `check`: typed at the prompt, sent through Remote Control or run from an SDK host. Other
agents, channels, schedules and plugins can only turn it off.

## Options

| Option | Default | Meaning |
| --- | --- | --- |
| `routing` | `off` | The routing mode each session starts in: `off`, `on` or `all` |
| `model` | `claude-mythos-5-2` | The Mythos model ID. Anything that is not a `claude-mythos-*` ID falls back to the default, with a toast |
| `autoUpgrade` | `false` | Check once a day for a newer Mythos release, and use the newest that answers instead of `model` |

### Staying on the newest Mythos

Claude Code gives plugins no list of available models, so the plugin cannot read which Mythos release is newest.
Two ways to follow new releases:

- Set `model` to the new ID when a release ships.
- Turn on `autoUpgrade`. Once a day, at the start of a session, the plugin sends a short request (capped at 16
  output tokens) to the next minor and next major model IDs (after `claude-mythos-5-2`: `claude-mythos-5-3`,
  then `claude-mythos-6`) and keeps climbing while they answer. A model that does not exist, refused access,
  a rate limit or a timeout leaves the current one in place. A newer model it finds is announced in a toast,
  kept across sessions, and used while `autoUpgrade` stays on; turning it off goes back to `model`. A new major
  release can be priced differently, so check before leaving this on.

`/mythos-subagents check` runs the same check at once, and with `autoUpgrade` off reports a newer model without
using it. Claude Code logs an `unrecognized_model` line for each ID that does not exist yet; that is the
expected answer.

The agent files name `claude-mythos-5-2`, which applies only if the hooks module does not load.

### When a spawn lands on another model

If a Mythos spawn starts on a different model, a toast names both. The usual causes are
`CLAUDE_CODE_SUBAGENT_MODEL_FORCE`, which overrides every subagent's model including this plugin's
([Environment variables](https://code.claude.com/docs/en/env-vars)), and an account without Mythos access.

## Compatibility

Checked on Claude Code 2.1.327, the release CI pins. The [Compatibility](.github/workflows/compat.yml)
workflow runs the checks each week against the newest releases on npm's `latest` and `next` tags, since the
mods API can change between releases.

## Known limits

- `on` cannot see which model an agent type defines, so it routes only general-purpose agents. Use `all` to move
  other types such as Explore, and workflow agents.
- A Mythos agent's own subagents inherit Mythos unless they are given another model.
- `CLAUDE_CODE_SUBAGENT_MODEL_FORCE` outranks the plugin.
- The release check finds only IDs that follow the `claude-mythos-<major>-<minor>` pattern.

## Standards

The repository follows two open standards strictly:

- **[AGENTS.md](https://agents.md).** Instructions for coding agents working on the repository are in
  [AGENTS.md](AGENTS.md), which Claude Code and other agents read as project context.
- **[Agent Skills](https://agentskills.io/specification).** Every skill under `skills/` conforms to the
  specification, and CI checks each one with its reference validator, `skills-ref validate`, pinned to a commit
  of the specification's repository.

The subagent definitions in `agents/` use Claude Code's own
[subagent format](https://code.claude.com/docs/en/sub-agents), which neither standard covers.

## Developing

From a clone of this repository:

```sh
claude --plugin-dir .
claude plugin validate --strict .
claude plugin test .
```

The first interactive `claude --plugin-dir .` writes the API types to `.claude-plugin/types/`, which
`tsconfig.json` extends; until then an editor or `tsc -p .` reports the missing file. The folder is generated
and not committed.

The tests replace the engine beneath the plugin: they record the model each spawn reaches it with, answer
`model.complete` for the release check, and keep the store and clock in memory, so they make no requests.

To release, raise `version` in `.claude-plugin/plugin.json`, add the version to `CHANGELOG.md`, commit, and
run `claude plugin tag . --push`, which names the tag `mythos-router--v<version>` and pushes it. The tag runs
the [Test](.github/workflows/test.yml) workflow, then publishes a GitHub release with the plugin as a zip and a
checksum file, both signed with cosign.

## Contributing and security

See [CONTRIBUTING.md](CONTRIBUTING.md). Report security problems privately, as [SECURITY.md](SECURITY.md)
describes.

## License

MIT; see [LICENSE](LICENSE).
