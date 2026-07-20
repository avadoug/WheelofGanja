import { puzzles, puzzleCategories } from "../src/cannabis/puzzles.ts";
import { validatePuzzles } from "../src/cannabis/validation.ts";

const issues = validatePuzzles(puzzles);
const errors = issues.filter((issue) => issue.severity === "error");
const warnings = issues.filter((issue) => issue.severity === "warning");

console.log(`Validated ${puzzles.length} puzzles across ${puzzleCategories.length} categories.`);
console.log(`${errors.length} errors · ${warnings.length} warnings`);

for (const issue of [...errors, ...warnings].slice(0, 20)) {
  console.log(`${issue.severity.toUpperCase()} ${issue.puzzleId ?? "pack"}: ${issue.message}`);
}

if (puzzles.length < 750 || errors.length > 0) process.exitCode = 1;
