# How Klar works

## The problem

An AI agent receives two kinds of text: **instructions** from you, and **content** it fetches while working. A language model cannot reliably tell them apart, so content that *looks* like an instruction can steer the agent. This is **prompt injection**.

It is dangerous because it is often invisible to you: white text on a white page, a hidden element, an HTML comment, tiny PDF text, zero-width characters, or an instruction encoded in base64.

## The idea

Treat everything that does not come from the user as **data, not orders**, and check it before the agent acts.

```text
 content ──► Klar review ──► verdict ──► agent decides
 (web, PDF,    (cloud)      allow / flag / block
  email, tool)
```

## Data flow

1. The agent (or the hook) is about to use some content.
2. The client sends the text to Klar Cloud over HTTPS, together with a **source** (`web`, `pdf`, `email`, `tool`…) and a **profile**.
3. Klar Cloud authenticates you, checks your plan limits and runs the detection stack.
4. You get back a verdict, a score from 0 to 100 and the findings behind it.
5. The client turns the verdict into a short message for the agent.

## Where each piece lives

| Piece | Location | Open source |
|---|---|---|
| Hook, MCP proxy, CLI, skills | this repository | yes (MIT) |
| Detection, accounts, quotas, billing | Klar Cloud | no |

Keeping detection in the cloud is deliberate: it stays current without you updating anything, and it cannot be copied out of a plugin.

## What the hook does

The Claude Code hook runs after tools such as `WebFetch`, `WebSearch`, `Read`, `Bash`, `PowerShell`, `Grep` and MCP tools. It:

1. collects the text the tool returned,
2. sends it to Klar for review,
3. if the verdict is `flag` or `block`, adds a warning to the agent's context.

It **never** blocks or breaks your tools by accident: it always exits with code 0. With `KLAR_MODE=block`, a `block` verdict also stops the agent from using that result.

## What the warning looks like

```text
⚠ Klar: the result of WebFetch contains a manipulation attempt.
BLOCK · score 90/100 · profile default
  · [prompt_injection] ignore_previous (90)
```

The message only contains fixed labels, never text from the content, because that text is controlled by the attacker.

## When Klar cannot be reached

| Profile | Behavior |
|---|---|
| `default`, `browsing` | Warns once per session and continues |
| `banking`, `credit` | Tells the agent to treat the content as untrusted and not to act on it |

Unexpected errors are treated the same way as an unreachable server.

## Privacy

- The content is processed in memory for the duration of the call.
- Klar stores **verdict metadata** (action, score, finding types, length) and usage counters, never the content.
- Credentials are kept in `~/.klar` with private permissions.

## Threat model in short

| Attack | Defense |
|---|---|
| Hidden instructions in pages, PDFs and images | Reviews the raw HTML, PDF text spans and image metadata, not only visible text |
| Obfuscation (zero-width, homoglyphs, base64, rot13) | Normalization before analysis |
| Padding to push the attack out of view | Long inputs are trimmed keeping the beginning and the end, and marked as truncated |
| A fake tool named like Klar's | Only Klar's own tools are exempt from review |
| Klar's messages used to inject the agent | Messages contain no text from the reviewed content |
| Stolen sessions | Refresh tokens rotate on every use; reuse revokes the session |

## Limits

Klar lowers risk; it does not promise zero. New attacks can slip through, so keep a human in the loop for payments, credentials and account changes.
