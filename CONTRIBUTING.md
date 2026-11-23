# Contributing

Issues and pull requests are welcome. For security problems, follow [SECURITY.md](SECURITY.md) instead of
opening an issue. Coding agents should also read [AGENTS.md](AGENTS.md) for the layout, commands and rules the
engine enforces. Usage questions belong in [SUPPORT.md](SUPPORT.md).

## Making a change

1. Fork the repository and create a branch named for the change, such as `fix/routing-on-resume`.
2. Run the plugin from your clone with `claude --plugin-dir .`; see [Developing](README.md#developing).
3. Add or update tests in `tests/` for any change in behaviour, then run:

   ```sh
   claude plugin validate --strict .
   claude plugin test .
   ```

4. A change to how spawns are routed also needs a check in a live session with Mythos access: start a
   `mythos-router:general` subagent; a general-purpose subagent with routing `on`; and an `Explore` subagent
   with routing `on`, where it keeps its own model, and with `all`, where it moves to Mythos. Say in the pull
   request which model `/tasks` showed for each. The test kit stands in for the engine and cannot show which
   model a real request reached.
5. Update `README.md` and `CHANGELOG.md` when behaviour or options change.
6. Keep [AGENTS.md](AGENTS.md) in the [AGENTS.md](https://agents.md) format and current with the layout and
   commands, and keep every skill in `skills/` conformant with the
   [Agent Skills specification](https://agentskills.io/specification). CI runs the reference validator on each
   skill; to run it locally, install the same pinned packages with
   `pip install --require-hashes -r .github/ci/requirements.txt`, then run
   `agentskills validate skills/<name>`. To change the validator's version, edit
   `.github/ci/requirements.in` and regenerate `requirements.txt` from that folder with
   `pip-compile --generate-hashes --no-index --no-strip-extras --output-file=requirements.txt requirements.in`.

## Commit messages

Commits follow [Conventional Commits](https://www.conventionalcommits.org/): a short subject such as
`fix: keep resumed agents on their model`, and a body that explains what changed and why. Pull requests are
squash-merged, so the pull request title becomes the commit subject on `main`.

## Compatibility

CI runs against the Claude Code release pinned in `.github/ci/package.json` and its lockfile. Dependabot
opens a pull request each week when a newer release is on npm; its checks show whether the plugin still works
with that release, and merging it moves the pin. A failing pull request means the hooks API changed: fix the
plugin on that branch, or close the pull request and stay on the pinned release.

Raise `engines["claude-code"]` in `.claude-plugin/plugin.json` only when the plugin starts to depend on
something a newer release added.
