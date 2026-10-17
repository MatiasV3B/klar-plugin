# Configuration

The plugin is configured with environment variables. Set them in your shell, or in Claude Code's `settings.json` under `env`.

| Variable | Values | Default | Description |
|---|---|---|---|
| `KLAR_API_URL` | URL | `https://klar-cloud.vercel.app` | Klar Cloud server to use |
| `KLAR_PROFILE` | `default`, `browsing`, `banking`, `credit` | `default` | Detection profile for the hook |
| `KLAR_MODE` | `warn`, `block` | `warn` | Hook only. `block` also stops the agent from using a result that gets a `block` verdict |
| `KLAR_HOME` | folder | `~/.klar` | Where credentials are stored |

## Profiles

| Profile | Use it for |
|---|---|
| `default` | General use |
| `browsing` | Agents that browse the web |
| `banking` | Agents that touch banking data. Stricter thresholds, fails closed |
| `credit` | Credit and scoring workflows. Strictest thresholds, fails closed |

`banking` and `credit` need a Pro or Max plan.

## Example: a strict setup for a finance agent

```json
{
  "env": {
    "KLAR_PROFILE": "banking",
    "KLAR_MODE": "block"
  }
}
```

With this setup, any result that Klar blocks is stopped, and if Klar cannot be reached the agent is told to treat content as untrusted.

## Files

| Path | Contents |
|---|---|
| `~/.klar/credentials.json` | Your session tokens (private permissions) |

Run `klar logout` to remove them.

## Using an API key

For scripts and CI, create an API key in the [dashboard](https://klar-cloud.vercel.app/account) and call the REST API directly:

```bash
curl https://klar-cloud.vercel.app/v1/inspect \
  -H "Authorization: Bearer $KLAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "text": "…", "source": "web" }'
```

See the [API reference](https://klar-cloud.vercel.app/docs/reference).
