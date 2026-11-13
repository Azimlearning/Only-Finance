# Environment Setup — OnlyFinance

> **Security:** never commit a real value from this file. `.env*` is gitignored; `.env.example` carries the *names* with blank values and is committed.
> Never paste a real token into a plan, an execution doc, a changelog entry, or a chat transcript. If one leaks, rotate it.

Last updated: 2026-11-11

---

## Required variables

No variable is required: the app runs without a key, and the AI panels then show the offline templates. To enable the AI features, set:

| Variable | Required | Where to get it | Read by | Notes |
|---|---|---|---|---|
| `OPENROUTER_API_KEY` | For AI only | https://openrouter.ai/settings/keys | `app/vite.config.ts` (dev proxy, server-side) | **No `VITE_` prefix.** Never referenced in `app/src/` |
| `VITE_OPENROUTER_MODEL` | For AI only | Model id from https://openrouter.ai/models (must support tool calling). Chosen: `nvidia/nemotron-3-ultra-550b-a55b:free` (primary) | `app/src/ai/client.ts` | Not secret, so the client may see it |
| `VITE_OPENROUTER_FALLBACK_MODEL` | Optional | Same list. Chosen: `nvidia/nemotron-3.5-lightning:free` (fallback) | `app/src/ai/client.ts` (sent as OpenRouter's `models` fallback list) | Used automatically when the main model errors or is rate-limited |

Free models have daily request caps, and one tutor question can use 2–5 requests (tool rounds). Avoid heavy testing on the recording day; the offline fallback covers outages.

## Setup

```bash
cp .env.example .env.local    # at the repo root; Vite reads it via envDir: '..'
# fill in OPENROUTER_API_KEY and VITE_OPENROUTER_MODEL, then restart the dev server
```

---

## Rules

- **Client-side bundles are public.** Anything with a `VITE_` prefix is readable in devtools. The key goes through the dev proxy only.
- **`.env.example` is the documentation.** Add the variable name there the moment you add the variable.
- **A missing key must not break the app.** `__LLM_ENABLED__` is false and the offline fallback is used.
- **Rotate on exposure**, including a key that appeared on screen in a recording.

## When a variable changes

Update, in the same session: this file, `.env.example`, and a changelog entry.
