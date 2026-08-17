# Minimal Recipe

This recipe assembles the neutral minimal Helix profile from common atoms only.

Current capabilities:

- Product-neutral session, event, trace, runtime, prompt, provider, tool, and UI atoms.
- Minimal transcript context builder.
- Echo-only tool permission policy.
- Disabled shell execution and extension loading.
- One CLI-oriented product shell for inspecting the assembled recipe.
- Offline conformance coverage for common atom contracts, port fixtures, runtime assembly, recipe validation, package exports, package boundaries, boundary lint, and block ledger checks.

Use it when you want to validate common lego behavior without inheriting a product personality.

Reference entrypoint:

- `npm run helix -- inspect recipe coding-agent.minimal --json`
