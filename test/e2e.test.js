import test from 'node:test';
import assert from 'node:assert/strict';
import { answerCorrect, beginQuestion, createAnswerOrder, createGame, createPipeLayout, currentPlayerIndex } from '../src/core.js';

for (const playerCount of [3, 4, 5, 6]) {
  for (const routeMode of ['oneWay', 'roundTrip']) {
    test(`E2E ${playerCount} players ${routeMode}: every position receives bomb then clear`, () => {
      const expected = createAnswerOrder(playerCount, routeMode); let now = 0;
      let game = createGame({ playerCount, routeMode, playerNames: [] }, [{ prompt: 'Q', answer: 'A' }], now);
      assert.equal(game.settings.playerNames.length, playerCount); assert.equal(createPipeLayout(playerCount).length, playerCount);
      const visited = [];
      for (let turn = 0; turn < expected.length; turn++) {
        game = beginQuestion(game, ++now); visited.push(currentPlayerIndex(game)); game = answerCorrect(game, ++now);
      }
      assert.deepEqual(visited, expected); assert.equal(game.phase, 'cleared'); assert.equal(game.score, expected.length);
    });
  }
}
