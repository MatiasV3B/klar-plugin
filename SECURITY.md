# Security Policy

Klar is a security product, so we take reports about it seriously and we are grateful to the people who help us keep it safe.

## Supported versions

Only the latest release of the plugin receives security fixes. Klar Cloud (the service behind the plugin) is always the current version.

## Reporting a vulnerability

**Please do not open a public issue, discussion or pull request for a security problem.**

Report it privately using GitHub's private vulnerability reporting:

1. Go to the [Security tab](https://github.com/MatiasV3B/klar-plugin/security) of this repository.
2. Choose **Report a vulnerability**.
3. Describe the problem and how to reproduce it.

Useful details to include:

- What is affected (the hook, the MCP proxy, the CLI, a skill, or Klar Cloud itself)
- Steps to reproduce, or a proof of concept
- The impact you believe it has
- Your environment (OS, Node.js version, Claude Code or Codex version)

Never include real credentials, tokens or private content in a report.

## What to expect

| Step | Target |
|---|---|
| We acknowledge your report | within 3 business days |
| We confirm whether it is a vulnerability | within 7 days |
| We share a fix or a plan | within 30 days for confirmed issues |

We will keep you updated, credit you in the release notes if you wish, and coordinate the date of public disclosure with you.

## In scope

- The hook (`plugins/klar/hook`), the MCP proxy (`plugins/klar/mcp`), the CLI (`plugins/klar/bin`) and the skills
- Ways to make the plugin leak credentials, run attacker-controlled code, or skip a review it should have done
- Ways to inject instructions into the agent through the plugin's own messages
- Klar Cloud: authentication, authorization, quotas, billing and data handling

## Out of scope

- Prompt injection samples that Klar does not detect. These are valuable, but they are **detection reports**, not vulnerabilities: please open a public [detection report](https://github.com/MatiasV3B/klar-plugin/issues/new/choose) without any real secrets.
- Attacks that require a user to disable the plugin or edit their own machine
- Denial of service through very high request volumes
- Findings from automated scanners with no demonstrated impact

## Design notes you can rely on

- **No secrets in this repository.** The plugin is a thin client; detection and accounts live in Klar Cloud.
- **Credentials** are stored in `~/.klar` with private permissions and are never sent to any host other than the configured Klar server.
- **The reviewed content is not stored.** It is processed in memory for the call; only verdict metadata is kept.
- **The hook never repeats attacker text** in the messages it shows the agent.

## Safe harbor

If you act in good faith, avoid harming other users, stay within the scope above and give us a reasonable time to respond before disclosing, we will not pursue legal action and we will work with you to resolve the issue.
