# Changelog

All notable changes to the Klar plugin are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.2.1] - 2026-10-17

### Changed
- All user-facing text is now in English: hook notices, CLI output, MCP tool descriptions and messages, the `klar-guard` skills, and the sign-in and consent screens.
- Verdict labels are now `ALLOW`, `FLAG` and `BLOCK`.

### Security
- MCP tool results and the CLI no longer print the matched excerpt (`evidence`) of a finding, only its rule id, family and severity. The excerpt is attacker-controlled text.
- The consent screen warns that dynamically registered apps are unverified and shows where you will be sent after approving.

## [0.2.0] - 2026-10-17

### Added
- First public release of the Claude Code plugin: `PostToolUse` hook, MCP proxy with `klar_inspect`, `klar_status` and `klar_login`, the `klar` CLI and the `klar-guard` skill.
- Codex plugin manifest and remote MCP configuration.
- Sign-in with OAuth (device flow for the CLI and the hook, authorization code with PKCE for MCP clients).
- Strict profiles (`banking`, `credit`) that treat content as untrusted when Klar cannot be reached.
- Clear notices when there is no active subscription (HTTP 402).

### Security
- The hook no longer repeats text from the reviewed content in the message it shows the agent.
- Only Klar's own MCP tools are exempt from review; a third-party server exposing a tool with the same name is reviewed.
- Unexpected errors count as a server failure, so strict profiles fail closed.
