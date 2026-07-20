import type { Puzzle } from "../game/types";

export interface ValidationIssue {
  severity: "error" | "warning";
  puzzleId?: string;
  message: string;
}

const supportedAnswer = /^[A-Z0-9 &'-.]+$/i;
const medicalClaim = /\b(cures|heals|guaranteed treatment|prevents cancer|safe for everyone)\b/i;
const cannabisWords = /cannabis|strain|cultivar|terp|aroma|cannabinoid|grow|plant|breed|pheno|seed|clone|root|leaf|flower|resin|hash|rosin|harvest|cure|light|irrigation|humidity|selection|community|policy|medical|trichome/i;

export function validatePuzzles(items: Puzzle[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seenAnswers = new Set<string>();
  const seenIds = new Set<string>();

  for (const item of items) {
    if (!item.id || seenIds.has(item.id)) issues.push({ severity: "error", puzzleId: item.id, message: "Missing or duplicate puzzle ID." });
    seenIds.add(item.id);
    const key = `${item.category}:${item.answer}`.toUpperCase();
    if (seenAnswers.has(key)) issues.push({ severity: "error", puzzleId: item.id, message: "Duplicate answer in category." });
    seenAnswers.add(key);
    if (!item.answer.trim()) issues.push({ severity: "error", puzzleId: item.id, message: "Answer is empty." });
    if (!supportedAnswer.test(item.answer)) issues.push({ severity: "error", puzzleId: item.id, message: "Answer contains unsupported characters." });
    if (item.answer.length > 42) issues.push({ severity: "warning", puzzleId: item.id, message: "Answer may be difficult to fit on compact boards." });
    if (!item.category) issues.push({ severity: "error", puzzleId: item.id, message: "Category is missing." });
    if (!item.difficulty) issues.push({ severity: "error", puzzleId: item.id, message: "Difficulty is missing." });
    if (!item.educationalNote?.trim()) issues.push({ severity: "error", puzzleId: item.id, message: "Educational note is empty." });
    if (medicalClaim.test(`${item.hint} ${item.educationalNote}`)) issues.push({ severity: "error", puzzleId: item.id, message: "Questionable medical claim detected." });
    if (!cannabisWords.test(`${item.category} ${item.educationalNote} ${item.tags.join(" ")}`)) issues.push({ severity: "warning", puzzleId: item.id, message: "Cannabis relevance needs review." });
    for (const alias of item.acceptedAliases) {
      if (!alias.trim() || alias.toUpperCase() === item.answer.toUpperCase()) issues.push({ severity: "warning", puzzleId: item.id, message: "Broken or redundant alias." });
    }
  }
  return issues;
}

export function validateImportedPack(value: unknown): { puzzles: Puzzle[]; issues: ValidationIssue[] } {
  if (!value || typeof value !== "object") return { puzzles: [], issues: [{ severity: "error", message: "Pack must be a JSON object." }] };
  const possible = value as { puzzles?: unknown };
  if (!Array.isArray(possible.puzzles)) return { puzzles: [], issues: [{ severity: "error", message: "Pack needs a puzzles array." }] };
  const items = possible.puzzles.filter((item): item is Puzzle => Boolean(item && typeof item === "object" && "answer" in item && "category" in item));
  return { puzzles: items, issues: validatePuzzles(items) };
}
