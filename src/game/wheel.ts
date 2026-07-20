import type { GamePhase, Wedge, WedgeKind, WheelState } from "./types";

export const WEDGES: Wedge[] = [
  { id: "gp-500", label: "500 Grow Points", shortLabel: "500", symbol: "◆", kind: "points", points: 500, color: "#ffd166", textColor: "#11170f" },
  { id: "compost", label: "Compost Pile", shortLabel: "COMPOST", symbol: "♻", kind: "compost", color: "#20251d" },
  { id: "gp-750", label: "750 Grow Points", shortLabel: "750", symbol: "◆", kind: "points", points: 750, color: "#8ef0c0", textColor: "#101812" },
  { id: "lost", label: "Lost the Light Cycle", shortLabel: "LOST TURN", symbol: "◐", kind: "lost-turn", color: "#8946d6" },
  { id: "free-vowel", label: "Free Vowel", shortLabel: "FREE VOWEL", symbol: "A", kind: "free-vowel", color: "#3ed5c2", textColor: "#0a1716" },
  { id: "gp-1000", label: "1000 Grow Points", shortLabel: "1000", symbol: "◆", kind: "points", points: 1000, color: "#ff8d65", textColor: "#1b0d08" },
  { id: "double", label: "Double Yield", shortLabel: "DOUBLE YIELD", symbol: "×2", kind: "double", points: 500, color: "#f7c948", textColor: "#17130a" },
  { id: "shield", label: "IPM Shield", shortLabel: "IPM SHIELD", symbol: "⬡", kind: "shield", color: "#2da9ff" },
  { id: "gp-400", label: "400 Grow Points", shortLabel: "400", symbol: "◆", kind: "points", points: 400, color: "#da77ff", textColor: "#160b1c" },
  { id: "mystery", label: "Mystery Seed", shortLabel: "MYSTERY SEED", symbol: "?", kind: "mystery", color: "#ff4f8b" },
  { id: "clone", label: "Clone Keeper", shortLabel: "CLONE KEEPER", symbol: "↟", kind: "clone-keeper", color: "#63d471", textColor: "#071509" },
  { id: "gp-1500", label: "1500 Grow Points", shortLabel: "1500", symbol: "◆", kind: "points", points: 1500, color: "#fcbf49", textColor: "#1c1303" },
  { id: "triple", label: "Triple Yield", shortLabel: "TRIPLE YIELD", symbol: "×3", kind: "triple", points: 500, color: "#ff6b6b", textColor: "#1c0808" },
  { id: "wild", label: "Wild Terpene", shortLabel: "WILD TERP", symbol: "✦", kind: "wild", color: "#9b5de5" },
  { id: "jackpot", label: "Phenotype Jackpot", shortLabel: "PHENO JACKPOT", symbol: "♛", kind: "jackpot", points: 1500, color: "#f15bb5" },
  { id: "risk", label: "Risk the Crop", shortLabel: "RISK THE CROP", symbol: "!", kind: "risk", color: "#f3722c" },
  { id: "breeder", label: "Breeder's Cut", shortLabel: "BREEDER CUT", symbol: "✂", kind: "breeder-cut", points: 900, color: "#00bbf9", textColor: "#061318" },
  { id: "harvest", label: "Harvest Bonus", shortLabel: "HARVEST BONUS", symbol: "✺", kind: "harvest-bonus", points: 1100, color: "#90be6d", textColor: "#0e150b" },
];

export interface WedgeExplanation {
  title: string;
  summary: string;
  timing: "Immediate" | "Choose next";
  turn: string;
  points: string;
  nextAction: string;
}

const SPECIAL_GUIDE: Record<Exclude<WedgeKind, "points">, Omit<WedgeExplanation, "title">> = {
  compost: { summary: "Lose unbanked round Grow Points. An IPM Shield blocks it; a Clone Keeper preserves 30%.", timing: "Immediate", turn: "Turn ends after resolution.", points: "Unbanked points may be lost.", nextAction: "Wait for the next contestant." },
  "lost-turn": { summary: "The active turn ends immediately while all current round points stay safe.", timing: "Immediate", turn: "Turn ends.", points: "No points are lost.", nextAction: "Wait for the next contestant." },
  "free-vowel": { summary: "Choose one unused vowel without paying Grow Points.", timing: "Choose next", turn: "Turn continues on a match.", points: "No vowel cost.", nextAction: "Choose one unused vowel." },
  double: { summary: "Guess a consonant. Every matching copy earns twice the 500-point base value.", timing: "Choose next", turn: "Turn continues on a match.", points: "1,000 per matching letter.", nextAction: "Choose one unused consonant." },
  triple: { summary: "Guess a consonant. Every matching copy earns three times the 500-point base value.", timing: "Choose next", turn: "Turn continues on a match.", points: "1,500 per matching letter.", nextAction: "Choose one unused consonant." },
  wild: { summary: "Bank a Wild Terpene token that boosts the next successful consonant multiplier.", timing: "Immediate", turn: "You keep control.", points: "No points are lost.", nextAction: "Spin, buy a vowel, or solve." },
  shield: { summary: "Bank protection from one future Compost Pile result.", timing: "Immediate", turn: "You keep control.", points: "Protects the full round bank once.", nextAction: "Spin, buy a vowel, or solve." },
  mystery: { summary: "Keep a safe 400-point reward or open the seed packet for a hidden result.", timing: "Choose next", turn: "Depends on your choice and result.", points: "Safe reward or hidden outcome.", nextAction: "Choose Safe Reward or Open Packet." },
  "breeder-cut": { summary: "A premium consonant wedge paying 900 Grow Points for every matching copy.", timing: "Choose next", turn: "Turn continues on a match.", points: "900 per matching letter.", nextAction: "Choose one unused consonant." },
  "harvest-bonus": { summary: "A premium consonant wedge paying 1,100 Grow Points for every matching copy.", timing: "Choose next", turn: "Turn continues on a match.", points: "1,100 per matching letter.", nextAction: "Choose one unused consonant." },
  "clone-keeper": { summary: "Bank a token that preserves 30% of your round score from one Compost Pile.", timing: "Immediate", turn: "You keep control.", points: "Protects part of the round bank once.", nextAction: "Spin, buy a vowel, or solve." },
  jackpot: { summary: "A top-value consonant wedge paying 1,500 per match, plus jackpot stage fanfare.", timing: "Choose next", turn: "Turn continues on a match.", points: "1,500 per matching letter.", nextAction: "Choose one unused consonant." },
  risk: { summary: "Keep your current round bank safe or risk half of it for a chance to double it and add 500.", timing: "Choose next", turn: "You keep control after choosing.", points: "Possible gain or 50% loss.", nextAction: "Choose Keep Safe or Risk It." },
};

export function explainWedge(wedge: Wedge): WedgeExplanation {
  if (wedge.kind === "points") {
    return { title: wedge.label, summary: "Correct consonants earn this amount for every matching copy of the letter.", timing: "Choose next", turn: "Turn continues on a match.", points: `${wedge.points?.toLocaleString()} per matching letter.`, nextAction: "Choose one unused consonant." };
  }
  return { title: wedge.label, ...SPECIAL_GUIDE[wedge.kind] };
}

export function wheelLabelLines(wedge: Wedge): string[] {
  if (wedge.kind === "points") return [String(wedge.points)];
  const words = wedge.shortLabel.split(" ");
  if (words.length <= 2) return words;
  return [words.slice(0, 2).join(" "), words.slice(2).join(" ")];
}

export function wheelStateAfterLanding(wedge: Wedge): WheelState {
  if (wedge.kind === "compost" || wedge.kind === "lost-turn") return "resolving";
  if (["free-vowel", "mystery", "risk"].includes(wedge.kind)) return "awaiting-special-choice";
  if (["wild", "shield", "clone-keeper"].includes(wedge.kind)) return "complete";
  return "awaiting-letter";
}

export function landedResultText(wedge: Wedge): string {
  return `Landed on: ${wedge.label}`;
}

export const wedgeAngle = 360 / WEDGES.length;

export function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

export function getWedgeIndex(rotationDegrees: number): number {
  const pointerAngle = normalizeAngle(360 - normalizeAngle(rotationDegrees));
  return Math.floor((pointerAngle + wedgeAngle / 2) / wedgeAngle) % WEDGES.length;
}

export function getWedgeAtAngle(rotationDegrees: number): Wedge {
  return WEDGES[getWedgeIndex(rotationDegrees)];
}

export interface SpinPlan {
  startingRotation: number;
  finalRotation: number;
  finalNormalizedAngle: number;
  wedgeIndex: number;
  wedge: Wedge;
}

export function createSpin(currentRotation: number, random = Math.random()): SpinPlan {
  const safeRandom = Math.min(0.999999, Math.max(0, random));
  const targetIndex = Math.floor(safeRandom * WEDGES.length);
  const jitter = (safeRandom * 1.937 % 1 - 0.5) * wedgeAngle * 0.48;
  const desiredNormalized = normalizeAngle(-(targetIndex * wedgeAngle) + jitter);
  const delta = normalizeAngle(desiredNormalized - normalizeAngle(currentRotation));
  const extraTurns = 5 + Math.floor(safeRandom * 4);
  const finalRotation = currentRotation + extraTurns * 360 + delta;
  const wedgeIndex = getWedgeIndex(finalRotation);
  return { startingRotation: currentRotation, finalRotation, finalNormalizedAngle: normalizeAngle(finalRotation), wedgeIndex, wedge: WEDGES[wedgeIndex] };
}

export function canRequestSpin(wheelState: WheelState, gamePhase: GamePhase, activePlayerCanSpin: boolean): boolean {
  return wheelState === "idle" && gamePhase === "awaiting-action" && activePlayerCanSpin;
}

export function createSpinLock() {
  let locked = false;
  return {
    request() { if (locked) return false; locked = true; return true; },
    release() { locked = false; },
    isLocked() { return locked; },
  };
}

export function safeResumedWheelState(phase: GamePhase, savedWheelState?: WheelState): { phase: GamePhase; wheelState: WheelState } {
  if (["spinning", "revealing", "turn-transition"].includes(phase)) return { phase: "awaiting-action", wheelState: "idle" };
  if (phase === "selecting-consonant" || phase === "selecting-vowel") return { phase, wheelState: "awaiting-letter" };
  if (phase === "awaiting-action" && savedWheelState === "awaiting-special-choice") return { phase, wheelState: "awaiting-special-choice" };
  return { phase, wheelState: phase === "awaiting-action" ? "idle" : "complete" };
}
