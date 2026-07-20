import type { Wedge } from "./types";

export const WEDGES: Wedge[] = [
  { id: "gp-500", label: "500 Grow Points", shortLabel: "500", symbol: "◆", kind: "points", points: 500, color: "#ffd166", textColor: "#11170f" },
  { id: "compost", label: "Compost Pile", shortLabel: "COMPOST", symbol: "♻", kind: "compost", color: "#20251d" },
  { id: "gp-650", label: "650 Grow Points", shortLabel: "650", symbol: "◆", kind: "points", points: 650, color: "#8ef0c0", textColor: "#101812" },
  { id: "lost", label: "Lost the Light Cycle", shortLabel: "LIGHTS OUT", symbol: "◐", kind: "lost-turn", color: "#8946d6" },
  { id: "free-vowel", label: "Free Vowel", shortLabel: "FREE VOWEL", symbol: "A", kind: "free-vowel", color: "#3ed5c2", textColor: "#0a1716" },
  { id: "gp-800", label: "800 Grow Points", shortLabel: "800", symbol: "◆", kind: "points", points: 800, color: "#ff8d65", textColor: "#1b0d08" },
  { id: "double", label: "Double Yield", shortLabel: "2× YIELD", symbol: "×2", kind: "double", points: 500, color: "#f7c948", textColor: "#17130a" },
  { id: "shield", label: "IPM Shield", shortLabel: "IPM SHIELD", symbol: "⬡", kind: "shield", color: "#2da9ff" },
  { id: "gp-700", label: "700 Grow Points", shortLabel: "700", symbol: "◆", kind: "points", points: 700, color: "#da77ff", textColor: "#160b1c" },
  { id: "mystery", label: "Mystery Seed", shortLabel: "MYSTERY", symbol: "?", kind: "mystery", color: "#ff4f8b" },
  { id: "clone", label: "Clone Keeper", shortLabel: "CLONE", symbol: "↟", kind: "clone-keeper", color: "#63d471", textColor: "#071509" },
  { id: "gp-1000", label: "1000 Grow Points", shortLabel: "1000", symbol: "◆", kind: "points", points: 1000, color: "#fcbf49", textColor: "#1c1303" },
  { id: "triple", label: "Triple Yield", shortLabel: "3× YIELD", symbol: "×3", kind: "triple", points: 500, color: "#ff6b6b", textColor: "#1c0808" },
  { id: "wild", label: "Wild Terpene", shortLabel: "WILD TERP", symbol: "✦", kind: "wild", color: "#9b5de5" },
  { id: "jackpot", label: "Phenotype Jackpot", shortLabel: "PHENO JACKPOT", symbol: "♛", kind: "jackpot", points: 1200, color: "#f15bb5" },
  { id: "risk", label: "Risk the Crop", shortLabel: "RISK CROP", symbol: "!", kind: "risk", color: "#f3722c" },
  { id: "breeder", label: "Breeder's Cut", shortLabel: "BREEDER CUT", symbol: "✂", kind: "breeder-cut", points: 900, color: "#00bbf9", textColor: "#061318" },
  { id: "harvest", label: "Harvest Bonus", shortLabel: "HARVEST", symbol: "✺", kind: "harvest-bonus", points: 1100, color: "#90be6d", textColor: "#0e150b" },
];

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

export function createSpin(currentRotation: number, random = Math.random()): { finalRotation: number; wedge: Wedge } {
  const extraTurns = 5 + Math.floor(random * 4);
  const fractional = (random * 360 + wedgeAngle * 0.18) % 360;
  const finalRotation = currentRotation + extraTurns * 360 + fractional;
  return { finalRotation, wedge: getWedgeAtAngle(finalRotation) };
}
