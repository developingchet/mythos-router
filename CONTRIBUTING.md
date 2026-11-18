# Contributing

Issues and pull requests are welcome. For security problems, follow [SECURITY.md](SECURITY.md) instead of
opening an issue.

## Making a change

1. Fork the repository and create a branch named for the change, such as `fix/routing-on-resume`.
2. Run the plugin from your clone with `claude --plugin-dir .`; see [Developing](README.md#developing).
3. Add or update tests in `tests/` for any change in behaviour, then run:

   ```sh
   claude plugin validate --strict .
   claude plugin test .
   ```

4. A change to how spawns are routed also needs a check in a live session with Mythos access: start a
   `mythos-router:general` subagent, and an `Explore` subagent with routing `on` and `all`, and say in the pull
   request which model `/tasks` showed for each. The test kit stands in for the engine and cannot show which
   model a real request reached.
5. Update `README.md` and `CHANGELOG.md` when behaviour or options change.

## Commit messages

Commits follow [Conventional Commits](https://www.conventionalcommits.org/): a short subject such as
`fix: keep resumed agents on their model`, and a body that explains what changed and why. Pull requests are
squash-merged, so the pull request title becomes the commit subject on `main`.

## Compatibility

CI runs against the Claude Code release pinned in `.github/ci/package.json`. The Compatibility workflow runs
the same checks each week against the newest releases on npm's `latest` and `next` tags. To move the pinned
release forward once a newer one passes:

```sh
npm install --prefix .github/ci --package-lock-only @anthropic-ai/claude-code@<version>
```

Then raise `engines["claude-code"]` in `.claude-plugin/plugin.json` only if the plugin starts to depend on
something that release added, and update the release named under Compatibility in the README.

GitHub turns off scheduled workflows in a public repository after 60 days without activity and emails the
owner before it does; re-enable Compatibility from the Actions tab if that happens.
