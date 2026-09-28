import test from 'node:test';
import assert from 'node:assert/strict';
import { answerCorrect, answerWrong, beginQuestion, createAnswerOrder, createGame, createPipeLayout, createPlayerNames, currentPlayerIndex, explode, normalizeSettings, resumeAfterWrong, tick } from '../src/core.js';

const routes = [
  [3, 'oneWay', [0, 1, 2]], [3, 'roundTrip', [0, 1, 2, 2, 1, 0]],
  [4, 'oneWay', [0, 1, 2, 3]], [4, 'roundTrip', [0, 1, 2, 3, 3, 2, 1, 0]],
  [5, 'oneWay', [0, 1, 2, 3, 4]], [5, 'roundTrip', [0, 1, 2, 3, 4, 4, 3, 2, 1, 0]],
  [6, 'oneWay', [0, 1, 2, 3, 4, 5]], [6, 'roundTrip', [0, 1, 2, 3, 4, 5, 5, 4, 3, 2, 1, 0]]
];
for (const [count, mode, expected] of routes) test(`${count} players ${mode} answer order`, () => assert.deepEqual(createAnswerOrder(count, mode), expected));

test('invalid player counts and route modes are rejected', () => {
  assert.throws(() => createAnswerOrder(2, 'oneWay'), RangeError);
  assert.throws(() => createAnswerOrder(5, 'zigzag'), TypeError);
});

test('blank names receive defaults without replacing real names', () => {
  assert.deepEqual(createPlayerNames(3, [' Alice ', '', 'C']), ['Alice', 'PLAYER 2', 'C']);
});

test('settings normalize corrupt values to the five player one-way default', () => {
  assert.deepEqual(normalizeSettings({ playerCount: 99, routeMode: 'bad' }), { playerCount: 5, routeMode: 'oneWay', playerNames: ['PLAYER 1', 'PLAYER 2', 'PLAYER 3', 'PLAYER 4', 'PLAYER 5'] });
});

test('pipe layout count matches players and is symmetric', () => {
  for (const count of [3, 4, 5, 6]) {
    const layout = createPipeLayout(count); assert.equal(layout.length, count); assert.equal(layout[0].x + layout.at(-1).x, 1920);
  }
});

test('correct answer advances bomb/current player and eventually clears', () => {
  let game = createGame({ playerCount: 3, routeMode: 'oneWay' }, [{ prompt: 'Q', answer: 'A' }]);
  game = beginQuestion(game, 10); assert.equal(currentPlayerIndex(game), 0);
  game = answerCorrect(game, 20); assert.equal(game.phase, 'transition'); assert.equal(currentPlayerIndex(game), 1);
  game = beginQuestion(game, 30); game = answerCorrect(game, 40); game = beginQuestion(game, 50); game = answerCorrect(game, 60);
  assert.equal(game.phase, 'cleared'); assert.equal(game.score, 3);
});

test('wrong answer keeps the player and resumes with a new question', () => {
  const questions = [{ prompt: 'Q1', answer: 'A1' }, { prompt: 'Q2', answer: 'A2' }];
  let game = beginQuestion(createGame({ playerCount: 3 }, questions), 0);
  game = answerWrong(game, 10); assert.equal(game.phase, 'wrong'); assert.equal(game.turn, 0); assert.equal(game.revealed, true);
  game = resumeAfterWrong(game, 20); assert.equal(game.phase, 'question'); assert.equal(game.questionIndex, 1); assert.equal(game.turn, 0);
});

test('deadline causes timeout and explosion transition', () => {
  let game = beginQuestion(createGame({ playerCount: 3 }, [{ prompt: 'Q', answer: 'A' }]), 100, 500);
  assert.equal(tick(game, 599).phase, 'question'); game = tick(game, 600); assert.equal(game.phase, 'timeout');
  game = explode(game, 700); assert.equal(game.phase, 'exploded');
});

test('actions outside their valid phase do nothing', () => {
  const game = createGame({ playerCount: 3 }, [{ prompt: 'Q', answer: 'A' }]);
  assert.equal(answerCorrect(game, 1), game); assert.equal(answerWrong(game, 1), game); assert.equal(explode(game, 1), game);
});
