import type { Player, Puzzle } from "./types";

export const VOWELS = ["A", "E", "I", "O", "U"];
export const CONSONANTS = "BCDFGHJKLMNPQRSTVWXYZ".split("");

export function normalizeSolve(value: string): string {
  return value
    .normalize("NFKD")
    .toUpperCase()
    .replace(/[’']/g, "")
    .replace(/[-–—]/g, " ")
    .replace(/[^A-Z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isCorrectSolve(attempt: string, puzzle: Puzzle): boolean {
  const normalized = normalizeSolve(attempt);
  return [puzzle.answer, ...puzzle.acceptedAliases].some((value) => normalizeSolve(value) === normalized);
}

export function countLetter(answer: string, letter: string): number {
  return [...answer.toUpperCase()].filter((character) => character === letter.toUpperCase()).length;
}

export function rewardForLetter(answer: string, letter: string, wedgePoints: number, multiplier = 1): number {
  return countLetter(answer, letter) * wedgePoints * multiplier;
}

export function visiblePattern(answer: string, guessed: string[]): string {
  const used = new Set(guessed.map((letter) => letter.toUpperCase()));
  return [...answer.toUpperCase()].map((character) => {
    if (/[A-Z0-9]/.test(character)) return used.has(character) || /[0-9]/.test(character) ? character : "_";
    return character;
  }).join("");
}

export function applyCompost(player: Player): { player: Player; protected: boolean } {
  if (player.tokens.shield > 0) {
    return { player: { ...player, tokens: { ...player.tokens, shield: player.tokens.shield - 1 } }, protected: true };
  }
  const kept = player.tokens.cloneKeeper > 0 ? Math.floor(player.roundPoints * 0.3) : 0;
  return {
    player: {
      ...player,
      roundPoints: kept,
      tokens: { ...player.tokens, cloneKeeper: Math.max(0, player.tokens.cloneKeeper - 1) },
    },
    protected: false,
  };
}

export function nextPlayerIndex(players: Player[], current: number): number {
  return (current + 1) % players.length;
}

export function canBuyVowel(player: Player, guessed: string[], cost: number): { allowed: boolean; reason: string } {
  if (VOWELS.every((letter) => guessed.includes(letter))) return { allowed: false, reason: "Every vowel has already been tested." };
  if (player.tokens.freeVowel > 0) return { allowed: true, reason: "Use your Free Vowel token." };
  if (player.roundPoints < cost) return { allowed: false, reason: `You need ${cost.toLocaleString()} round points.` };
  return { allowed: true, reason: `Costs ${cost.toLocaleString()} round points.` };
}

export function createPlayers(mode: string, names: string[]): Player[] {
  const humans = mode === "solo" || mode === "sprint" || mode === "breeder" || mode === "grower" || mode === "strain" ? 1 : mode === "party" ? 3 : 2;
  const base: Player[] = Array.from({ length: humans }, (_, index) => ({
    id: `human-${index + 1}`,
    name: names[index]?.trim() || `Grower ${index + 1}`,
    kind: "human" as const,
    roundPoints: 0,
    matchPoints: 0,
    tokens: { shield: 0, wild: 0, cloneKeeper: 0, freeVowel: 0 },
  }));
  if (humans === 1 && mode !== "sprint") {
    base.push(
      { id: "ai-tina", name: "Terpene Tina", persona: "sensory", kind: "ai", roundPoints: 0, matchPoints: 0, tokens: { shield: 0, wild: 0, cloneKeeper: 0, freeVowel: 0 } },
      { id: "ai-larry", name: "LED Larry", persona: "environment", kind: "ai", roundPoints: 0, matchPoints: 0, tokens: { shield: 0, wild: 0, cloneKeeper: 0, freeVowel: 0 } },
    );
  }
  return base;
}
