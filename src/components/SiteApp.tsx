"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { glossary } from "../cannabis/glossary";
import { pickPuzzle, puzzleCategories, puzzles, puzzlesForMode } from "../cannabis/puzzles";
import { validateImportedPack, validatePuzzles } from "../cannabis/validation";
import { chooseAiLetter, chooseAiSolve } from "../game/ai";
import { CONSONANTS, VOWELS, applyCompost, canBuyVowel, countLetter, createPlayers, isCorrectSolve, nextPlayerIndex, visiblePattern } from "../game/engine";
import type { AppSettings, CustomPack, GameMode, GamePhase, GameStats, Player, Puzzle, Wedge } from "../game/types";
import { WEDGES, createSpin } from "../game/wheel";
import { SAVE_KEY, clearActiveGame, defaultSettings, defaultStats, loadActiveGame, loadPacks, loadSettings, loadStats, saveActiveGame, savePacks, saveSettings, saveStats } from "../storage/local";

type View = "home" | "game" | "how" | "vault" | "packs" | "stats" | "about";

interface SavedGame {
  mode: GameMode;
  phase: GamePhase;
  players: Player[];
  playerIndex: number;
  puzzle: Puzzle;
  guessed: string[];
  rotation: number;
  roundIndex: number;
  roundsTotal: number;
  hostLine: string;
  hintUsed: boolean;
  startedAt: number;
  currentWedge?: Wedge | null;
  letterValue?: number;
  letterMultiplier?: number;
  bonusPuzzle?: Puzzle | null;
  bonusGuessed?: string[];
  bonusPicks?: string[];
  bonusSeconds?: number;
  bonusResult?: "won" | "lost" | null;
}

const modeCards: { id: GameMode; label: string; eyebrow: string; description: string; icon: string }[] = [
  { id: "solo", label: "Solo Grower", eyebrow: "vs. two honest AIs", description: "Run a complete match against Terpene Tina and LED Larry.", icon: "01" },
  { id: "local", label: "Local Smoke Circle", eyebrow: "2 players", description: "Pass the controls and compete on the same screen.", icon: "02" },
  { id: "party", label: "GBS Party Mode", eyebrow: "3 players", description: "Large type, quick reveals, score controls, and screen-share energy.", icon: "03" },
  { id: "sprint", label: "Terpene Sprint", eyebrow: "120 seconds", description: "Solve as many accessible cannabis puzzles as the timer allows.", icon: "04" },
  { id: "breeder", label: "Breeder's Challenge", eyebrow: "hard genetics", description: "Selection, generations, traits, and line-work vocabulary.", icon: "05" },
  { id: "grower", label: "Grower's Challenge", eyebrow: "room mastery", description: "Environment, irrigation, plant health, harvest, and equipment.", icon: "06" },
  { id: "strain", label: "Strain Hunter", eyebrow: "cultivars only", description: "Every board is a recognized cultivar name from the archive.", icon: "07" },
  { id: "custom", label: "Custom Game", eyebrow: "your rules", description: "Choose rounds, speed, player count, and enabled private packs.", icon: "08" },
];

const roundNames = ["Quick Clone Toss-Up", "Main Canopy Round", "Terpene Mystery Round", "Breeder's Choice Round", "Prize Harvest Round", "Speed Trim Final"];

const hostLines = {
  correct: [
    "That consonant stacked harder than a well-run canopy.",
    "The trait expressed. Keep the turn moving.",
    "You found letters across the whole room.",
    "That board just frosted up nicely.",
    "Clean guess. Someone has been reading the notes.",
  ],
  miss: [
    "No match. This pheno did not carry the trait.",
    "Nothing on the board, but the next observation matters.",
    "That letter stayed in the seed vault.",
    "A fair swing. Pass the loupe to the next grower.",
  ],
  solve: [
    "Keeper found. That solve goes in the archive.",
    "Solved before the stretch finished.",
    "Harvest the round—this board is complete.",
    "You read the pattern like a veteran selector.",
  ],
  compost: [
    "Compost Pile. The garden budget just became soil amendment.",
    "Brutal spin. Reset, observe, and grow forward.",
  ],
  vowel: [
    "That vowel opened the canopy.",
    "A small spend for a much clearer pattern.",
  ],
};

const randomLine = (group: keyof typeof hostLines) => hostLines[group][Math.floor(Math.random() * hostLines[group].length)];

function useTone(enabled: boolean) {
  const context = useRef<AudioContext | null>(null);
  return (frequency = 440, duration = 0.08, type: OscillatorType = "sine") => {
    if (!enabled || typeof window === "undefined") return;
    try {
      context.current ??= new AudioContext();
      const oscillator = context.current.createOscillator();
      const gain = context.current.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.035, context.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.current.currentTime + duration);
      oscillator.connect(gain).connect(context.current.destination);
      oscillator.start();
      oscillator.stop(context.current.currentTime + duration);
    } catch {
      // Audio is an enhancement; gameplay remains complete in silence.
    }
  };
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand-mark ${compact ? "brand-mark--compact" : ""}`} aria-label="The Great Ganja Spin">
      <span className="brand-mark__orbit" aria-hidden="true"><i /><i /><i /></span>
      <span className="brand-mark__copy">
        <small>The Great</small>
        <strong>Ganja Spin</strong>
      </span>
    </div>
  );
}

function CharacterPortrait({ person, mood = "idle" }: { person: "bud" | "sativa"; mood?: string }) {
  return (
    <div className={`portrait portrait--${person} portrait--${mood}`} aria-hidden="true">
      <div className="portrait__halo" />
      <div className="portrait__hair" />
      <div className="portrait__head"><span /><i /></div>
      <div className="portrait__body"><b /></div>
      <div className="portrait__spark">✦</div>
    </div>
  );
}

function PuzzleBoard({ answer, guessed, revealAll = false, freshLetter }: { answer: string; guessed: string[]; revealAll?: boolean; freshLetter?: string }) {
  const words = answer.split(" ");
  return (
    <div className="puzzle-board" role="group" aria-label="Puzzle board. Hidden letters are announced as blank tiles.">
      {words.map((word, wordIndex) => (
        <span className="puzzle-word" key={`${word}-${wordIndex}`}>
          {[...word].map((character, characterIndex) => {
            const isLetter = /[A-Z0-9]/i.test(character);
            const shown = revealAll || !isLetter || /[0-9]/.test(character) || guessed.includes(character.toUpperCase());
            const isFresh = shown && freshLetter === character.toUpperCase();
            return (
              <span
                className={`puzzle-tile ${!isLetter ? "puzzle-tile--punctuation" : ""} ${shown ? "is-revealed" : ""} ${isFresh ? "is-fresh" : ""}`}
                key={`${character}-${characterIndex}`}
                aria-label={shown ? character : "blank"}
              >
                <span>{shown ? character : ""}</span>
              </span>
            );
          })}
        </span>
      ))}
    </div>
  );
}

function Wheel({ rotation, spinning }: { rotation: number; spinning: boolean }) {
  const gradient = WEDGES.map((wedge, index) => `${wedge.color} ${index * (360 / WEDGES.length)}deg ${(index + 1) * (360 / WEDGES.length)}deg`).join(",");
  return (
    <div className={`wheel-stage ${spinning ? "is-spinning" : ""}`}>
      <div className="wheel-pointer" aria-hidden="true"><span /></div>
      <div
        className="wheel"
        style={{ background: `conic-gradient(from -10deg, ${gradient})`, transform: `rotate(${rotation}deg)` }}
        role="img"
        aria-label={spinning ? "The cannabis prize wheel is spinning" : "The cannabis prize wheel is ready"}
      >
        <div className="wheel__labels" aria-hidden="true">
          {WEDGES.map((wedge, index) => (
            <span key={wedge.id} style={{ transform: `rotate(${index * (360 / WEDGES.length) + (360 / WEDGES.length) / 2}deg)` }}>
              <b>{wedge.symbol}</b><small>{wedge.shortLabel}</small>
            </span>
          ))}
        </div>
        <div className="wheel__hub"><span>GGS</span><small>GROW POINTS</small></div>
      </div>
      <div className="wheel-shadow" />
    </div>
  );
}

function Toggle({ checked, onChange, label, detail }: { checked: boolean; onChange: (checked: boolean) => void; label: string; detail?: string }) {
  return (
    <label className="toggle-row">
      <span><strong>{label}</strong>{detail && <small>{detail}</small>}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <i aria-hidden="true" />
    </label>
  );
}

function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`modal-card ${wide ? "modal-card--wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-card__head"><div><span className="eyebrow">Control panel</span><h2 id="modal-title">{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close dialog">×</button></div>
        {children}
      </section>
    </div>
  );
}

export default function SiteApp() {
  const [view, setView] = useState<View>("home");
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [stats, setStats] = useState<GameStats>(defaultStats);
  const [packs, setPacks] = useState<CustomPack[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [mode, setMode] = useState<GameMode>("solo");
  const [names, setNames] = useState(["Nova", "Mica", "Jade"]);
  const [roundsTotal, setRoundsTotal] = useState(5);
  const [phase, setPhase] = useState<GamePhase>("landing");
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [puzzle, setPuzzle] = useState<Puzzle>(() => puzzles[0]);
  const [guessed, setGuessed] = useState<string[]>([]);
  const [rotation, setRotation] = useState(0);
  const [currentWedge, setCurrentWedge] = useState<Wedge | null>(null);
  const [letterValue, setLetterValue] = useState(0);
  const [letterMultiplier, setLetterMultiplier] = useState(1);
  const [roundIndex, setRoundIndex] = useState(0);
  const [hostLine, setHostLine] = useState("Welcome to the canopy. Every letter is cannabis knowledge.");
  const [freshLetter, setFreshLetter] = useState<string>();
  const [solveInput, setSolveInput] = useState("");
  const [hintUsed, setHintUsed] = useState(false);
  const [startedAt, setStartedAt] = useState(0);
  const [sprintSeconds, setSprintSeconds] = useState(120);
  const [bonusPuzzle, setBonusPuzzle] = useState<Puzzle | null>(null);
  const [bonusGuessed, setBonusGuessed] = useState<string[]>(["R", "S", "T", "L", "N", "E"]);
  const [bonusPicks, setBonusPicks] = useState<string[]>([]);
  const [bonusSeconds, setBonusSeconds] = useState(30);
  const [bonusResult, setBonusResult] = useState<"won" | "lost" | null>(null);
  const [packDraft, setPackDraft] = useState("");
  const [packMessage, setPackMessage] = useState("");
  const [previewPhrase, setPreviewPhrase] = useState("VAPOR PRESSURE DEFICIT");
  const [vaultQuery, setVaultQuery] = useState("");
  const [hasSave, setHasSave] = useState(false);
  const [activeMobilePanel, setActiveMobilePanel] = useState<"board" | "wheel">("board");
  const tone = useTone(settings.audio.master && settings.audio.interface);

  const enabledCustomPuzzles = useMemo(() => packs.filter((pack) => pack.enabled).flatMap((pack) => pack.puzzles), [packs]);
  const activeBank = useMemo(() => [...puzzlesForMode(mode), ...enabledCustomPuzzles], [mode, enabledCustomPuzzles]);
  const activePlayer = players[playerIndex];
  const isHumanTurn = activePlayer?.kind !== "ai";
  const solvedPattern = visiblePattern(puzzle.answer, guessed);
  const remainingConsonants = CONSONANTS.filter((letter) => !guessed.includes(letter));
  const remainingVowels = VOWELS.filter((letter) => !guessed.includes(letter));
  const winnerIndex = players.reduce((best, player, index, list) => player.matchPoints > (list[best]?.matchPoints ?? -1) ? index : best, 0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSettings(loadSettings());
      setStats(loadStats());
      setPacks(loadPacks());
      setHasSave(Boolean(window.localStorage.getItem(SAVE_KEY)));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.dataset.contrast = settings.highContrast ? "high" : "normal";
    document.documentElement.dataset.motion = settings.reducedMotion ? "reduced" : "full";
    document.documentElement.dataset.text = settings.largeText ? "large" : "normal";
    saveSettings(settings);
  }, [settings]);

  useEffect(() => { saveStats(stats); }, [stats]);
  useEffect(() => { savePacks(packs); }, [packs]);

  useEffect(() => {
    if (view !== "game" || !players.length || phase === "landing" || phase === "setup") return;
    const snapshot: SavedGame = { mode, phase, players, playerIndex, puzzle, guessed, rotation, roundIndex, roundsTotal, hostLine, hintUsed, startedAt, currentWedge, letterValue, letterMultiplier, bonusPuzzle, bonusGuessed, bonusPicks, bonusSeconds, bonusResult };
    saveActiveGame(snapshot);
  }, [view, mode, phase, players, playerIndex, puzzle, guessed, rotation, roundIndex, roundsTotal, hostLine, hintUsed, startedAt, currentWedge, letterValue, letterMultiplier, bonusPuzzle, bonusGuessed, bonusPicks, bonusSeconds, bonusResult]);

  useEffect(() => {
    if (mode !== "sprint" || view !== "game" || !["awaiting-action", "selecting-consonant", "selecting-vowel", "solving"].includes(phase)) return;
    const timer = window.setInterval(() => setSprintSeconds((value) => {
      if (value <= 1) {
        setPhase("match-complete");
        setHostLine("Time. Loupe down—let's count the solved boards.");
        return 0;
      }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [mode, view, phase]);

  useEffect(() => {
    if (phase !== "bonus-countdown") return;
    const timer = window.setInterval(() => setBonusSeconds((value) => {
      if (value <= 1) {
        setBonusResult("lost");
        setPhase("bonus-result");
        return 0;
      }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  const updatePlayer = (index: number, updater: (player: Player) => Player) => {
    setPlayers((current) => current.map((player, playerPosition) => playerPosition === index ? updater(player) : player));
  };

  const advanceTurn = (message?: string) => {
    if (message) setHostLine(message);
    setPhase("turn-transition");
    window.setTimeout(() => {
      setPlayerIndex((current) => nextPlayerIndex(players, current));
      setCurrentWedge(null);
      setLetterValue(0);
      setLetterMultiplier(1);
      setPhase("awaiting-action");
    }, settings.reducedMotion ? 80 : 520);
  };

  const resolveWedge = (wedge: Wedge) => {
    setCurrentWedge(wedge);
    tone(wedge.kind === "compost" ? 120 : 520, 0.16, wedge.kind === "compost" ? "sawtooth" : "triangle");
    if (!activePlayer) return;
    if (wedge.kind === "compost") {
      const result = applyCompost(activePlayer);
      updatePlayer(playerIndex, () => result.player);
      setStats((value) => ({ ...value, compostCount: value.compostCount + 1 }));
      advanceTurn(result.protected ? "The IPM Shield held. Your round points stay protected." : randomLine("compost"));
      return;
    }
    if (wedge.kind === "lost-turn") {
      advanceTurn("Lost the Light Cycle. The next grower gets the controls.");
      return;
    }
    if (["free-vowel", "wild", "shield", "clone-keeper"].includes(wedge.kind)) {
      updatePlayer(playerIndex, (player) => ({
        ...player,
        tokens: {
          ...player.tokens,
          freeVowel: player.tokens.freeVowel + (wedge.kind === "free-vowel" ? 1 : 0),
          wild: player.tokens.wild + (wedge.kind === "wild" ? 1 : 0),
          shield: player.tokens.shield + (wedge.kind === "shield" ? 1 : 0),
          cloneKeeper: player.tokens.cloneKeeper + (wedge.kind === "clone-keeper" ? 1 : 0),
        },
      }));
      setHostLine(`${wedge.label} banked. You still control the wheel.`);
      setPhase("awaiting-action");
      return;
    }
    if (wedge.kind === "mystery") {
      const packet = Math.random();
      if (packet < 0.18) {
        const result = applyCompost(activePlayer);
        updatePlayer(playerIndex, () => result.player);
        advanceTurn("The Mystery Seed opened into a Compost Pile. That packet was all risk.");
      } else {
        const reward = packet > 0.78 ? 1800 : 800;
        updatePlayer(playerIndex, (player) => ({ ...player, roundPoints: player.roundPoints + reward }));
        setHostLine(`Rare keeper! The Mystery Seed produced ${reward.toLocaleString()} Grow Points.`);
        setPhase("awaiting-action");
      }
      return;
    }
    if (wedge.kind === "risk") {
      const doubled = Math.random() >= 0.45;
      updatePlayer(playerIndex, (player) => ({ ...player, roundPoints: doubled ? player.roundPoints * 2 + 500 : Math.floor(player.roundPoints / 2) }));
      setHostLine(doubled ? "Risk paid off. The crop doubled and added a 500-point kicker." : "The gamble cut the round bank in half. The plant still stands.");
      setPhase("awaiting-action");
      return;
    }
    const multiplier = wedge.kind === "double" ? 2 : wedge.kind === "triple" ? 3 : 1;
    setLetterMultiplier(multiplier);
    setLetterValue(wedge.points ?? 500);
    setPhase("selecting-consonant");
    setHostLine(`${wedge.label}. Select an unused consonant.`);
  };

  const spin = () => {
    if (phase !== "awaiting-action" || !activePlayer) return;
    setPhase("spinning");
    setHostLine(`${activePlayer.name} sends the precision dial into motion.`);
    const result = createSpin(rotation);
    setRotation(result.finalRotation);
    window.setTimeout(() => resolveWedge(result.wedge), settings.reducedMotion ? 180 : settings.animationSpeed === "show" ? 3400 : settings.animationSpeed === "quick" ? 1900 : 320);
  };

  const guessLetter = (letter: string, vowel = false) => {
    if (!activePlayer || guessed.includes(letter)) return;
    const allowedPhase = vowel ? "selecting-vowel" : "selecting-consonant";
    if (phase !== allowedPhase) return;
    const matches = countLetter(puzzle.answer, letter);
    setGuessed((current) => [...current, letter]);
    setFreshLetter(letter);
    setPhase("revealing");
    if (vowel) {
      updatePlayer(playerIndex, (player) => ({
        ...player,
        roundPoints: player.tokens.freeVowel ? player.roundPoints : Math.max(0, player.roundPoints - settings.vowelCost),
        tokens: { ...player.tokens, freeVowel: Math.max(0, player.tokens.freeVowel - 1) },
      }));
      setStats((value) => ({ ...value, vowelsPurchased: value.vowelsPurchased + 1 }));
    } else if (matches > 0) {
      const wildBonus = activePlayer.tokens.wild > 0 ? 1 : 0;
      const reward = matches * letterValue * (letterMultiplier + wildBonus);
      updatePlayer(playerIndex, (player) => ({ ...player, roundPoints: player.roundPoints + reward, tokens: { ...player.tokens, wild: Math.max(0, player.tokens.wild - wildBonus) } }));
      setStats((value) => ({ ...value, consonants: { ...value.consonants, [letter]: (value.consonants[letter] ?? 0) + 1 } }));
    }
    const delay = settings.animationSpeed === "show" ? 900 + matches * 360 : settings.animationSpeed === "quick" ? 420 + matches * 120 : 60;
    window.setTimeout(() => {
      setFreshLetter(undefined);
      if (matches > 0) {
        tone(vowel ? 640 : 740, 0.12, "triangle");
        setHostLine(vowel ? randomLine("vowel") : `${matches} match${matches === 1 ? "" : "es"}. ${randomLine("correct")}`);
        setCurrentWedge(null);
        setPhase("awaiting-action");
      } else {
        tone(150, 0.18, "square");
        advanceTurn(randomLine("miss"));
      }
    }, delay);
  };

  const openVowels = () => {
    if (!activePlayer || phase !== "awaiting-action") return;
    const availability = canBuyVowel(activePlayer, guessed, settings.vowelCost);
    if (!availability.allowed) {
      setHostLine(availability.reason);
      return;
    }
    setPhase("selecting-vowel");
    setHostLine(`${availability.reason} Choose an unused vowel.`);
  };

  const submitSolve = (attempt = solveInput) => {
    if (!activePlayer || !attempt.trim()) return;
    setStats((value) => ({ ...value, solveAttempts: value.solveAttempts + 1 }));
    setSolveInput("");
    if (isCorrectSolve(attempt, puzzle)) {
      const roundGain = activePlayer.roundPoints + 1000;
      updatePlayer(playerIndex, (player) => ({ ...player, matchPoints: player.matchPoints + roundGain }));
      const seconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
      setStats((value) => ({
        ...value,
        puzzlesSolved: value.puzzlesSolved + 1,
        bestRound: Math.max(value.bestRound, roundGain),
        categoryWins: { ...value.categoryWins, [puzzle.category]: (value.categoryWins[puzzle.category] ?? 0) + 1 },
        fastestSolutionSeconds: value.fastestSolutionSeconds === null ? seconds : Math.min(value.fastestSolutionSeconds, seconds),
        recentPuzzleIds: [puzzle.id, ...value.recentPuzzleIds.filter((id) => id !== puzzle.id)].slice(0, 100),
      }));
      setGuessed([...new Set([...guessed, ...puzzle.answer.replace(/[^A-Z]/g, "")])]);
      setHostLine(randomLine("solve"));
      setPhase("round-complete");
      tone(880, 0.28, "triangle");
      return;
    }
    setHostLine("That solve does not fit the board. The hidden answer stays hidden.");
    advanceTurn();
  };

  const startMatch = () => {
    const nextPlayers = createPlayers(mode, names);
    const nextPuzzle = pickPuzzle(mode, stats.recentPuzzleIds);
    clearActiveGame();
    setPlayers(nextPlayers);
    setPlayerIndex(0);
    setPuzzle(nextPuzzle);
    setGuessed([]);
    setRoundIndex(0);
    setRotation(0);
    setHintUsed(false);
    setStartedAt(Date.now());
    setSprintSeconds(120);
    setBonusResult(null);
    setHasSave(true);
    setPhase("contestant-intro");
    setView("game");
    setHostLine(`Welcome ${nextPlayers.map((player) => player.name).join(", ")}. The grow lights are up.`);
  };

  const beginRound = () => {
    setPhase("awaiting-action");
    setHostLine(`${roundNames[Math.min(roundIndex, roundNames.length - 1)]}. ${players[playerIndex]?.name} has first spin.`);
  };

  const nextRound = () => {
    if (roundIndex + 1 >= roundsTotal) {
      const finalBest = Math.max(...players.map((player) => player.matchPoints));
      setStats((value) => ({ ...value, gamesPlayed: value.gamesPlayed + 1, largestMatchTotal: Math.max(value.largestMatchTotal, finalBest), currentWinStreak: players[winnerIndex]?.kind === "human" ? value.currentWinStreak + 1 : 0 }));
      setPhase("match-complete");
      setHostLine(`${players[winnerIndex]?.name} takes the Keeper Crown and enters the Harvest Vault.`);
      return;
    }
    const excluded = [puzzle.id, ...stats.recentPuzzleIds];
    setPuzzle(pickPuzzle(mode, excluded));
    setPlayers((current) => current.map((player) => ({ ...player, roundPoints: 0 })));
    setRoundIndex((current) => current + 1);
    setPlayerIndex((roundIndex + 1) % players.length);
    setGuessed([]);
    setHintUsed(false);
    setStartedAt(Date.now());
    setCurrentWedge(null);
    setPhase("round-start");
  };

  const startBonus = () => {
    const next = pickPuzzle(mode === "strain" ? "strain" : "breeder", [puzzle.id, ...stats.recentPuzzleIds]);
    setBonusPuzzle(next);
    setBonusGuessed(["R", "S", "T", "L", "N", "E"]);
    setBonusPicks([]);
    setBonusSeconds(30);
    setBonusResult(null);
    setPhase("bonus-letter-selection");
    setHostLine("The Harvest Vault reveals R, S, T, L, N, and E. Pick three consonants and one vowel.");
  };

  const chooseBonusLetter = (letter: string) => {
    if (bonusPicks.includes(letter) || bonusGuessed.includes(letter)) return;
    const consonantCount = bonusPicks.filter((item) => !VOWELS.includes(item)).length;
    const vowelCount = bonusPicks.filter((item) => VOWELS.includes(item)).length;
    if (VOWELS.includes(letter) ? vowelCount >= 1 : consonantCount >= 3) return;
    setBonusPicks((current) => [...current, letter]);
  };

  const beginBonusCountdown = () => {
    if (bonusPicks.filter((letter) => CONSONANTS.includes(letter)).length !== 3 || bonusPicks.filter((letter) => VOWELS.includes(letter)).length !== 1) return;
    setBonusGuessed((current) => [...current, ...bonusPicks]);
    setPhase("bonus-countdown");
    setSolveInput("");
    setHostLine("Thirty seconds. Find the keeper before the vault seals.");
  };

  const submitBonus = () => {
    if (!bonusPuzzle || !solveInput.trim()) return;
    const won = isCorrectSolve(solveInput, bonusPuzzle);
    setBonusResult(won ? "won" : "lost");
    setPhase("bonus-result");
    if (won) {
      updatePlayer(winnerIndex, (player) => ({ ...player, matchPoints: player.matchPoints + 10000 }));
      setStats((value) => ({ ...value, bonusVictories: value.bonusVictories + 1 }));
      setHostLine("Golden Trichome unlocked. You found the keeper in the vault.");
      tone(960, 0.4, "triangle");
    } else {
      setHostLine("The vault held this one. The knowledge still leaves with you.");
    }
    setSolveInput("");
  };

  const resumeGame = () => {
    const saved = loadActiveGame<SavedGame>();
    if (!saved) {
      setHasSave(false);
      return;
    }
    setMode(saved.mode);
    setPhase(["spinning", "revealing", "turn-transition"].includes(saved.phase) ? "awaiting-action" : saved.phase);
    setPlayers(saved.players);
    setPlayerIndex(saved.playerIndex);
    setPuzzle(saved.puzzle);
    setGuessed(saved.guessed);
    setRotation(saved.rotation);
    setRoundIndex(saved.roundIndex);
    setRoundsTotal(saved.roundsTotal);
    setHostLine("Save restored. The grow lights are stable and the controls are yours.");
    setHintUsed(saved.hintUsed);
    setStartedAt(saved.startedAt);
    setCurrentWedge(saved.currentWedge ?? null);
    setLetterValue(saved.letterValue ?? 0);
    setLetterMultiplier(saved.letterMultiplier ?? 1);
    setBonusPuzzle(saved.bonusPuzzle ?? null);
    setBonusGuessed(saved.bonusGuessed ?? ["R", "S", "T", "L", "N", "E"]);
    setBonusPicks(saved.bonusPicks ?? []);
    setBonusSeconds(saved.bonusSeconds ?? 30);
    setBonusResult(saved.bonusResult ?? null);
    setView("game");
  };

  useEffect(() => {
    if (view !== "game" || !activePlayer || activePlayer.kind !== "ai") return;
    if (phase === "awaiting-action") {
      const timer = window.setTimeout(() => {
        const solve = chooseAiSolve(solvedPattern, puzzle.category, activeBank, 0.72);
        if (solve && Math.random() > 0.12) submitSolve(solve);
        else spin();
      }, settings.reducedMotion ? 100 : 720);
      return () => window.clearTimeout(timer);
    }
    if (phase === "selecting-consonant") {
      const timer = window.setTimeout(() => {
        const letter = chooseAiLetter(solvedPattern, guessed, puzzle.category, activeBank);
        if (letter) guessLetter(letter);
      }, settings.reducedMotion ? 100 : 620);
      return () => window.clearTimeout(timer);
    }
  // The turn token and phase are the deliberate scheduling boundary; action
  // functions always read the render that created this timer.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, phase, activePlayer?.id, solvedPattern]);

  const navigate = (target: View) => {
    setView(target);
    if (target === "home") setPhase("landing");
    window.scrollTo({ top: 0, behavior: settings.reducedMotion ? "auto" : "smooth" });
  };

  const importPack = () => {
    try {
      const parsed = JSON.parse(packDraft) as { name?: string; description?: string; puzzles?: Puzzle[] };
      const validation = validateImportedPack(parsed);
      const errors = validation.issues.filter((issue) => issue.severity === "error");
      if (errors.length) {
        setPackMessage(`Import stopped: ${errors.slice(0, 3).map((issue) => issue.message).join(" ")}`);
        return;
      }
      const next: CustomPack = {
        id: `pack-${Date.now()}`,
        name: parsed.name?.trim() || "Private Party Pack",
        description: parsed.description?.trim() || "Imported local puzzle pack",
        enabled: true,
        puzzles: validation.puzzles,
        createdAt: new Date().toISOString(),
      };
      setPacks((current) => [...current, next]);
      setPackMessage(`${next.name} imported with ${next.puzzles.length} validated puzzles.`);
      setPackDraft("");
    } catch {
      setPackMessage("That text is not valid JSON. Check commas and quotation marks.");
    }
  };

  const exportPack = (pack: CustomPack) => {
    const blob = new Blob([JSON.stringify({ name: pack.name, description: pack.description, puzzles: pack.puzzles }, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${pack.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportSettings = () => {
    const blob = new Blob([JSON.stringify({ version: 2, settings, stats }, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "great-ganja-spin-settings.json";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const mostSuccessfulCategory = Object.entries(stats.categoryWins).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "No harvests yet";
  const favoriteConsonant = Object.entries(stats.consonants).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  const solvePercent = stats.solveAttempts ? Math.round((stats.puzzlesSolved / stats.solveAttempts) * 100) : 0;
  const knowledgeRank = stats.puzzlesSolved >= 100 ? "Breeder Brain" : stats.puzzlesSolved >= 50 ? "Phenohunter" : stats.puzzlesSolved >= 15 ? "Experienced Grower" : stats.puzzlesSolved >= 5 ? "Home Grower" : "Seedling";

  const achievements = [
    { name: "First Harvest", detail: "Solve your first puzzle", unlocked: stats.puzzlesSolved >= 1 },
    { name: "Keeper Found", detail: "Solve 10 puzzles", unlocked: stats.puzzlesSolved >= 10 },
    { name: "Full Canopy", detail: "Score 5,000 in one round", unlocked: stats.bestRound >= 5000 },
    { name: "Terpene Tracker", detail: "Win 5 aroma puzzles", unlocked: (stats.categoryWins["Aromas and Sensory"] ?? 0) >= 5 },
    { name: "Breeder Brain", detail: "Solve 50 puzzles", unlocked: stats.puzzlesSolved >= 50 },
    { name: "Vowel Conservationist", detail: "Win a game with fewer than 4 vowels bought", unlocked: stats.gamesPlayed > 0 && stats.vowelsPurchased < 4 },
    { name: "Five-Game Win Streak", detail: "Win five matches in a row", unlocked: stats.currentWinStreak >= 5 },
    { name: "Golden Trichome", detail: "Win the Harvest Vault", unlocked: stats.bonusVictories >= 1 },
  ];

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="topbar">
        <button className="brand-button" onClick={() => navigate("home")} aria-label="Go to the landing page"><BrandMark compact /></button>
        <nav aria-label="Primary navigation">
          <button className={view === "how" ? "is-active" : ""} onClick={() => navigate("how")}>How to play</button>
          <button className={view === "vault" ? "is-active" : ""} onClick={() => navigate("vault")}>Knowledge vault</button>
          <button className={view === "packs" ? "is-active" : ""} onClick={() => navigate("packs")}>Puzzle packs</button>
          <button className={view === "stats" ? "is-active" : ""} onClick={() => navigate("stats")}>Stats</button>
          <button className={view === "about" ? "is-active" : ""} onClick={() => navigate("about")}>GBS</button>
        </nav>
        <div className="topbar__actions">
          <button className="icon-button" onClick={() => setSettingsOpen(true)} aria-label="Open accessibility and sound settings">⚙</button>
          <button className="button button--small button--gold" onClick={() => { setView("home"); setPhase("setup"); }}>Play now <span>↗</span></button>
        </div>
      </header>

      <main id="main-content">
        {view === "home" && phase === "landing" && (
          <>
            <section className="hero">
              <div className="hero__beam hero__beam--one" /><div className="hero__beam hero__beam--two" />
              <div className="hero__copy">
                <span className="eyebrow eyebrow--gold">An original cannabis word-wheel game</span>
                <BrandMark />
                <p>Spin the precision grow dial. Read the canopy. Prove what you know about cultivars, terpenes, breeding, cultivation, and cannabis culture.</p>
                <div className="hero__actions">
                  <button className="button button--hero" onClick={() => setPhase("setup")}><span className="button__spark">✦</span> Enter the grow stage</button>
                  {hasSave && <button className="button button--ghost" onClick={resumeGame}>Resume saved match</button>}
                </div>
                <div className="hero__facts"><span><b>{puzzles.length.toLocaleString()}+</b> cannabis puzzles</span><span><b>8</b> game modes</span><span><b>0</b> accounts or trackers</span></div>
              </div>
              <div className="hero__stage" aria-hidden="true">
                <div className="hero__arch"><i /><i /><i /></div>
                <div className="hero__mini-board"><span>G</span><span>R</span><span>O</span><span>W</span></div>
                <div className="hero__dial"><div>✦</div><b>SPIN</b></div>
                <div className="hero__podium hero__podium--left"><CharacterPortrait person="bud" /><b>BUD</b></div>
                <div className="hero__podium hero__podium--right"><CharacterPortrait person="sativa" /><b>SATIVA</b></div>
                <div className="hero__floor" />
              </div>
            </section>

            <section className="marquee" aria-label="Featured categories"><div>{[...puzzleCategories, ...puzzleCategories].map((category, index) => <span key={`${category}-${index}`}>✦ {category}</span>)}</div></section>

            <section className="section section--modes">
              <div className="section-heading"><div><span className="eyebrow">Choose your room</span><h2>Eight ways into the canopy</h2></div><p>Every mode uses the same fair wheel, cannabis-only library, and locally saved progress.</p></div>
              <div className="mode-grid">
                {modeCards.map((card) => <button className={`mode-card ${mode === card.id ? "is-selected" : ""}`} key={card.id} onClick={() => { setMode(card.id); setPhase("setup"); }}><span className="mode-card__number">{card.icon}</span><small>{card.eyebrow}</small><h3>{card.label}</h3><p>{card.description}</p><b>Choose mode <span>→</span></b></button>)}
              </div>
            </section>

            <section className="section show-rundown">
              <div className="show-rundown__art"><div className="board-sample"><span>V</span><span>P</span><span>D</span></div><div className="sample-copy"><small>Tonight&apos;s category</small><strong>Environmental Control</strong></div></div>
              <div className="show-rundown__copy"><span className="eyebrow">The show flow</span><h2>From quick clone to the Harvest Vault</h2><ol><li><b>Spin.</b><span>The actual stopping angle selects the wedge.</span></li><li><b>Read.</b><span>Guess consonants, buy vowels, and follow the visible pattern.</span></li><li><b>Solve.</b><span>Bank Grow Points and learn the context behind the answer.</span></li><li><b>Harvest.</b><span>Win the match to chase the Golden Trichome bonus.</span></li></ol><button className="text-link" onClick={() => navigate("how")}>Read the complete rules <span>↗</span></button></div>
            </section>

            <section className="section community-callout">
              <div><span className="eyebrow eyebrow--gold">The GBS green room</span><h2>Growers who really grow.<br />Breeders who really breed.<br />Smokers who respect the plant.</h2></div>
              <div><p>Built for educational discussion, generous note-sharing, and a community that respects cannabis as medicine, craft, culture, and plant—without turning folklore into fact.</p><a className="button button--light" href="https://discord.gg/YxJYnnKWHf" target="_blank" rel="noreferrer">Join the GBS Discord <span>↗</span></a></div>
            </section>
          </>
        )}

        {view === "home" && phase === "setup" && (
          <section className="setup-page">
            <button className="back-link" onClick={() => setPhase("landing")}>← Back to the lobby</button>
            <div className="setup-page__heading"><span className="eyebrow">Player setup</span><h1>Choose your cut of the show</h1><p>Settings stay on this device. Grow Points are fictional and have no monetary value.</p></div>
            <div className="setup-layout">
              <div className="setup-panel">
                <h2>Game mode</h2>
                <div className="setup-modes">{modeCards.map((card) => <button key={card.id} className={mode === card.id ? "is-selected" : ""} onClick={() => setMode(card.id)}><span>{card.icon}</span><b>{card.label}</b><small>{card.eyebrow}</small></button>)}</div>
              </div>
              <aside className="setup-card">
                <span className="eyebrow">Contestant card</span>
                <label>Player one<input value={names[0]} maxLength={16} onChange={(event) => setNames([event.target.value, names[1], names[2]])} /></label>
                {!["solo", "sprint", "breeder", "grower", "strain"].includes(mode) && <label>Player two<input value={names[1]} maxLength={16} onChange={(event) => setNames([names[0], event.target.value, names[2]])} /></label>}
                {mode === "party" && <label>Player three<input value={names[2]} maxLength={16} onChange={(event) => setNames([names[0], names[1], event.target.value])} /></label>}
                <label>Rounds<select value={roundsTotal} onChange={(event) => setRoundsTotal(Number(event.target.value))}>{[1, 3, 5, 6].map((count) => <option value={count} key={count}>{count === 6 ? "6 · Full show" : count}</option>)}</select></label>
                <label>Reveal speed<select value={settings.animationSpeed} onChange={(event) => setSettings((value) => ({ ...value, animationSpeed: event.target.value as AppSettings["animationSpeed"] }))}><option value="show">Full Show</option><option value="quick">Quick Trim</option><option value="instant">Instant Harvest</option></select></label>
                <div className="setup-summary"><span><b>{puzzlesForMode(mode).length}</b> eligible puzzles</span><span><b>{roundsTotal}</b> rounds + vault</span></div>
                <button className="button button--hero button--full" onClick={startMatch}>Light up the stage <span>→</span></button>
              </aside>
            </div>
          </section>
        )}

        {view === "game" && (
          <section className="game-page">
            <div className="game-toolbar">
              <button className="back-link" onClick={() => navigate("home")}>← Lobby</button>
              <div className="game-toolbar__round"><span>{roundNames[Math.min(roundIndex, roundNames.length - 1)]}</span><b>Round {roundIndex + 1} / {roundsTotal}</b></div>
              {mode === "sprint" && <div className="timer-chip"><span>Terpene Sprint</span><b>{Math.floor(sprintSeconds / 60)}:{String(sprintSeconds % 60).padStart(2, "0")}</b></div>}
              <div className="game-toolbar__buttons"><button className="icon-button" onClick={() => setPhase((value) => value === "paused" ? "awaiting-action" : "paused")} aria-label="Pause game">Ⅱ</button><button className="icon-button" onClick={() => setSettingsOpen(true)} aria-label="Open settings">⚙</button></div>
            </div>

            {phase === "contestant-intro" && <div className="game-overlay"><span className="eyebrow">Tonight&apos;s contestants</span><h1>The grow lights are live</h1><div className="intro-players">{players.map((player, index) => <div key={player.id}><span>{String(index + 1).padStart(2, "0")}</span><b>{player.name}</b><small>{player.kind === "ai" ? `${player.persona} specialist · honest pattern solver` : "human contestant"}</small></div>)}</div><button className="button button--hero" onClick={beginRound}>Begin Quick Clone <span>→</span></button></div>}
            {phase === "round-start" && <div className="game-overlay"><span className="eyebrow">Next on the stage</span><h1>{roundNames[Math.min(roundIndex, roundNames.length - 1)]}</h1><p>{puzzle.category} · {puzzle.difficulty}</p><button className="button button--hero" onClick={beginRound}>Raise the board <span>→</span></button></div>}
            {phase === "paused" && <div className="game-overlay"><span className="eyebrow">Show paused</span><h1>The light cycle is holding</h1><p>Timers and contestant actions are paused.</p><button className="button button--hero" onClick={() => setPhase("awaiting-action")}>Resume show</button></div>}

            <div className="player-strip" aria-label="Contestant scores">
              {players.map((player, index) => <div className={`player-podium ${index === playerIndex ? "is-active" : ""}`} key={player.id}><span className="player-podium__light" /><div><small>{player.kind === "ai" ? player.persona : `Contestant ${index + 1}`}</small><strong>{player.name}</strong></div><div className="player-podium__score"><small>Match</small><b>{player.matchPoints.toLocaleString()}</b><span>+ {player.roundPoints.toLocaleString()} round</span></div><div className="token-row">{player.tokens.shield > 0 && <i title="IPM Shield">⬡ {player.tokens.shield}</i>}{player.tokens.wild > 0 && <i title="Wild Terpene">✦ {player.tokens.wild}</i>}{player.tokens.cloneKeeper > 0 && <i title="Clone Keeper">↟ {player.tokens.cloneKeeper}</i>}{player.tokens.freeVowel > 0 && <i title="Free Vowel">A {player.tokens.freeVowel}</i>}{mode === "party" && <><button aria-label={`Subtract 100 points from ${player.name}`} onClick={() => updatePlayer(index, (value) => ({ ...value, roundPoints: Math.max(0, value.roundPoints - 100) }))}>−</button><button aria-label={`Add 100 points to ${player.name}`} onClick={() => updatePlayer(index, (value) => ({ ...value, roundPoints: value.roundPoints + 100 }))}>+</button></>}</div></div>)}
            </div>

            <div className="game-mobile-tabs"><button className={activeMobilePanel === "board" ? "is-active" : ""} onClick={() => setActiveMobilePanel("board")}>Puzzle board</button><button className={activeMobilePanel === "wheel" ? "is-active" : ""} onClick={() => setActiveMobilePanel("wheel")}>Spin wheel</button></div>

            <div className="game-stage">
              <div className={`game-stage__board ${activeMobilePanel === "board" ? "is-mobile-active" : ""}`}>
                <div className="board-heading"><div><span className="eyebrow">Current category</span><h1>{phase.startsWith("bonus") || phase === "bonus-result" ? bonusPuzzle?.category : puzzle.category}</h1></div><div><span>{phase.startsWith("bonus") || phase === "bonus-result" ? bonusPuzzle?.difficulty : puzzle.difficulty}</span><b>{phase.startsWith("bonus") || phase === "bonus-result" ? "Harvest Vault" : roundNames[Math.min(roundIndex, roundNames.length - 1)]}</b></div></div>
                <div className="board-set">
                  <div className="board-lights" aria-hidden="true" />
                  {bonusPuzzle && (phase.startsWith("bonus") || phase === "bonus-result") ? <PuzzleBoard answer={bonusPuzzle.answer} guessed={bonusGuessed} revealAll={phase === "bonus-result"} /> : <PuzzleBoard answer={puzzle.answer} guessed={guessed} revealAll={phase === "round-complete" || phase === "match-complete"} freshLetter={freshLetter} />}
                  <div className="sativa-station"><CharacterPortrait person="sativa" mood={freshLetter ? "reveal" : "idle"} /><div><small>Sativa Starling</small><b>{freshLetter ? `Revealing ${freshLetter}` : phase === "revealing" ? "Moving to the board" : "Board ready"}</b></div></div>
                </div>
                {!phase.startsWith("bonus") && phase !== "bonus-result" && <div className="used-letters"><span>Used consonants</span><div>{CONSONANTS.map((letter) => <i className={guessed.includes(letter) ? "is-used" : ""} key={letter}>{letter}</i>)}</div><span>Used vowels</span><div>{VOWELS.map((letter) => <i className={guessed.includes(letter) ? "is-used" : ""} key={letter}>{letter}</i>)}</div></div>}
              </div>

              <aside className={`game-stage__wheel ${activeMobilePanel === "wheel" ? "is-mobile-active" : ""}`}>
                <Wheel rotation={rotation} spinning={phase === "spinning"} />
                <div className="wheel-result" aria-live="polite"><small>Last result</small><strong>{currentWedge?.label ?? "Precision dial ready"}</strong><span>{currentWedge ? `${currentWedge.symbol} actual angle locked` : "Spin, buy a vowel, or solve"}</span></div>
              </aside>
            </div>

            {!phase.startsWith("bonus") && phase !== "bonus-result" && <div className="game-console">
              <div className="host-console"><CharacterPortrait person="bud" mood={phase === "round-complete" ? "celebrate" : "idle"} /><div><span className="eyebrow">Bud Blazington says</span><p aria-live="polite">“{hostLine}”</p></div></div>
              <div className="action-console">
                {(phase === "selecting-consonant" || phase === "selecting-vowel") && isHumanTurn && <div className="letter-picker"><span>{phase === "selecting-vowel" ? "Choose a vowel" : `Choose a consonant · ${letterValue.toLocaleString()} × ${letterMultiplier}`}</span><div>{(phase === "selecting-vowel" ? remainingVowels : remainingConsonants).map((letter) => <button key={letter} onClick={() => guessLetter(letter, phase === "selecting-vowel")}>{letter}</button>)}</div><button className="text-link" onClick={() => setPhase("awaiting-action")}>Cancel selection</button></div>}
                {phase === "round-complete" ? <div className="round-complete-card"><span className="eyebrow">Knowledge unlocked</span><h3>{puzzle.answer}</h3><p>{puzzle.educationalNote}</p><button className="button button--gold" onClick={nextRound}>{roundIndex + 1 >= roundsTotal ? "Crown the winner" : "Next round"} <span>→</span></button></div> : <>
                  <div className="primary-actions"><button className="action-button action-button--spin" disabled={phase !== "awaiting-action" || !isHumanTurn} title={phase !== "awaiting-action" ? "Wait for the current action to finish." : !isHumanTurn ? "AI contestant is thinking from the visible pattern." : "Spin the precision wheel"} onClick={spin}><span>↻</span><b>Spin</b><small>the grow dial</small></button><button className="action-button" disabled={phase !== "awaiting-action" || !isHumanTurn || !activePlayer || !canBuyVowel(activePlayer, guessed, settings.vowelCost).allowed} title={activePlayer ? canBuyVowel(activePlayer, guessed, settings.vowelCost).reason : "No active player"} onClick={openVowels}><span>A·E</span><b>Buy vowel</b><small>{activePlayer?.tokens.freeVowel ? "free token" : `${settings.vowelCost} points`}</small></button><button className="action-button" disabled={phase !== "awaiting-action" || !isHumanTurn} onClick={() => setPhase("solving")}><span>✓</span><b>Solve</b><small>the full board</small></button></div>
                  <div className="secondary-actions"><button disabled={hintUsed || phase !== "awaiting-action" || !isHumanTurn} onClick={() => { setHintUsed(true); setHostLine(`Educational hint: ${puzzle.hint}`); }}>◌ Hint {hintUsed ? "used" : ""}</button><button onClick={() => setRulesOpen(true)}>◇ Rules</button><button onClick={() => setSettingsOpen(true)}>♫ Audio</button><button onClick={() => setPhase("paused")}>Ⅱ Pause</button></div>
                </>}
              </div>
            </div>}

            {phase === "solving" && <Modal title="Solve the puzzle" onClose={() => setPhase("awaiting-action")}><p className="modal-copy">Enter the complete answer. Capitalization, smart apostrophes, hyphens, and repeated spaces are normalized.</p><label className="field-label">Your solve<input autoFocus value={solveInput} onChange={(event) => setSolveInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && submitSolve()} placeholder="Type the full answer" /></label><button className="button button--hero button--full" disabled={!solveInput.trim()} onClick={() => submitSolve()}>Lock in solve</button></Modal>}

            {phase === "match-complete" && <div className="match-summary"><span className="eyebrow eyebrow--gold">Keeper Crown awarded</span><h1>{players[winnerIndex]?.name} wins the match</h1><div className="match-summary__score">{players[winnerIndex]?.matchPoints.toLocaleString()} <small>Grow Points</small></div><p>{hostLine}</p><div className="match-summary__facts"><span><b>{stats.puzzlesSolved + 1}</b> lifetime solves</span><span><b>{mostSuccessfulCategory}</b> strongest category</span><span><b>{knowledgeRank}</b> knowledge rank</span></div><button className="button button--hero" onClick={startBonus}>Enter the Harvest Vault <span>→</span></button><button className="button button--ghost" onClick={() => { setPhase("setup"); setView("home"); }}>Skip to rematch setup</button></div>}

            {phase === "bonus-letter-selection" && bonusPuzzle && <div className="bonus-console"><div><span className="eyebrow">Harvest Vault · letter selection</span><h2>Pick three consonants and one vowel</h2><p>R, S, T, L, N, and E are already illuminated.</p></div><div className="bonus-keyboard">{"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => { const disabled = bonusGuessed.includes(letter) || bonusPicks.includes(letter) || (VOWELS.includes(letter) ? bonusPicks.filter((item) => VOWELS.includes(item)).length >= 1 : bonusPicks.filter((item) => CONSONANTS.includes(item)).length >= 3); return <button className={bonusPicks.includes(letter) ? "is-picked" : ""} disabled={disabled} key={letter} onClick={() => chooseBonusLetter(letter)}>{letter}</button>; })}</div><div className="bonus-selection"><span>Selected: {bonusPicks.join(" · ") || "none yet"}</span><button className="button button--gold" disabled={bonusPicks.length !== 4} onClick={beginBonusCountdown}>Start 30-second vault <span>→</span></button></div></div>}

            {phase === "bonus-countdown" && bonusPuzzle && <div className="bonus-console bonus-console--countdown"><div className="vault-timer"><span>{bonusSeconds}</span><small>seconds</small></div><div><span className="eyebrow">Final solve</span><h2>Find the keeper</h2><p>The clock pauses only if you pause the complete game.</p><label className="field-label">Harvest Vault answer<input autoFocus value={solveInput} onChange={(event) => setSolveInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && submitBonus()} /></label><button className="button button--hero" disabled={!solveInput.trim()} onClick={submitBonus}>Open the vault</button></div></div>}

            {phase === "bonus-result" && bonusPuzzle && <div className={`bonus-result bonus-result--${bonusResult}`}><span className="eyebrow eyebrow--gold">Harvest Vault result</span><h1>{bonusResult === "won" ? "Golden Trichome unlocked" : "The vault keeps its secret"}</h1><p>The answer was <strong>{bonusPuzzle.answer}</strong>.</p><div className="education-card"><small>Knowledge carried forward</small><p>{bonusPuzzle.educationalNote}</p></div><div><button className="button button--hero" onClick={() => { clearActiveGame(); setPhase("setup"); setView("home"); }}>Quick rematch</button><button className="button button--ghost" onClick={() => navigate("stats")}>View achievements</button></div></div>}
          </section>
        )}

        {view === "how" && <section className="content-page"><div className="content-hero"><span className="eyebrow">Show rules</span><h1>Read the canopy.<br />Control the wheel.</h1><p>The Great Ganja Spin uses familiar letter-and-phrase mechanics inside a completely original cannabis knowledge game.</p></div><div className="rule-grid"><article><span>01</span><h2>Spin</h2><p>The wheel accelerates, coasts, and stops at an angle selected when the spin begins. The pointer maps that final angle to one exact wedge.</p></article><article><span>02</span><h2>Guess consonants</h2><p>After a point wedge, choose one unused consonant. Every match pays the wedge value; misses pass control.</p></article><article><span>03</span><h2>Buy vowels</h2><p>Vowels cost {settings.vowelCost} round points unless you hold a Free Vowel token. They reveal every match but award no points.</p></article><article><span>04</span><h2>Solve</h2><p>Enter the complete answer. A correct solve banks the round; an incorrect solve ends your turn without exposing the answer.</p></article></div><div className="rule-table"><div><b>Compost Pile</b><span>Clears unbanked round points. An IPM Shield blocks one result; a Clone Keeper preserves 30%.</span></div><div><b>Lost the Light Cycle</b><span>Ends the turn immediately.</span></div><div><b>Double / Triple Yield</b><span>Multiplies every matching instance of the selected consonant.</span></div><div><b>Wild Terpene</b><span>Automatically improves the next successful consonant multiplier.</span></div><div><b>Mystery Seed</b><span>Opens into a point reward or a risk event.</span></div><div><b>Harvest Vault</b><span>The winner gets RSTLNE, chooses three consonants and one vowel, then solves against a 30-second countdown.</span></div></div><div className="keyboard-guide"><span className="eyebrow">Accessibility built in</span><h2>Playable without sound or precise pointing</h2><p>All controls are keyboard focusable, outcomes are written as text, tiles announce only visible letters, and motion, contrast, text size, captions, and individual sound groups are configurable.</p><button className="button button--gold" onClick={() => setSettingsOpen(true)}>Open accessibility settings</button></div></section>}

        {view === "vault" && <section className="content-page"><div className="content-hero content-hero--vault"><span className="eyebrow">Cannabis Knowledge Vault</span><h1>Terms worth keeping</h1><p>Cautious, compact definitions for the science, breeding, cultivation, and sensory language used throughout the game.</p><label className="search-field"><span>⌕</span><input value={vaultQuery} onChange={(event) => setVaultQuery(event.target.value)} placeholder="Search terms, groups, or definitions" /><kbd>{glossary.filter((item) => `${item.term} ${item.group} ${item.definition}`.toLowerCase().includes(vaultQuery.toLowerCase())).length} entries</kbd></label></div><div className="glossary-grid">{glossary.filter((item) => `${item.term} ${item.group} ${item.definition}`.toLowerCase().includes(vaultQuery.toLowerCase())).map((item) => <article key={item.term}><small>{item.group}</small><h2>{item.term}</h2><p>{item.definition}</p>{item.caution && <aside>Context note · {item.caution}</aside>}</article>)}</div><div className="disclaimer-strip"><b>Educational, not prescriptive.</b><span>The vault does not provide medical, legal, or cultivation advice. Laws, risks, and individual responses vary.</span></div></section>}

        {view === "packs" && <section className="content-page"><div className="content-hero"><span className="eyebrow">Puzzle-Pack Manager</span><h1>Your private seed library</h1><p>Import, validate, enable, preview, and export custom cannabis puzzle packs. Everything remains in this browser.</p></div><div className="pack-layout"><div className="pack-workbench"><div className="pack-workbench__head"><div><span className="eyebrow">JSON import</span><h2>Validate a party pack</h2></div><button className="text-link" onClick={() => setPackDraft(JSON.stringify({ name: "My GBS Party Pack", description: "Private screen-share puzzles", puzzles: [{ id: "party-1", answer: "KEEPER SELECTION", category: "Phenohunting", difficulty: "Home Grower", hint: "The plant worth preserving.", educationalNote: "Keeper selection compares observable traits while retaining records and backups.", acceptedAliases: [], tags: ["phenohunting", "cannabis"], sourceNote: "Private host note", verificationStatus: "community" }] }, null, 2))}>Load example</button></div><textarea value={packDraft} onChange={(event) => setPackDraft(event.target.value)} placeholder="Paste a JSON puzzle pack here" spellCheck={false} /><div className="pack-actions"><button className="button button--gold" disabled={!packDraft.trim()} onClick={importPack}>Validate & import</button><label className="file-button">Choose JSON file<input type="file" accept="application/json" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setPackDraft(String(reader.result ?? "")); reader.readAsText(file); }} /></label></div>{packMessage && <p className="pack-message" role="status">{packMessage}</p>}<div className="validation-summary"><span><b>{puzzles.length}</b> built-in puzzles</span><span><b>{validatePuzzles(puzzles).filter((issue) => issue.severity === "error").length}</b> validation errors</span><span><b>{puzzleCategories.length}</b> categories</span></div></div><aside className="pack-preview"><span className="eyebrow">Live board preview</span><label>Answer phrase<input value={previewPhrase} maxLength={42} onChange={(event) => setPreviewPhrase(event.target.value.toUpperCase().replace(/[^A-Z0-9 &'-.]/g, ""))} /></label><div className="mini-preview"><PuzzleBoard answer={previewPhrase || "YOUR PUZZLE"} guessed={[]} /></div><p>{previewPhrase.length}/42 characters · {/[A-Z]/.test(previewPhrase) ? "Board ready" : "Add at least one letter"}</p></aside></div><div className="pack-list"><div className="section-heading"><div><span className="eyebrow">Local library</span><h2>Custom packs</h2></div><p>{packs.length ? `${packs.filter((pack) => pack.enabled).length} enabled for play` : "No custom packs imported yet"}</p></div>{packs.map((pack) => <article key={pack.id}><div><Toggle checked={pack.enabled} onChange={(enabled) => setPacks((current) => current.map((item) => item.id === pack.id ? { ...item, enabled } : item))} label={pack.name} detail={`${pack.puzzles.length} puzzles · added ${new Date(pack.createdAt).toLocaleDateString()}`} /></div><p>{pack.description}</p><div><button onClick={() => exportPack(pack)}>Export</button><button className="danger-link" onClick={() => setPacks((current) => current.filter((item) => item.id !== pack.id))}>Delete</button></div></article>)}</div></section>}

        {view === "stats" && <section className="content-page stats-page"><div className="content-hero"><span className="eyebrow">Local statistics</span><h1>{knowledgeRank}</h1><p>Your knowledge rank and achievements are stored only on this device.</p></div><div className="stats-grid">{[{ label: "Games played", value: stats.gamesPlayed }, { label: "Puzzles solved", value: stats.puzzlesSolved }, { label: "Solve percentage", value: `${solvePercent}%` }, { label: "Best round", value: stats.bestRound.toLocaleString() }, { label: "Largest match", value: stats.largestMatchTotal.toLocaleString() }, { label: "Favorite consonant", value: favoriteConsonant }, { label: "Vowels purchased", value: stats.vowelsPurchased }, { label: "Compost count", value: stats.compostCount }, { label: "Bonus victories", value: stats.bonusVictories }, { label: "Fastest solution", value: stats.fastestSolutionSeconds ? `${stats.fastestSolutionSeconds}s` : "—" }, { label: "Current win streak", value: stats.currentWinStreak }, { label: "Strongest category", value: mostSuccessfulCategory }].map((item) => <article key={item.label}><small>{item.label}</small><strong>{item.value}</strong></article>)}</div><div className="achievements"><div className="section-heading"><div><span className="eyebrow">Trophy case</span><h2>Achievements</h2></div><p>{achievements.filter((item) => item.unlocked).length} of {achievements.length} unlocked</p></div><div className="achievement-grid">{achievements.map((item, index) => <article className={item.unlocked ? "is-unlocked" : ""} key={item.name}><span>{item.unlocked ? "✦" : String(index + 1).padStart(2, "0")}</span><div><h3>{item.name}</h3><p>{item.detail}</p></div><b>{item.unlocked ? "Unlocked" : "Locked"}</b></article>)}</div></div><div className="stats-actions"><button className="button button--gold" onClick={exportSettings}>Export settings & stats</button><button className="text-link danger-link" onClick={() => { if (window.confirm("Reset all locally stored statistics? Custom packs and settings will remain.")) setStats(defaultStats); }}>Reset statistics</button></div></section>}

        {view === "about" && <section className="content-page about-page"><div className="content-hero"><span className="eyebrow">About GBS</span><h1>Respect the plant.<br />Share the knowledge.</h1><p>The GBS green room celebrates growers who really grow, breeders who really breed, and smokers who respect the plant.</p><a className="button button--hero" href="https://discord.gg/YxJYnnKWHf" target="_blank" rel="noreferrer">Enter the Discord green room <span>↗</span></a></div><div className="values-grid"><article><span>G</span><h2>Grow with context</h2><p>Strong environmental records, direct observation, and honest post-run review beat confident guessing.</p></article><article><span>B</span><h2>Breed with records</h2><p>Selection gets more useful when labels, backups, population context, and repeated trials stay connected.</p></article><article><span>S</span><h2>Share with respect</h2><p>Educational discussion makes room for new growers without flattening expert nuance or turning folklore into certainty.</p></article></div><div className="about-manifesto"><div><span className="eyebrow eyebrow--gold">Our game-show promise</span><h2>Original stage. Original voices. Cannabis-only boards.</h2></div><p>Bud Blazington, Sativa Starling, every wedge, all dialogue, and the Great Ganja Spin presentation are original. The game does not sell or distribute cannabis, seeds, money, or controlled products. Grow Points are fictional.</p></div></section>}
      </main>

      <footer><BrandMark compact /><p>This game is designed for entertainment and cannabis education. It does not provide medical, legal, or cultivation advice and does not sell or distribute cannabis or cannabis products.</p><div><a href="https://discord.gg/YxJYnnKWHf" target="_blank" rel="noreferrer">GBS Discord</a><button onClick={() => navigate("about")}>Credits & legal</button><span>v1.0.0</span></div></footer>

      {settingsOpen && <Modal title="Stage, sound & accessibility" onClose={() => setSettingsOpen(false)} wide><div className="settings-grid"><section><span className="eyebrow">Stage theme</span><div className="theme-picker">{[{ id: "green-room", label: "GBS Green Room", color: "#70f0b0" }, { id: "breeder-lab", label: "Breeder's Laboratory", color: "#4ed6ff" }, { id: "trichome", label: "Trichome Temple", color: "#d194ff" }, { id: "old-haze", label: "Old-School Haze", color: "#ffad5c" }, { id: "solventless", label: "Solventless Chamber", color: "#80d8ff" }, { id: "cosmic", label: "Cosmic Canopy", color: "#9c7cff" }, { id: "apollo", label: "Apollo Garden", color: "#ffd166" }].map((theme) => <button className={settings.theme === theme.id ? "is-selected" : ""} key={theme.id} onClick={() => setSettings((value) => ({ ...value, theme: theme.id }))}><i style={{ background: theme.color }} />{theme.label}</button>)}</div><span className="eyebrow settings-subhead">Accessibility</span><Toggle checked={settings.highContrast} onChange={(highContrast) => setSettings((value) => ({ ...value, highContrast }))} label="High contrast" detail="Sharper borders and simpler lighting" /><Toggle checked={settings.reducedMotion} onChange={(reducedMotion) => setSettings((value) => ({ ...value, reducedMotion }))} label="Reduced motion" detail="Shortens spins and removes ambient movement" /><Toggle checked={settings.largeText} onChange={(largeText) => setSettings((value) => ({ ...value, largeText }))} label="Larger text" detail="Raises the base interface scale" /><Toggle checked={settings.captions} onChange={(captions) => setSettings((value) => ({ ...value, captions }))} label="Captions" detail="Keep every spoken-style line visible" /></section><section><span className="eyebrow">Audio mixer</span>{Object.entries(settings.audio).map(([key, checked]) => <Toggle key={key} checked={checked} onChange={(next) => setSettings((value) => ({ ...value, audio: { ...value.audio, [key]: next } }))} label={key.replace(/\b\w/g, (letter) => letter.toUpperCase())} detail={key === "master" ? "All sound groups" : `${key} cues`} />)}<label className="range-label"><span><b>Vowel price</b><small>Configurable Grow Point cost</small></span><select value={settings.vowelCost} onChange={(event) => setSettings((value) => ({ ...value, vowelCost: Number(event.target.value) }))}><option value="150">150</option><option value="250">250</option><option value="350">350</option></select></label></section></div></Modal>}
      {rulesOpen && <Modal title="Quick rules" onClose={() => setRulesOpen(false)}><div className="quick-rules"><p><b>Spin</b> to earn a consonant value. A correct letter keeps your turn.</p><p><b>Buy a vowel</b> for {settings.vowelCost} round points. A missing vowel passes control.</p><p><b>Solve</b> the complete board. Wrong solves end the turn without revealing the answer.</p><p><b>Compost Pile</b> clears unbanked points unless protected.</p></div><button className="button button--gold button--full" onClick={() => { setRulesOpen(false); navigate("how"); }}>Read complete rules</button></Modal>}
    </div>
  );
}
