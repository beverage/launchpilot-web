# Working on this frontend in Lovable

This repo is synced two ways with a Lovable project: edits in Lovable land on `main` here, and commits pushed to `main` show up in Lovable. Work locally on a branch and merge to `main` when it builds; never force-push, rebase or squash `main`.

## Project knowledge (paste into Lovable: Project settings > Knowledge)

```
LaunchPilot spots a product-launch stockout weeks before it happens, by learning how late each supplier really delivers. The user is Claire, supply lead at Maison Aurore, a fictional French cosmetics brand launching a Christmas gift box ("Coffret Rituel Noël") on 2 November 2026. All data is synthetic and the demo replays a recorded scenario of 35 events; the pump component (CMP-POM-01) is the story: at event EV-019 (1 October) a partial delivery makes it likely (82%) to run out the week of 9 November, the week after launch. An attentive planner without memory, who reads every message but believes announced lead times, dates it to 28 December. LaunchPilot draws each supplier's lead time from its delivery history, so it outputs probabilities, not a single date.

Architecture: this app is a frontend only. The backend is a Python FastAPI service on Aiven Runtime with data in Aiven for PostgreSQL and Claude agents behind it. The app talks to it only through src/lib/api.ts (typed client). When VITE_API_URL is empty, src/lib/api.ts serves recorded snapshots from src/mocks, so every screen works without a backend.

Rules:
- Never edit src/lib/api.ts, src/lib/apiError.ts or anything in src/mocks. Import `api`, `API_MODE` and the types from "@/lib/api". Never call fetch directly.
- Do not add Supabase, Lovable Cloud, authentication, a database or any backend code.
- Load API data in the browser only: useQuery and useMutation inside components. No route loaders, no server functions (createServerFn) and no server-side fetching of API data; the recorded mode keeps its state in the browser.
- After any action (nextEvent, fastForward, reset, arbitrate, decide) invalidate every query.
- English UI. Brand, product and supplier names, supplier emails and BODACC notices stay French by design; display them as they come.
- Every agent result shows whether it came from live Claude ("Live", mode === "live") or the deterministic fallback ("Rules"). Events carry no recorded/live or real/synthetic tag. When API_MODE === "mock", show a "Recorded data" pill in the header and hide the Data and Agents pills, which would describe the API the snapshot was recorded from.
- Agent outputs and recommendations are markdown, often with tables: render with react-markdown and remark-gfm.
- Agent names from the API: "watch" is the Watch agent, "arbitration" the Arbitration agent.
- Probabilities arrive as 0 to 1: show them as percentages ("82%").
- Money in euros with no decimals (€742,426). Weeks are Mondays: show "w/c 9 Nov".
- Design: calm, editorial, data-dense, light and dark themes. Severity colours (red high, amber medium, green covered) used sparingly, so the critical pump alert is the single most visible element after fast-forward.
```

## Prompt 1: the shell (sent 22 October; the project started from it)

```
Create the app shell for LaunchPilot, a supply-chain copilot for a cosmetics brand's product launch. English UI, React with TypeScript, Tailwind and shadcn/ui. A header with the name "LaunchPilot", the tagline "Sees a launch stockout coming before it happens" and an empty slot on the right for status pills. Below it, four tabs: Launch, Supplier memory, Proof, Agent traces, each with a placeholder for now. Light and dark themes with a toggle. No backend, no Supabase, no authentication, no sample data: a typed API client and recorded data will be added to the repo next.
```

## Prompt 2: the screens (send after src/lib/api.ts and src/mocks are in the repo)

```
Build the LaunchPilot screens on the typed client in src/lib/api.ts (read it first, and follow the project knowledge). Keep the existing routes: Launch is /, then /supplier-memory, /proof and /agent-traces.

Header pills, in the status-pills slot of AppHeader: Data (state.data.label), Agents ("Claude live · " + model when agents.live_available, otherwise "Rules only"), Dataset (state.data.dataset), and "Recorded data" when API_MODE is "mock". If state.data.error is set, show it as a warning banner.

Launch page:
- KPI row: simulated date, events processed (x / total), critical alerts, revenue at risk.
- Controls: a "Live agent" switch (disabled unless agents.live_available), "Next event", "Fast-forward to EV-019" (disabled once the next event is past EV-019 or state.events_processed equals events_total), "Reset". Show a spinner with the agent's name while a call runs; live calls take 10 to 15 seconds.
- Left column: a table of the gift box components (component, supplier, stockout without memory, stockout with LaunchPilot, probability of a stockout by launch + 1 week, status badge). Under it, a stock projection chart (Recharts) for the component picked in a select, default CMP-POM-01: a shaded band between p10 and p90, the p50 line in blue labelled "LaunchPilot (actual lead times, median)", the without_memory line in grey labelled "Without memory (announced lead times)", a dashed red line at zero and a dashed vertical line at launch_week labelled "Launch".
- Right column: the event feed (latest 6, newest first, as simple expandable rows: kind_label, summary and date; open, the email body and payload fields); alerts as cards (severity colour, component, stockout week, explanation, confidence, trigger event, Live or Rules tag, a collapsible evidence list as monospace chips); on an alert with can_arbitrate, a "Propose solutions" button calling api.arbitrate; when it has scenarios, the recommendation as markdown and up to three scenario cards (total impact large; extra cost, lost revenue, stock tied up small; description; a "Choose this scenario" button calling api.decide); then the decision log.

Supplier memory page: a horizontal grouped bar chart of announced versus real mean lead time per supplier, sorted by the gap, with value labels; a table with standard deviation, typical (median) lead time, deliveries and late deliveries; a caption saying "Computed live by the supplier_reliability view in Aiven for PostgreSQL" when source is "sql_view", otherwise "Computed from the delivery history".

Proof page, from api.proof(): four stat tiles (stockouts dated without memory, x / total; dated by LaunchPilot, x / total; dates wrong by more than a week, LaunchPilot against without memory; LaunchPilot false alarms), a line with the number of seeds and the mean days of warning for each, then a table for the demo seed (component, true stockout week, days of warning without memory or "Missed", days of warning with LaunchPilot or "Missed", probability by launch + 1 week), skipping components whose truth is null. Show the protocol text as the caption, and a "Recorded, not live" tag.

Agent traces page: stat tiles (runs, live runs, average live latency, total tokens); the runs newest first as accordions (agent name, Live or Rules tag, latency, tokens); inside, the output as markdown and each tool call with its name, input JSON and output JSON in a scrollable code block truncated to 1,500 characters.
```

## Running it locally

```bash
npx bun install
npm run dev
```

Lovable keeps `bun.lock`; install with Bun so no `package-lock.json` appears.

- Every build calls the live API on Aiven Runtime: `npm run dev` and Lovable's preview read `VITE_API_URL` from the committed `.env.development`, production builds (Aiven Runtime and Lovable's publish) from `.env.production`.
- The preview's buttons (Reset, Next event, Fast-forward, choosing a scenario) change the shared demo in Aiven for PostgreSQL, the one the deployed apps show.
- To override in dev, use `.env.development.local` (gitignored): Vite ranks `.env.development` above `.env.local`.
  - Recorded data (`API_MODE` is `mock`): `VITE_API_URL=` with no value.
  - A local backend: in the backend repo run `uvicorn api:app --reload --port 8000`, then `VITE_API_URL=http://localhost:8000`.
- `.env.development` and `.env.production` hold a public URL, not a secret. Never put a key in a `VITE_` variable: it ends up in the browser.
