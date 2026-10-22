# launchpilot-web

Create the app shell for LaunchPilot, a supply-chain copilot for a cosmetics brand's product launch. English UI, React with TypeScript, Tailwind and shadcn/ui. A header with the name "LaunchPilot", the tagline "Sees a launch stockout coming before it happens" and an empty slot on the right for status pills. Below it, four tabs: Launch, Supplier memory, Proof, Agent traces, each with a placeholder for now. Light and dark themes with a toggle. No backend, no Supabase, no authentication, no sample data: a typed API client and recorded data will be added to the repo next.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c2209b77-25db-48f2-8245-e29ee6fc39d9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## LaunchPilot

This is LaunchPilot's web frontend. The backend, agents and data live in [beverage/launchpilot](https://github.com/beverage/launchpilot); this app reaches them only through `src/lib/api.ts`, and runs on recorded data from `src/mocks` while `VITE_API_URL` is empty. How to work on it in Lovable and locally: [LOVABLE.md](LOVABLE.md). `Dockerfile` builds it as a Node server for Aiven Runtime.
