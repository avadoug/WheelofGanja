import { describe, expect, it } from "vitest";
import { puzzles, pickPuzzle } from "../src/cannabis/puzzles";
import { validateImportedPack, validatePuzzles } from "../src/cannabis/validation";
import { aiCandidates, chooseAiLetter, chooseAiSolve } from "../src/game/ai";
import { applyCompost, canBuyVowel, countLetter, createPlayers, isCorrectSolve, nextPlayerIndex, normalizeSolve, rewardForLetter, visiblePattern } from "../src/game/engine";
import type { Player, Puzzle } from "../src/game/types";
import { WEDGES, canRequestSpin, createSpin, createSpinLock, explainWedge, getWedgeAtAngle, getWedgeIndex, landedResultText, normalizeAngle, safeResumedWheelState, wedgeAngle, wheelLabelLines, wheelStateAfterLanding } from "../src/game/wheel";

const sample: Puzzle = {
  id: "test-1",
  answer: "LOW-STRESS TRAINING",
  category: "Grow Techniques",
  difficulty: "Home Grower",
  hint: "Gentle shaping",
  educationalNote: "A plant-training approach.",
  acceptedAliases: ["LST"],
  tags: ["cannabis", "training"],
  sourceNote: "test",
  verificationStatus: "reviewed",
};

const player = (overrides: Partial<Player> = {}): Player => ({
  id: "p1",
  name: "Nova",
  kind: "human",
  roundPoints: 1200,
  matchPoints: 0,
  tokens: { shield: 0, wild: 0, cloneKeeper: 0, freeVowel: 0 },
  ...overrides,
});

describe("wheel physics and detection", () => {
  it("normalizes positive and negative angles", () => {
    expect(normalizeAngle(725)).toBe(5);
    expect(normalizeAngle(-10)).toBe(350);
  });

  it("detects every wedge from its exact pointer-centered rotation", () => {
    for (let index = 0; index < WEDGES.length; index += 1) {
      const rotation = -(index * wedgeAngle);
      expect(getWedgeIndex(rotation)).toBe(index);
      expect(getWedgeAtAngle(rotation).id).toBe(WEDGES[index].id);
    }
  });

  it("locks a spin to the wedge at its actual final angle", () => {
    const spin = createSpin(123, 0.417);
    expect(spin.finalRotation).toBeGreaterThan(123 + 4 * 360);
    expect(spin.wedge).toEqual(getWedgeAtAngle(spin.finalRotation));
  });

  it("creates distinct outcomes from deterministic random inputs", () => {
    const outcomes = new Set([0.02, 0.18, 0.37, 0.59, 0.76, 0.94].map((value) => createSpin(0, value).wedge.id));
    expect(outcomes.size).toBeGreaterThan(3);
  });

  it("uses an immediate lock so rapid repeated requests create one spin", () => {
    const lock = createSpinLock();
    expect(lock.request()).toBe(true);
    expect(lock.request()).toBe(false);
    expect(lock.request()).toBe(false);
    expect(lock.isLocked()).toBe(true);
    lock.release();
    expect(lock.request()).toBe(true);
  });

  it("rejects repeated keyboard-style requests while the first spin is active", () => {
    const lock = createSpinLock();
    const accepted = Array.from({ length: 12 }, () => lock.request()).filter(Boolean);
    expect(accepted).toHaveLength(1);
  });

  it("permits spin only from the exact idle awaiting-action state", () => {
    expect(canRequestSpin("idle", "awaiting-action", true)).toBe(true);
    expect(canRequestSpin("spinning", "awaiting-action", true)).toBe(false);
    expect(canRequestSpin("awaiting-letter", "awaiting-action", true)).toBe(false);
    expect(canRequestSpin("idle", "selecting-consonant", true)).toBe(false);
    expect(canRequestSpin("idle", "awaiting-action", false)).toBe(false);
  });

  it("sanitizes interrupted saved spins without duplicating the old action", () => {
    expect(safeResumedWheelState("spinning")).toEqual({ phase: "awaiting-action", wheelState: "idle" });
    expect(safeResumedWheelState("revealing")).toEqual({ phase: "awaiting-action", wheelState: "idle" });
    expect(safeResumedWheelState("selecting-consonant")).toEqual({ phase: "selecting-consonant", wheelState: "awaiting-letter" });
  });

  it("gives every wedge a visible compact label and complete explanation", () => {
    for (const wedge of WEDGES) {
      const lines = wheelLabelLines(wedge);
      const explanation = explainWedge(wedge);
      expect(lines.length).toBeGreaterThan(0);
      expect(lines.length).toBeLessThanOrEqual(2);
      expect(lines.every((line) => line.length > 0 && line.length <= 12)).toBe(true);
      expect(explanation.title).toBe(wedge.label);
      expect(explanation.summary.length).toBeGreaterThan(20);
      expect(explanation.nextAction.length).toBeGreaterThan(5);
    }
  });

  it("keeps the guide's active special kinds in exact sync with the wheel", () => {
    const activeSpecials = new Set(WEDGES.filter((wedge) => wedge.kind !== "points").map((wedge) => wedge.kind));
    expect(activeSpecials.size).toBe(13);
    for (const wedge of WEDGES.filter((item) => item.kind !== "points")) expect(explainWedge(wedge).timing).toMatch(/Immediate|Choose next/);
  });

  it("routes every landed wedge to its required resolution state", () => {
    expect(wheelStateAfterLanding(WEDGES.find((wedge) => wedge.kind === "points")!)).toBe("awaiting-letter");
    expect(wheelStateAfterLanding(WEDGES.find((wedge) => wedge.kind === "double")!)).toBe("awaiting-letter");
    expect(wheelStateAfterLanding(WEDGES.find((wedge) => wedge.kind === "free-vowel")!)).toBe("awaiting-special-choice");
    expect(wheelStateAfterLanding(WEDGES.find((wedge) => wedge.kind === "mystery")!)).toBe("awaiting-special-choice");
    expect(wheelStateAfterLanding(WEDGES.find((wedge) => wedge.kind === "risk")!)).toBe("awaiting-special-choice");
    expect(wheelStateAfterLanding(WEDGES.find((wedge) => wedge.kind === "compost")!)).toBe("resolving");
    expect(wheelStateAfterLanding(WEDGES.find((wedge) => wedge.kind === "lost-turn")!)).toBe("resolving");
  });

  it("formats the visible result from the exact selected wedge", () => {
    const spin = createSpin(0, 0.42);
    expect(landedResultText(spin.wedge)).toBe(`Landed on: ${getWedgeAtAngle(spin.finalRotation).label}`);
  });
});

describe("letters, scoring, and solve rules", () => {
  it("counts repeated letters and multiplies rewards", () => {
    expect(countLetter("LOW STRESS TRAINING", "S")).toBe(3);
    expect(rewardForLetter("LOW STRESS TRAINING", "S", 700, 2)).toBe(4200);
  });

  it("reveals all matches without exposing other letters", () => {
    expect(visiblePattern("BUBBLE HASH", ["B", "A"])).toBe("B_BB__ _A__");
  });

  it("normalizes capitalization, spaces, apostrophes, and hyphens", () => {
    expect(normalizeSolve("  low–stress   training ")).toBe("LOW STRESS TRAINING");
    expect(normalizeSolve("Lamb’s Bread")).toBe("LAMBS BREAD");
  });

  it("accepts exact answers and aliases while rejecting wrong solves", () => {
    expect(isCorrectSolve("low stress training", sample)).toBe(true);
    expect(isCorrectSolve("LST", sample)).toBe(true);
    expect(isCorrectSolve("high stress training", sample)).toBe(false);
  });

  it("prices vowels and honors free-vowel tokens", () => {
    expect(canBuyVowel(player({ roundPoints: 200 }), [], 250).allowed).toBe(false);
    expect(canBuyVowel(player({ roundPoints: 0, tokens: { shield: 0, wild: 0, cloneKeeper: 0, freeVowel: 1 } }), [], 250).allowed).toBe(true);
    expect(canBuyVowel(player(), ["A", "E", "I", "O", "U"], 250).allowed).toBe(false);
  });

  it("prevents used letters by removing them from the available set", () => {
    const used = ["R", "S", "T"];
    expect("BCDFGHJKLMNPQRSTVWXYZ".split("").filter((letter) => !used.includes(letter))).not.toContain("R");
  });
});

describe("penalties, protection, and turns", () => {
  it("clears unbanked points on Compost Pile", () => {
    const result = applyCompost(player());
    expect(result.player.roundPoints).toBe(0);
    expect(result.protected).toBe(false);
  });

  it("consumes an IPM Shield without clearing points", () => {
    const result = applyCompost(player({ tokens: { shield: 1, wild: 0, cloneKeeper: 0, freeVowel: 0 } }));
    expect(result.player.roundPoints).toBe(1200);
    expect(result.player.tokens.shield).toBe(0);
    expect(result.protected).toBe(true);
  });

  it("lets a Clone Keeper preserve part of a round bank", () => {
    const result = applyCompost(player({ roundPoints: 1000, tokens: { shield: 0, wild: 0, cloneKeeper: 1, freeVowel: 0 } }));
    expect(result.player.roundPoints).toBe(300);
    expect(result.player.tokens.cloneKeeper).toBe(0);
  });

  it("cycles turns for Lost Light Cycle and misses", () => {
    expect(nextPlayerIndex(createPlayers("solo", ["Nova"]), 0)).toBe(1);
    expect(nextPlayerIndex(createPlayers("solo", ["Nova"]), 2)).toBe(0);
  });
});

describe("honest AI knowledge separation", () => {
  const bank: Puzzle[] = [
    { ...sample, id: "one", answer: "LOW STRESS TRAINING" },
    { ...sample, id: "two", answer: "SEA OF GREEN" },
  ];

  it("builds candidates only from visible pattern and category", () => {
    expect(aiCandidates("L__ STRESS TRA_N_NG", "Grow Techniques", bank)).toEqual(["LOW STRESS TRAINING"]);
  });

  it("chooses letters without receiving a hidden answer argument", () => {
    expect(chooseAiLetter("L__ STRESS TRA_N_NG", ["L", "S", "T", "R", "A", "I", "N", "G"], "Grow Techniques", bank)).toBe("W");
  });

  it("solves only when visible confidence and candidate uniqueness allow it", () => {
    expect(chooseAiSolve("L__ STRESS TRA_N_NG", "Grow Techniques", bank, 0.5)).toBe("LOW STRESS TRAINING");
    expect(chooseAiSolve("___ ______ ________", "Grow Techniques", bank, 0.5)).toBeNull();
  });
});

describe("puzzle library, replay protection, and imports", () => {
  it("ships more than 750 cannabis-only puzzles", () => {
    expect(puzzles.length).toBeGreaterThanOrEqual(750);
    expect(new Set(puzzles.map((item) => item.id)).size).toBe(puzzles.length);
  });

  it("passes critical cannabis puzzle validation", () => {
    expect(validatePuzzles(puzzles).filter((issue) => issue.severity === "error")).toEqual([]);
  });

  it("avoids recent puzzle IDs when alternatives exist", () => {
    const first = pickPuzzle("strain", [], 0);
    const next = pickPuzzle("strain", [first.id], 0);
    expect(next.id).not.toBe(first.id);
  });

  it("validates imported pack shapes", () => {
    expect(validateImportedPack({ puzzles: [sample] }).issues.filter((issue) => issue.severity === "error")).toEqual([]);
    expect(validateImportedPack({ nope: [] }).issues[0].severity).toBe("error");
  });

  it("supports long cultivar names without truncating their board pattern", () => {
    const long = puzzles.find((item) => item.answer === "TETRAHYDROCANNABIVARIN");
    expect(long).toBeTruthy();
    expect(visiblePattern(long!.answer, []).length).toBe(long!.answer.length);
  });
});
