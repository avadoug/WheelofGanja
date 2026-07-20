# Deployment guide

## Local production check

```bash
npm install
npm run validate:puzzles
npm run test
npm run simulate:match
npm run build
npm run preview
```

Confirm the landing page, a wheel spin, a vowel purchase, a solve, the next-round transition, the Harvest Vault, custom-pack import, mobile board/wheel tabs, and save/resume.

## Vercel

Push the repository to GitHub and import it into Vercel with:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

No environment variables are required. `vercel.json` contains these settings.

## Static hosting

The `dist` build contains the deployed application. A static host should serve application requests from the generated entry point and preserve asset paths from the root domain.

## Release checklist

- No test or validation failures
- No console errors during a complete match
- Social card and favicon resolve on the deployed domain
- GBS Discord link opens in a new tab
- Browser local storage works on the final domain
- Touch controls remain at least 44 CSS pixels where practical
- Hidden answers do not appear in visible markup or accessible labels during active play
- Disclaimer remains visible in the footer and Knowledge Vault
