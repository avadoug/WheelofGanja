export type GamePhase =
  | "landing"
  | "setup"
  | "contestant-intro"
  | "round-start"
  | "awaiting-action"
  | "spinning"
  | "selecting-consonant"
  | "selecting-vowel"
  | "revealing"
  | "solving"
  | "educational-reveal"
  | "turn-transition"
  | "round-complete"
  | "match-complete"
  | "bonus-letter-selection"
  | "bonus-countdown"
  | "bonus-result"
  | "paused";

export type WheelState =
  | "idle"
  | "spinning"
  | "resolving"
  | "awaiting-letter"
  | "awaiting-special-choice"
  | "complete";

export type GameMode =
  | "solo"
  | "local"
  | "party"
  | "sprint"
  | "breeder"
  | "grower"
  | "strain"
  | "custom";

export type Difficulty =
  | "Seedling"
  | "Home Grower"
  | "Experienced Grower"
  | "Phenohunter"
  | "Breeder Brain";

export interface Puzzle {
  id: string;
  answer: string;
  category: string;
  difficulty: Difficulty;
  hint: string;
  educationalNote: string;
  acceptedAliases: string[];
  tags: string[];
  sourceNote: string;
  verificationStatus: "reviewed" | "community" | "disputed";
}

export interface Player {
  id: string;
  name: string;
  kind: "human" | "ai";
  persona?: string;
  roundPoints: number;
  matchPoints: number;
  tokens: {
    shield: number;
    wild: number;
    cloneKeeper: number;
    freeVowel: number;
  };
}

export type WedgeKind =
  | "points"
  | "compost"
  | "lost-turn"
  | "free-vowel"
  | "double"
  | "triple"
  | "wild"
  | "shield"
  | "mystery"
  | "breeder-cut"
  | "harvest-bonus"
  | "clone-keeper"
  | "jackpot"
  | "risk";

export interface Wedge {
  id: string;
  label: string;
  shortLabel: string;
  symbol: string;
  kind: WedgeKind;
  points?: number;
  color: string;
  textColor?: string;
}

export interface AppSettings {
  theme: string;
  highContrast: boolean;
  reducedMotion: boolean;
  largeText: boolean;
  captions: boolean;
  animationSpeed: "show" | "quick" | "instant";
  presenterQuality: "full" | "reduced" | "static";
  vowelCost: number;
  audio: {
    master: boolean;
    music: boolean;
    host: boolean;
    character: boolean;
    wheel: boolean;
    audience: boolean;
    reveal: boolean;
    interface: boolean;
    announcer: boolean;
  };
}

export interface GameStats {
  gamesPlayed: number;
  puzzlesSolved: number;
  solveAttempts: number;
  bestRound: number;
  largestMatchTotal: number;
  categoryWins: Record<string, number>;
  consonants: Record<string, number>;
  vowelsPurchased: number;
  compostCount: number;
  bonusVictories: number;
  fastestSolutionSeconds: number | null;
  currentWinStreak: number;
  recentPuzzleIds: string[];
}

export interface CustomPack {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  puzzles: Puzzle[];
  createdAt: string;
}
