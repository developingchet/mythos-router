# Security Policy

## Supported versions

Only the latest release on `main` receives security fixes.

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Report privately through [GitHub private vulnerability reporting](https://github.com/developingchet/mythos-router/security/advisories/new) (the **Security** tab, then **Report a vulnerability**).

Please include:
- the mythos-router version and the Claude Code version (`claude --version`)
- the `routing`, `model`, `effort` and `autoUpgrade` options, and how it was loaded (installed or `--plugin-dir`)
- steps to reproduce, and the impact you expect

GitHub keeps the report confidential until the advisory is published.

## Response timeline

These are targets, not guarantees:

- Acknowledgement within 3 business days.
- A status update within 7 business days.
- A fix within 30 days of a confirmed reproduction. Critical issues (CVSS 9.0 or higher) are expedited on a best-effort basis.

Disclosure is coordinated with the reporter, who is credited unless they prefer otherwise.

Reproduce a problem only in a Claude Code session you own or are authorized to test, on an account with Mythos access. Do not include real conversation text, transcripts from other people or an unfixed vulnerability in someone else's project in a report, and do not change another account's policy or settings to test the plugin. Reports made in good faith within this scope will not be treated as a violation of this policy.

## Scope

In scope:
- anything other than the session's owner (another agent, a channel, a schedule, a plugin, file or tool content) turning routing on or starting a release check through `/mythos-subagents`
- a subagent sent to a model that is not a `claude-mythos-*` ID because of the plugin
- the plugin widening a subagent's tools or permissions beyond what its caller or agent file grants
- the release check sending anything other than its fixed prompt, or to anything other than the session's own API client

Out of scope:
- what a Mythos subagent does with the tools and permissions its caller already has
- another installed plugin or mod changing this plugin's options: mods run with the user's permissions, so installing one already trusts it
- access to Claude Mythos itself, which Anthropic grants
- problems in Claude Code or the models themselves (report those to Anthropic)
