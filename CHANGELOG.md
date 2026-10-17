# Changelog

All notable changes to the Klar plugin are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

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
