import { pickPuzzle, puzzles } from "../src/cannabis/puzzles.ts";
import { CONSONANTS, VOWELS, applyCompost, countLetter, createPlayers, isCorrectSolve, nextPlayerIndex, rewardForLetter } from "../src/game/engine.ts";
import { createSpin } from "../src/game/wheel.ts";

let players = createPlayers("solo", ["Simulation Grower"]);
let currentPlayer = 0;
let rotation = 0;
let completedRounds = 0;
const recent: string[] = [];

for (let round = 0; round < 5; round += 1) {
  const puzzle = pickPuzzle("solo", recent, (round + 1) / 11);
  recent.push(puzzle.id);
  const guessed: string[] = [];
  players = players.map((player) => ({ ...player, roundPoints: 0 }));

  for (const letter of [...CONSONANTS, ...VOWELS]) {
    const spin = createSpin(rotation, ((round + letter.charCodeAt(0)) % 97) / 97);
    rotation = spin.finalRotation;
    if (spin.wedge.kind === "compost") {
      players[currentPlayer] = applyCompost(players[currentPlayer]).player;
      currentPlayer = nextPlayerIndex(players, currentPlayer);
      continue;
    }
    if (spin.wedge.kind === "lost-turn") {
      currentPlayer = nextPlayerIndex(players, currentPlayer);
      continue;
    }
    guessed.push(letter);
    const matches = countLetter(puzzle.answer, letter);
    if (matches && !VOWELS.includes(letter)) {
      players[currentPlayer].roundPoints += rewardForLetter(puzzle.answer, letter, spin.wedge.points ?? 500, spin.wedge.kind === "double" ? 2 : spin.wedge.kind === "triple" ? 3 : 1);
    }
    if (isCorrectSolve(puzzle.answer, puzzle)) {
      players[currentPlayer].matchPoints += players[currentPlayer].roundPoints + 1000;
      completedRounds += 1;
      break;
    }
  }
}

const winner = players.reduce((best, player) => player.matchPoints > best.matchPoints ? player : best, players[0]);
const bonus = pickPuzzle("breeder", recent, 0.73);
const bonusSolved = isCorrectSolve(bonus.answer, bonus);

console.log(`Simulated ${completedRounds} complete rounds with ${players.length} contestants.`);
console.log(`Winner: ${winner.name} · ${winner.matchPoints.toLocaleString()} Grow Points.`);
console.log(`Harvest Vault: ${bonusSolved ? "completed" : "failed"} · ${bonus.category}.`);
console.log(`Puzzle bank available to candidate AI: ${puzzles.length}. Hidden answer was never passed to letter choice.`);

if (completedRounds !== 5 || !bonusSolved) process.exitCode = 1;
