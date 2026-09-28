export const PLAYER_COUNTS = Object.freeze([3, 4, 5, 6]);
export const ROUTE_MODES = Object.freeze(['oneWay', 'roundTrip']);

export function createAnswerOrder(playerCount, routeMode) {
  assertPlayerCount(playerCount);
  if (!ROUTE_MODES.includes(routeMode)) throw new TypeError('Invalid route mode');
  const outward = Array.from({ length: playerCount }, (_, index) => index);
  return routeMode === 'roundTrip' ? outward.concat([...outward].reverse()) : outward;
}

export function createPlayerNames(playerCount, names = []) {
  assertPlayerCount(playerCount);
  return Array.from({ length: playerCount }, (_, index) => {
    const value = typeof names[index] === 'string' ? names[index].trim() : '';
    return value || `PLAYER ${index + 1}`;
  });
}

export function createPipeLayout(playerCount) {
  assertPlayerCount(playerCount);
  const left = 250, right = 1670, gap = (right - left) / (playerCount - 1);
  return Array.from({ length: playerCount }, (_, index) => ({ x: Math.round(left + gap * index), y: 850, bombY: 730 }));
}

export function normalizeSettings(value = {}) {
  const count = Number(value.playerCount);
  const playerCount = PLAYER_COUNTS.includes(count) ? count : 5;
  const routeMode = ROUTE_MODES.includes(value.routeMode) ? value.routeMode : 'oneWay';
  const rawNames = Array.isArray(value.playerNames) ? value.playerNames : [];
  return { playerCount, routeMode, playerNames: createPlayerNames(playerCount, rawNames) };
}

export function createGame(settings, questions, now = 0) {
  const clean = normalizeSettings(settings);
  if (!Array.isArray(questions) || questions.length === 0) throw new TypeError('At least one question is required');
  return { phase: 'ready', settings: clean, order: createAnswerOrder(clean.playerCount, clean.routeMode), layouts: createPipeLayout(clean.playerCount), turn: 0, questionIndex: 0, questions, startedAt: now, deadline: null, revealed: false, score: 0 };
}

export function beginQuestion(game, now, durationMs = 30_000) {
  if (!['ready', 'transition'].includes(game.phase)) return game;
  return { ...game, phase: 'question', startedAt: now, deadline: now + durationMs, revealed: false };
}

export function answerCorrect(game, now) {
  if (game.phase !== 'question') return game;
  const nextTurn = game.turn + 1;
  if (nextTurn >= game.order.length) return { ...game, phase: 'cleared', score: game.score + 1, deadline: null, startedAt: now };
  return { ...game, phase: 'transition', turn: nextTurn, questionIndex: (game.questionIndex + 1) % game.questions.length, score: game.score + 1, deadline: null, startedAt: now, revealed: false };
}

export function answerWrong(game, now) {
  if (game.phase !== 'question') return game;
  return { ...game, phase: 'wrong', deadline: null, startedAt: now, revealed: true };
}

export function resumeAfterWrong(game, now, durationMs = 30_000) {
  if (game.phase !== 'wrong') return game;
  return { ...game, phase: 'question', questionIndex: (game.questionIndex + 1) % game.questions.length, deadline: now + durationMs, startedAt: now, revealed: false };
}

export function tick(game, now) {
  if (game.phase === 'question' && game.deadline !== null && now >= game.deadline) return { ...game, phase: 'timeout', deadline: null, startedAt: now, revealed: true };
  return game;
}

export function explode(game, now) { return game.phase === 'timeout' ? { ...game, phase: 'exploded', startedAt: now } : game; }
export function currentPlayerIndex(game) { return game.order[game.turn]; }
export function currentQuestion(game) { return game.questions[game.questionIndex % game.questions.length]; }

function assertPlayerCount(playerCount) {
  if (!PLAYER_COUNTS.includes(playerCount)) throw new RangeError('Player count must be 3, 4, 5, or 6');
}
