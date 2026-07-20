# Quick Start

```bash
npm install
npm run dev
```

Open the local URL printed in the terminal. No account, API key, database, or paid service is required.

## The Great Ganja Spin

The Great Ganja Spin is an original browser-based cannabis word-wheel game. Spin a precision grow-room dial, guess consonants, buy vowels with fictional Grow Points, solve cannabis-only boards, learn the context behind each answer, and send the match winner into the Harvest Vault bonus round.

The presentation, title, characters, stage, dialogue, wheel wedges, puzzle data, and sounds are original. The project is not affiliated with any television game show or celebrity.

## Highlights

- Complete playable match flow from lobby through the Harvest Vault
- Solo play against two pattern-based AI contestants
- Local Smoke Circle and three-player GBS Party Mode
- Terpene Sprint, Breeder's Challenge, Grower's Challenge, Strain Hunter, and Custom Game modes
- Fair animated wheel whose final angle determines the wedge
- Consonant scoring, vowel purchases, solves, turn passing, and protected/recoverable Compost Pile results
- Free Vowel, Double Yield, Triple Yield, Wild Terpene, IPM Shield, Mystery Seed, Clone Keeper, Phenotype Jackpot, Risk the Crop, Breeder's Cut, and Harvest Bonus wedges
- 1,100+ cannabis-related puzzles across 17 categories
- Honest AI functions that receive the visible pattern, category, guessed letters, and a candidate bank—not a hidden-answer parameter
- Searchable Cannabis Knowledge Vault with cautious definitions
- Custom JSON puzzle-pack validation, import, local enable/disable, preview, export, and deletion
- Versioned local save, resume, settings, statistics, achievement, and replay-history storage
- Seven selectable grow-stage themes
- Keyboard-friendly controls, visible focus, reduced motion, high contrast, large text, captions, written wheel outcomes, and mobile board/wheel switching
- Original procedural Web Audio cues with graceful silence
- Standard static Vite build, GitHub-ready source, Vercel configuration, and Sites-compatible packaging

## Technology

- React 19 and TypeScript
- Vite 8
- CSS with responsive layouts and code-native stage artwork
- Vitest for rules, wheel, data, AI, and validation tests
- Playwright for desktop and mobile critical-flow tests
- Browser local storage for optional device-local data

Node.js 22.13 or newer is required.

## Commands

```bash
npm run dev              # local development with hot reload
npm run build            # production build to dist
npm run preview          # serve the production build
npm run test             # unit and integration tests
npm run test:e2e         # Playwright browser tests
npm run validate:puzzles # cannabis puzzle validation
npm run simulate:match   # deterministic full-match engine simulation
npm run lint             # source linting
```

If Playwright browsers are not already present, install them once with `npx playwright install chromium` before `npm run test:e2e`.

## Project structure

```text
index.html                metadata and Vite entry document
src/
  main.tsx                React application entry
  styles.css              visual system and responsive layouts
  cannabis/
    glossary.ts           Knowledge Vault entries
    puzzles.ts            generated and curated cannabis puzzle bank
    validation.ts         pack and puzzle validators
  components/
    SiteApp.tsx           pages, stage, and game interaction
  game/
    ai.ts                 visible-pattern AI candidate logic
    engine.ts             solve, reveal, scoring, vowel, and penalty rules
    types.ts              phases and domain types
    wheel.ts              wedges, spin generation, and angle detection
  storage/
    local.ts              versioned local settings, stats, packs, and saves
scripts/
  validate-puzzles.ts
  simulate-match.ts
tests/
  game-engine.test.ts
e2e/
  game.spec.ts
public/
  og.png                  original social-sharing artwork
sites-worker/
  index.js                tiny static asset adapter for Sites hosting
```

## Puzzle validation

`npm run validate:puzzles` checks the built-in library for duplicate IDs and answers, unsupported characters, missing categories or difficulty, empty educational notes, broken aliases, questionable medical claims, overly long phrases, and cannabis relevance.

Custom packs run the same critical checks in the browser before they are accepted. See [Puzzle authoring](docs/PUZZLE_AUTHORING.md) for the JSON schema and workflow.

## Saving and privacy

The game stores settings, statistics, recent puzzle IDs, custom packs, player names, and the active match in browser local storage. Corrupt or incompatible saves fall back safely. The game does not collect personal information, load analytics, or require a network call for gameplay.

As with any static client game, a determined person can inspect bundled puzzle data or local saves. The interface and accessibility labels avoid casual answer leakage, but the data is not cryptographically secret.

## Production build

```bash
npm run build
npm run preview
```

The production artifact is written to `dist`. Essential game data and artwork ship with the build; gameplay does not depend on a development server.

## Upload to GitHub

Create an empty repository in GitHub, then run these exact commands from this project folder:

```bash
git init
git add .
git commit -m "Initial Great Ganja Spin release"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

Replace only `YOUR_GITHUB_REPOSITORY_URL` with the URL GitHub gives you.

## Deploy to Vercel

1. Push the project to GitHub.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Confirm these settings:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

4. Deploy. No environment variables are required.
5. Test a complete match and refresh/resume flow on the assigned domain.

`vercel.json` contains the matching build settings. More detail is in [Deployment](docs/DEPLOYMENT.md).

## Extending the game

- Add puzzles or categories in `src/cannabis/puzzles.ts`, then run validation and tests.
- Add glossary entries in `src/cannabis/glossary.ts`.
- Add an AI personality by extending `createPlayers` and its category preferences; do not pass the active hidden answer into its decision functions.
- Add a wedge in `src/game/wheel.ts`, then implement its explicit resolution in `SiteApp.tsx` and add tests.
- Add a stage theme by defining a `data-theme` variable block in `src/styles.css` and a picker entry in `SiteApp.tsx`.
- Replace procedural art or audio using [Assets and themes](docs/ASSETS_AND_THEMES.md).

## Troubleshooting

- **The page is blank:** confirm Node 22.13+ and rerun `npm install`.
- **A saved game will not resume:** the game discards corrupt/incompatible data. Start a new match; custom packs and statistics use separate records.
- **A custom pack will not import:** use the on-page example and fix every validation error. Warnings may still import.
- **The wheel appears instant:** turn off Reduced Motion and choose Full Show or Quick Trim.
- **No sound:** enable Master and Interface audio, then interact once with the page so the browser can start audio.
- **Playwright cannot launch:** run `npx playwright install chromium` once or use a machine with the browser cache available.

## Known limitations

- Multiplayer is local/screen-shared; there is no online room server or synchronized remote state.
- Sound is synthesized in the browser rather than delivered as a full recorded music and voice pack.
- Bud and Sativa are original code-native illustrated portraits, not fully rigged 3D characters or voice performances.
- AI inference is intentionally local and candidate-based. It is convincing for the shipped category bank but is not a language model and may perform poorly on highly unusual private packs.
- Historical, medical, lineage, and sensory information is deliberately cautious. The game is educational entertainment, not a source of medical, legal, genetic-authentication, or cultivation advice.
- Client-side puzzle data can be inspected by determined players.

## Disclaimer and credits

Built for Growers who really grow, Breeders who really breed, and Smokers who respect the plant. Join the [GBS Discord](https://discord.gg/YxJYnnKWHf).

This game is designed for entertainment and cannabis education. It does not provide medical, legal, or cultivation advice and does not sell or distribute cannabis or cannabis products. Grow Points and all rewards are fictional and have no real-world monetary value.

Version 1.0.0.
