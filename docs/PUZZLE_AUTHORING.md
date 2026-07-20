# Puzzle authoring guide

## Pack format

A pack is a JSON object with a name, optional description, and a `puzzles` array.

```json
{
  "name": "My GBS Party Pack",
  "description": "Private screen-share puzzles",
  "puzzles": [
    {
      "id": "party-keeper-1",
      "answer": "KEEPER SELECTION",
      "category": "Phenohunting",
      "difficulty": "Home Grower",
      "hint": "The plant worth preserving.",
      "educationalNote": "Keeper selection compares observable traits while retaining records and backups.",
      "acceptedAliases": [],
      "tags": ["phenohunting", "cannabis"],
      "sourceNote": "Private host note",
      "verificationStatus": "community"
    }
  ]
}
```

Allowed difficulty values are `Seedling`, `Home Grower`, `Experienced Grower`, `Phenohunter`, and `Breeder Brain`. Verification can be `reviewed`, `community`, or `disputed`.

## Writing rules

- Every answer must be directly connected to cannabis.
- Keep answers to 42 characters when possible.
- Use letters, numbers, spaces, ampersands, apostrophes, periods, and hyphens.
- Use accepted aliases only when the alternative is genuinely equivalent.
- Keep hints useful without restating or exposing the answer.
- Add a compact educational note that separates observation from certainty.
- Do not write medical treatment claims or guaranteed cultivation outcomes.
- Treat disputed lineage as disputed instead of presenting it as fact.
- Prefer cultivar over strain in educational notes when precision matters.

## Workflow

1. Open **Puzzle packs** in the game.
2. Load the example or paste your JSON.
3. Validate and import.
4. Inspect the live board preview.
5. Enable the pack for play.
6. Export a backup before clearing browser data.

Built-in contributors should also run:

```bash
npm run validate:puzzles
npm run test
```
