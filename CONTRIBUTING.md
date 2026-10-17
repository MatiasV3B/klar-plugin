# Contributing to Klar

Thanks for helping make AI agents safer. This guide explains how to report problems, suggest ideas and send changes.

By taking part you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## What lives here, and what does not

This repository is the **thin client**: the Claude Code plugin (hook, MCP proxy, CLI, skill) and the Codex plugin manifest. It deliberately contains **no detection logic**. Detection, accounts and billing live in Klar Cloud, which is closed source.

That means:

- Bugs and improvements to the **hook, proxy, CLI, skills, docs and manifests** belong here.
- Requests about **what Klar detects** (a new attack type, a false positive, a missed attack) are welcome as issues, but they are fixed in Klar Cloud. Include an example so we can reproduce it.

## Ways to contribute

| You want to… | Do this |
|---|---|
| Ask a question or share an idea | Start a [Discussion](https://github.com/MatiasV3B/klar-plugin/discussions) |
| Report a bug | [Open a bug report](https://github.com/MatiasV3B/klar-plugin/issues/new/choose) |
| Report a missed attack or a false positive | [Open a detection report](https://github.com/MatiasV3B/klar-plugin/issues/new/choose) |
| Suggest a feature | [Open a feature request](https://github.com/MatiasV3B/klar-plugin/issues/new/choose) |
| Report a vulnerability | **Do not open an issue.** Follow [SECURITY.md](SECURITY.md) |
| Improve the docs | Send a pull request, even for a typo |

## Reporting a bug

A good report lets us reproduce the problem in minutes. Please include:

1. What you did, what you expected and what happened.
2. Your environment: OS, Node.js version (`node -v`), Claude Code or Codex version.
3. The plugin version (see `plugins/klar/.claude-plugin/plugin.json`).
4. Relevant output, with **secrets removed**. Never paste tokens, API keys or private content.

## Sending a pull request

1. **Open an issue or discussion first** for anything bigger than a small fix, so we can agree on the approach before you spend time on it.
2. Fork the repository and create a branch from `main`: `git checkout -b fix/short-description`.
3. Make your change. Keep it focused: one concern per pull request.
4. Run the checks (below).
5. Open the pull request and fill in the template.

### Local checks

```bash
# Every JSON manifest must parse
node -e "for (const f of process.argv.slice(1)) JSON.parse(require('fs').readFileSync(f,'utf8'))" \
  .claude-plugin/marketplace.json plugins/klar/.claude-plugin/plugin.json plugins/klar/.mcp.json plugins/klar/hooks/hooks.json

# Every script must be valid JavaScript
node --check plugins/klar/bin/klar.js plugins/klar/hook/hook.js plugins/klar/mcp/proxy.js

# Plugin manifests must validate (requires Claude Code)
claude plugin validate .
```

CI runs the same checks on every pull request.

### Code style

- Plain Node.js (20 or newer), ES modules, **no runtime dependencies**. If you think a dependency is needed, open a discussion first.
- Match the surrounding code: naming, comment density and structure.
- Keep user-facing messages short and clear.
- **Never** add detection rules, secrets or tokens to this repository.

### Security-sensitive changes

The hook runs on every tool result, so it is a security boundary. If you touch `plugins/klar/hook/hook.js`, keep these rules:

- Never repeat text from the reviewed content in the message shown to the agent. It is attacker-controlled.
- Only Klar's own tools may skip review. Match the exact server name, never a wildcard.
- On unexpected errors, strict profiles (`banking`, `credit`) must fail closed, not open.
- The hook must always exit with code 0 so a broken guard never stops the agent.

### Commit messages

Use the imperative mood and explain the why: `Fail closed on unexpected errors in strict profiles`. Reference issues with `Fixes #123`.

## Review process

A maintainer will review your pull request, usually within a few days. We may ask for changes. Once it is approved and CI is green, we merge it. Please be patient and kind: this is a small team.

## Recognition

Everyone who contributes is credited in the release notes. Thank you!
