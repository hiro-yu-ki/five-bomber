import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_QUESTIONS, formatQuestions, parseQuestions } from '../src/questions.js';

test('question text round trips', () => assert.deepEqual(parseQuestions(formatQuestions(DEFAULT_QUESTIONS)), [...DEFAULT_QUESTIONS]));
test('blank lines are ignored', () => assert.deepEqual(parseQuestions('\n Q | A \n'), [{ prompt: 'Q', answer: 'A' }]));
test('malformed and empty question data is rejected', () => { assert.throws(() => parseQuestions('broken')); assert.throws(() => parseQuestions('   ')); });
