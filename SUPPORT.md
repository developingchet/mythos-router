# Support

## Usage questions and setup help

Start with [Before you install](README.md#before-you-install), [Using it](README.md#using-it), [Options](README.md#options) and [Known limits](README.md#known-limits) in the README. If those do not answer the question, open a [Question / Support issue](https://github.com/developingchet/mythos-router/issues/new?template=question.yml) with the plugin version, the Claude Code version, the operating system, the `routing`, `model`, `effort` and `autoUpgrade` values, and what has already been tried.

Transcripts and logs can quote your code and conversation. Remove anything private before pasting them into an issue, a log or a debug file. A live session with Mythos access is needed to confirm which model a subagent reached; `/tasks` shows the model identity, while the test kit stands in for the engine.

## Bugs and feature requests

Use the [Bug report](https://github.com/developingchet/mythos-router/issues/new?template=bug_report.yml) form for wrong behaviour and the [Feature request](https://github.com/developingchet/mythos-router/issues/new?template=feature_request.yml) form for proposed changes. Issue forms are the public intake; this repository does not use GitHub Discussions.

## Security reports

Do not report a vulnerability in a public issue. Use [private vulnerability reporting](https://github.com/developingchet/mythos-router/security/advisories/new) and follow [SECURITY.md](SECURITY.md) for scope, reproduction limits and response targets.

## Claude Code or Claude Mythos access

Problems in Claude Code itself belong upstream at [anthropics/claude-code](https://github.com/anthropics/claude-code/issues). Access to Claude Mythos is granted by Anthropic, not by this plugin. An account without Mythos access cannot start a Mythos subagent; see [Before you install](README.md#before-you-install) for the entitlement requirement.

## Responses

Issues are reviewed as time allows. Include the output of `claude --version`, `claude plugin list` and `/mythos-subagents status` so a question can be answered without a second round of requests.
