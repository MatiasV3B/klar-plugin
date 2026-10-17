# Troubleshooting

## The agent says Klar did not review a result

The hook adds a notice when it could not review content. The notice tells you why.

| Notice | Cause | Fix |
|---|---|---|
| You are not signed in | No session | Ask the agent to call `klar_login`, or run `klar login` |
| Your account has no active plan | No subscription (HTTP 402) | Pick a plan in the [dashboard](https://klar-cloud.vercel.app/account) |
| You used up your reviews | Monthly quota reached | Upgrade, or wait for the monthly reset |
| Too many reviews per minute | Rate limit | Wait a moment; the limit resets every minute |
| The profile is not in your plan | `KLAR_PROFILE=banking` or `credit` on a plan without it | Use `default` or upgrade |
| Could not reach the server | Network problem | Check your connection and `KLAR_API_URL` |

## `klar_login` keeps saying the code is not approved

1. Open the exact link the agent gave you (the code is inside it).
2. Sign in and press **Allow**.
3. Tell the agent you finished, so it calls `klar_login` again.

Codes expire after 10 minutes. If yours expired, ask for a new one.

## "Too many devices" or I was signed out

Each plan allows a number of connected devices (Pro 3, Max 5). When you go over, the **oldest** one is disconnected. Remove devices you no longer use in the dashboard.

## The tools do not appear in Claude Code

1. Check that the plugin is enabled: `claude plugin list`.
2. Restart Claude Code after installing.
3. Run `/mcp` and confirm `klar` is connected.

## Codex does not list the tools

Run `codex mcp login klar` again and confirm the URL is `https://klar-cloud.vercel.app/mcp`.

## Windows: the hook does not run

Make sure `node` is on your `PATH` (`node -v` should print 20 or higher), then restart Claude Code.

## A normal page was flagged (false positive)

Please [open a detection report](https://github.com/MatiasV3B/klar-plugin/issues/new/choose) with the smallest example you can share, without private data. False positives are fixed in Klar Cloud, so no plugin update is needed.

## I think Klar missed an attack

Open a detection report with the content (remove secrets). If you believe it is a vulnerability in Klar itself, follow [SECURITY.md](../SECURITY.md) instead.

## Still stuck?

See [SUPPORT.md](../SUPPORT.md).
