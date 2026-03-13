import { MATH_DIFFICULTY } from '../utils/constants';

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateSingleProblem(difficulty) {
  const cfg = MATH_DIFFICULTY[difficulty];
  const op = cfg.ops[randInt(0, cfg.ops.length - 1)];
  let a, b, answer, display;

  switch (op) {
    case '+':
      a = randInt(1, cfg.maxNum);
      b = randInt(1, cfg.maxNum);
      answer = a + b;
      display = `${a} + ${b}`;
      break;
    case '-':
      a = randInt(1, cfg.maxNum);
      b = randInt(1, a); // no negatives
      answer = a - b;
      display = `${a} − ${b}`;
      break;
    case '*':
      a = randInt(2, Math.min(cfg.maxNum, 20));
      b = randInt(2, Math.min(cfg.maxNum, 20));
      answer = a * b;
      display = `${a} × ${b}`;
      break;
    case '/':
      b = randInt(2, 12);
      answer = randInt(2, Math.floor(cfg.maxNum / b));
      a = answer * b; // ensure clean division
      display = `${a} ÷ ${b}`;
      break;
    default:
      a = randInt(1, 20); b = randInt(1, 20);
      answer = a + b;
      display = `${a} + ${b}`;
  }

  return { display, answer, op };
}

/**
 * Generate a set of math problems for a given difficulty.
 * Returns array of { display, answer } objects.
 */
export function generateMathChallenge(difficulty = 'medium') {
  const cfg = MATH_DIFFICULTY[difficulty];
  const problems = [];
  for (let i = 0; i < cfg.problems; i++) {
    problems.push(generateSingleProblem(difficulty));
  }
  return problems;
}

/**
 * For "brutal" difficulty: chain multiple operations into one expression.
 * e.g. "23 + 47 × 3 − 12"  (following PEMDAS)
 */
export function generateBrutalChain() {
  const a = randInt(10, 50);
  const b = randInt(2, 10);
  const c = randInt(2, 8);
  const d = randInt(1, 30);
  // Compute following PEMDAS: a + (b * c) - d
  const answer = a + b * c - d;
  const display = `${a} + ${b} × ${c} − ${d}`;
  return [{ display, answer, op: 'chain' }];
}

/**
 * Validate a user's answer string against the expected answer.
 */
export function checkAnswer(userInput, expected) {
  const parsed = parseInt(userInput.trim(), 10);
  if (isNaN(parsed)) return false;
  return parsed === expected;
}

/**
 * Format milliseconds to human-readable solve time.
 */
export function formatSolveTime(ms) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m ${rem}s`;
}
