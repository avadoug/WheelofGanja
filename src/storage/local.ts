import type { AppSettings, CustomPack, GameStats } from "../game/types";

const SETTINGS_KEY = "ggs.settings.v2";
const STATS_KEY = "ggs.stats.v2";
const PACKS_KEY = "ggs.packs.v2";
export const SAVE_KEY = "ggs.active-game.v2";

export const defaultSettings: AppSettings = {
  theme: "green-room",
  highContrast: false,
  reducedMotion: false,
  largeText: false,
  captions: true,
  animationSpeed: "quick",
  presenterQuality: "full",
  vowelCost: 250,
  audio: { master: true, music: false, host: true, character: true, wheel: true, audience: true, reveal: true, interface: true, announcer: false },
};

export const defaultStats: GameStats = {
  gamesPlayed: 0,
  puzzlesSolved: 0,
  solveAttempts: 0,
  bestRound: 0,
  largestMatchTotal: 0,
  categoryWins: {},
  consonants: {},
  vowelsPurchased: 0,
  compostCount: 0,
  bonusVictories: 0,
  fastestSolutionSeconds: null,
  currentWinStreak: 0,
  recentPuzzleIds: [],
};

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "null");
    if (Array.isArray(fallback)) return (Array.isArray(parsed) ? parsed : fallback) as T;
    return parsed && typeof parsed === "object" ? { ...fallback, ...parsed } : fallback;
  } catch {
    return fallback;
  }
}

export const loadSettings = () => {
  const loaded = safeRead(SETTINGS_KEY, defaultSettings);
  return { ...defaultSettings, ...loaded, audio: { ...defaultSettings.audio, ...loaded.audio } };
};
export const loadStats = () => safeRead(STATS_KEY, defaultStats);
export const loadPacks = () => safeRead<CustomPack[]>(PACKS_KEY, []);

export function saveSettings(value: AppSettings) { window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(value)); }
export function saveStats(value: GameStats) { window.localStorage.setItem(STATS_KEY, JSON.stringify(value)); }
export function savePacks(value: CustomPack[]) { window.localStorage.setItem(PACKS_KEY, JSON.stringify(value)); }

export function saveActiveGame(value: unknown) {
  window.localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 2, savedAt: new Date().toISOString(), state: value }));
}

export function loadActiveGame<T>(): T | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SAVE_KEY) ?? "null") as { version?: number; state?: T } | null;
    if (!parsed?.state) return null;
    if (parsed.version === 1 || parsed.version === 2) return parsed.state;
    return null;
  } catch {
    window.localStorage.removeItem(SAVE_KEY);
    return null;
  }
}

export function clearActiveGame() { window.localStorage.removeItem(SAVE_KEY); }
