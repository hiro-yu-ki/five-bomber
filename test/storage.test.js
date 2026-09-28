import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../src/config.js';
import { loadQuestions, loadSettings, resetQuestions, resetSettings, saveQuestions, saveSettings } from '../src/storage.js';

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, value); }
  removeItem(key) { this.values.delete(key); }
}

test('settings save, load and reset', () => {
  const storage = new MemoryStorage(); const value = { playerCount: 3, routeMode: 'roundTrip', playerNames: ['A', 'B', 'C'] };
  assert.equal(saveSettings(value, storage), true); assert.deepEqual(loadSettings(storage), value);
  assert.equal(resetSettings(storage).playerCount, 5); assert.equal(storage.getItem(CONFIG.storageKey), null);
});
test('questions save, load and reset', () => {
  const storage = new MemoryStorage(), questions = [{ prompt: 'Q', answer: 'A' }];
  assert.equal(saveQuestions(questions, storage), true); assert.deepEqual(loadQuestions(storage), questions);
  assert.ok(resetQuestions(storage).length > 1); assert.equal(storage.getItem(CONFIG.questionStorageKey), null);
});
test('corrupt persisted values safely use defaults', () => {
  const storage = new MemoryStorage(); storage.setItem(CONFIG.storageKey, '{'); storage.setItem(CONFIG.questionStorageKey, '{');
  assert.equal(loadSettings(storage).playerCount, 5); assert.ok(loadQuestions(storage).length > 0);
});
