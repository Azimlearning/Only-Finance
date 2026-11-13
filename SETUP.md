# OnlyFinance: Local Development Setup

Step-by-step guide to running OnlyFinance on your own computer. Windows commands come first; macOS and Linux variants are marked where they differ.

Run every command from the **repo root** (the `OnlyFinance` folder) unless a step says otherwise.

---

## 1. Prerequisites

| Tool | Version needed | Check with |
|---|---|---|
| Node.js | 24 or newer | `node -v` |
| npm | 11 or newer | `npm -v` |
| Git | any recent version | `git --version` |

```powershell
node -v
npm -v
git --version
```

Expected output looks like `v24.x.x`, `11.x.x` and `git version 2.x.x`.

If one is missing or too old:

- **Node.js and npm:** download the **LTS** installer from https://nodejs.org (npm comes with it). Restart your terminal afterwards.
- **Git:** download from https://git-scm.com/downloads. Default installer options are fine on Windows; it also installs Git Bash.
- **macOS:** `brew install node`, and `xcode-select --install` for Git.
- **Linux:** use your package manager, e.g. `sudo apt install git`, or the Node.js site.

---

## 2. Get the code

The repository is private. The project owner must add you as a collaborator, and you must be signed in to GitHub on your computer. The easiest way is the GitHub CLI:

```powershell
gh auth login
```

Then clone and enter the folder (identical on macOS and Linux):

```powershell
git clone https://github.com/Azimlearning/Only-Finance.git
cd Only-Finance
```

---

## 3. Install dependencies

Run once from the repo root:

```powershell
npm --prefix app install
```

Or, working inside `app/`:

```powershell
cd app
npm install
cd ..
```

Warnings are normal. Errors need attention; see Troubleshooting.

---

## 4. Environment file (optional, enables the AI tutor)

The app runs fully without a key. Without one, AI panels show offline template explanations.

**4a. Copy the example.** The file must sit at the **repo root**, not inside `app/`.

```powershell
# Windows PowerShell
Copy-Item .env.example .env.local
```

```bash
# macOS / Linux / Git Bash
cp .env.example .env.local
```

**4b. Fill in the variables** in `.env.local`:

```bash
OPENROUTER_API_KEY=your-key-here
VITE_OPENROUTER_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free
VITE_OPENROUTER_FALLBACK_MODEL=nvidia/nemotron-3.5-lightning:free
```

- `OPENROUTER_API_KEY`: create one at https://openrouter.ai/settings/keys. It is used **server-side only** by the dev proxy. Never commit it. Never add a `VITE_` prefix, because `VITE_` values are visible in the browser.
- The two `VITE_` model lines are model IDs; keep the values above.

**4c. Apply the change.** Variables are read at startup. After editing `.env.local`, press Ctrl+C in the dev server and start it again.

---

## 5. Run the app locally

```powershell
npm --prefix app run dev
```

Open **http://localhost:5173** (or the address the terminal prints).

Jump straight to a screen with a URL hash: `#budget`, `#parity`, `#scenarios`, `#hedging`, `#arbitrage`, `#verify`, `#practice`. Example: `http://localhost:5173/#parity`.

```powershell
# Use a different port
npm --prefix app run dev -- --port 3000

# Reachable from other devices on your network
npm --prefix app run dev -- --host
```

Stop the server with **Ctrl+C**.

---

## 6. Build and verify

```powershell
# Type-check and build for production
npm --prefix app run build

# Run the verification suite (137 checks against the lecturer's workbook)
npm --prefix app test

# Serve the production build (run "build" first), usually on http://localhost:4173
npm --prefix app run preview
```

`build` runs a TypeScript type-check, then the Vite build. `test` must show all 137 checks passing.

---

## 7. Project layout

```text
OnlyFinance/
├── .env.example            Variable names only (committed)
├── .env.local              YOUR secrets (you create it; git-ignored)
├── app/                    The web app
│   ├── src/engine/         Finance maths (pure TypeScript, no UI)
│   ├── src/ai/             AI tutor: OpenRouter client, tools, number guard
│   ├── src/ui/             Screens, sidebar, guided tour
│   ├── src/verify.test.ts  Checks the engine against the course workbook
│   └── vite.config.ts      Dev server and /api/llm proxy
├── context/                Course material (read-only)
└── refdocs/                PRD, status, decisions, changelog
```

| You want to change... | Look in |
|---|---|
| A formula or finance number | `app/src/engine/` |
| The AI tutor's behaviour or prompts | `app/src/ai/` |
| How a screen looks or is laid out | `app/src/ui/` |

After changing a formula, run `npm --prefix app test` and confirm all 137 checks still pass.

---

## 8. Git workflow for the group

```powershell
# 1. Update before starting
git pull

# 2. Branch for your change (never work directly on main)
git checkout -b your-name/short-description

# 3. Make your change, then check it
npm --prefix app run build
npm --prefix app test

# 4. Commit and push
git add <files you changed>
git commit -m "Short description of the change"
git push -u origin your-name/short-description
```

Then open a pull request on GitHub from your branch into `main`, and ask a teammate to review it.

**Never commit `.env.local`.** It holds your API key and is git-ignored. Run `git status` before every commit and do not `git add` it if it appears.

---

## 9. Troubleshooting

| Problem | What to do |
|---|---|
| **Port 5173 is already in use** | Stop the other dev server (Ctrl+C in its terminal), or use another port: `npm --prefix app run dev -- --port 3000`. Find the process on Windows with `netstat -ano \| findstr :5173`. |
| **`npm` is not recognised** | Node.js is missing, or the terminal was opened before installing it. Install Node.js (section 1), then restart the terminal. |
| **AI tutor says "Offline"** | Check, in order: (1) `OPENROUTER_API_KEY` is set in root `.env.local`; (2) the model IDs match section 4b; (3) the free model is rate-limited for the day, so try later; (4) you restarted the dev server after editing `.env.local`. |
| **Blank page** | Press F12, open the **Console** tab, and read the first red error. Share that error when asking for help. |
| **PowerShell: "running scripts is disabled on this system"** | Run once: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` and answer `Y`. This affects only your user account. |
| **Git warns about LF / CRLF line endings** | Harmless on Windows. Ignore it. |
| **Build fails after pulling** | Run `npm --prefix app install` again, since teammates may have added dependencies. |
