<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## LaunchPilot frontend

- This repo is the web frontend only. The backend is `api.py` in [beverage/launchpilot](https://github.com/beverage/launchpilot); this app reaches it only through `src/lib/api.ts`.
- `src/lib/api.ts`, `src/lib/apiError.ts` and `src/mocks/` are the contract with the backend: change them only together with `api.py`, never from a Lovable prompt.
- Rules, the project knowledge pasted into Lovable, the prompts and how to run locally: [LOVABLE.md](LOVABLE.md).
- Never put a key in a `VITE_` variable or in `.env`: both end up in the browser.
- Supplier health uses browser-only suspense queries behind ClientOnly, with the demo-clock filter in URL search parameters, so recorded state stays in the browser and the selected view survives navigation.
