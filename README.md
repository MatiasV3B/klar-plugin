# Klar

Prompt injection protection for AI agents. Klar reviews what your agent reads (web pages, PDFs, emails, tool results) **before** it acts, and returns `allow`, `flag` or `block`. Detection runs in Klar Cloud; you sign in with your account and plans are billed by usage.

Docs: https://klar-cloud.vercel.app/docs

## Claude Code

```bash
claude plugin marketplace add MatiasV3B/klar-plugin
claude plugin install klar@klar
```

The plugin adds:

- **A `PostToolUse` hook** that reviews what `WebFetch`, `WebSearch`, `Read`, `Bash`, `PowerShell`, `Grep` and MCP tools return, and warns the agent with a `⚠ Klar:` message.
- **MCP tools:** `klar_inspect`, `klar_status` and `klar_login` (the agent can sign you in: it gives you a link and a code).
- **A skill, `klar-guard`,** that tells the agent when to review and what to do with each verdict.
- **A `klar` command line tool** (`klar login`, `klar status`, `klar inspect`).

Sign in once: ask your agent to call `klar_login`, or run `node plugins/klar/bin/klar.js login`.

## Codex

```bash
codex mcp add klar --url https://klar-cloud.vercel.app/mcp
codex mcp login klar
```

## Any other MCP client

Server URL: `https://klar-cloud.vercel.app/mcp` (Streamable HTTP, OAuth 2.1 with dynamic client registration and PKCE).

## Configuration

| Variable | Values | Default |
|---|---|---|
| `KLAR_API_URL` | Server URL | `https://klar-cloud.vercel.app` |
| `KLAR_PROFILE` | `default`, `browsing`, `banking`, `credit` | `default` |
| `KLAR_MODE` | `warn`, `block` (hook only) | `warn` |
| `KLAR_HOME` | Credentials folder | `~/.klar` |

If Klar cannot be reached, `banking` and `credit` profiles tell the agent to treat the content as untrusted; other profiles warn once per session and continue.

## What is in this repository

Only the thin client: hook, MCP proxy, CLI and skill. It contains no detection logic; that lives in Klar Cloud.

## License

MIT
