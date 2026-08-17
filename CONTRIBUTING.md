# Contributing

Thanks for helping improve Helix.

## Development

Install dependencies:

```bash
npm install
```

Run the main checks before opening a pull request:

```bash
npm run typecheck
npm test
```

Generate the static docs site only when you need to inspect it locally:

```bash
npm run docs:site
```

`docs/site/`, `.tmp/`, `.helix/`, logs, raw external captures, provider
payloads, and training JSONL exports are local artifacts and should stay out of
pull requests.

## Credentials

Live-provider commands require local credentials from `.env` or your shell.
Use `.env.example` as the template, and do not commit real API keys, provider
payloads, cookies, raw traces, or host-specific absolute paths.
