import type { Puzzle } from "./types";
import { CONSONANTS, VOWELS, normalizeSolve } from "./engine";

const commonConsonants = "RSTLNCDHMPGBFYWKVXZQ".split("");

function patternRegex(pattern: string): RegExp {
  const source = [...pattern].map((character) => {
    if (character === "_") return "[A-Z]";
    if (/[A-Z0-9]/.test(character)) return character;
    return character === " " ? "\\s" : `\\${character}`;
  }).join("");
  return new RegExp(`^${source}$`, "i");
}

export function aiCandidates(visible: string, category: string, bank: Puzzle[]): string[] {
  const matcher = patternRegex(visible);
  return bank
    .filter((item) => item.category === category && matcher.test(item.answer))
    .map((item) => item.answer);
}

export function chooseAiLetter(visible: string, guessed: string[], category: string, bank: Puzzle[], vowel = false): string {
  const allowed = vowel ? VOWELS : CONSONANTS;
  const unused = allowed.filter((letter) => !guessed.includes(letter));
  const candidates = aiCandidates(visible, category, bank);
  const frequencies = new Map<string, number>();
  for (const answer of candidates) {
    const unique = new Set(answer.replace(/[^A-Z]/g, ""));
    for (const letter of unique) frequencies.set(letter, (frequencies.get(letter) ?? 0) + 1);
  }
  return unused.sort((a, b) => (frequencies.get(b) ?? 0) - (frequencies.get(a) ?? 0) || commonConsonants.indexOf(a) - commonConsonants.indexOf(b))[0] ?? unused[0];
}

export function chooseAiSolve(visible: string, category: string, bank: Puzzle[], confidence: number): string | null {
  const knownRatio = [...visible].filter((character) => /[A-Z0-9]/.test(character)).length / Math.max(1, [...visible].filter((character) => /[A-Z0-9_]/.test(character)).length);
  if (knownRatio < confidence) return null;
  const candidates = aiCandidates(visible, category, bank);
  return candidates.length === 1 ? normalizeSolve(candidates[0]) : null;
}
