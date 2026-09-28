import { AudioController } from './audio.js';
import { CONFIG } from './config.js';
import { answerCorrect, answerWrong, beginQuestion, createGame, currentPlayerIndex, currentQuestion, explode, normalizeSettings, resumeAfterWrong, tick } from './core.js';
import { formatQuestions, parseQuestions } from './questions.js';
import { StageRenderer } from './renderer.js';
import { loadQuestions, loadSettings, resetQuestions, resetSettings, saveQuestions, saveSettings } from './storage.js';

const elements = Object.fromEntries([...document.querySelectorAll('[id]')].map((element) => [element.id, element]));
const names = () => [...elements['name-fields'].querySelectorAll('input')].map((input) => input.value);
const audio = new AudioController();
const renderer = new StageRenderer(elements.stage);
let settings = loadSettings();
let questions = loadQuestions();
let game = null;
let runId = 0;
let lastWarnedSecond = null;

function showScreen(id) {
  ['settings-screen', 'editor-screen', 'game-screen'].forEach((screen) => elements[screen].classList.toggle('hidden', screen !== id));
}

function renderNameFields(count, values = names()) {
  elements['name-fields'].replaceChildren(...Array.from({ length: count }, (_, index) => {
    const input = document.createElement('input');
    input.type = 'text'; input.maxLength = 24; input.autocomplete = 'off';
    input.placeholder = `PLAYER ${index + 1}`; input.setAttribute('aria-label', `プレイヤー${index + 1}の名前`);
    input.value = values[index] ?? `PLAYER ${index + 1}`;
    return input;
  }));
}

function applySettingsForm(value) {
  settings = normalizeSettings(value); elements['player-count'].value = String(settings.playerCount);
  renderNameFields(settings.playerCount, settings.playerNames);
  const radio = document.querySelector(`input[name="routeMode"][value="${settings.routeMode}"]`); if (radio) radio.checked = true;
}

function readSettingsForm() {
  return normalizeSettings({ playerCount: Number(elements['player-count'].value), playerNames: names(), routeMode: document.querySelector('input[name="routeMode"]:checked')?.value });
}

function renderPlayerLabels() {
  elements['player-labels'].replaceChildren(...game.layouts.map((layout, index) => {
    const label = document.createElement('div'); label.className = 'player-label';
    label.classList.toggle('active', index === currentPlayerIndex(game));
    label.style.left = `${layout.x / CONFIG.stage.width * 100}%`; label.textContent = game.settings.playerNames[index]; return label;
  }));
}

function announce(text, danger = false) {
  elements.announcement.textContent = text; elements.announcement.classList.toggle('danger', danger); elements.announcement.classList.remove('hidden');
  elements.announcement.style.animation = 'none'; requestAnimationFrame(() => { elements.announcement.style.animation = ''; });
}
function hideAnnouncement() { elements.announcement.classList.add('hidden'); }

function renderGameUi(now) {
  if (!game) return;
  const question = currentQuestion(game), active = game.phase === 'question';
  elements['question-number'].textContent = `QUESTION ${game.questionIndex + 1} / TURN ${game.turn + 1} of ${game.order.length}`;
  elements['question-text'].textContent = question.prompt;
  elements['answer-text'].textContent = game.revealed ? question.answer : '';
  elements['correct-button'].disabled = !active; elements['wrong-button'].disabled = !active; elements['reveal-button'].disabled = !active;
  const remaining = game.deadline === null ? 0 : Math.max(0, game.deadline - now);
  const ratio = active ? remaining / (CONFIG.questionSeconds * 1000) : 0;
  elements['timer-bar'].style.transform = `scaleX(${ratio})`;
  elements['timer-text'].textContent = active ? String(Math.ceil(remaining / 1000)).padStart(2, '0') : '--';
  renderPlayerLabels(); renderer.draw(game, now);
}

function schedule(callback, delay, id = runId) { setTimeout(() => { if (id === runId && game) callback(); }, delay); }

function enterQuestion(fromWrong = false) {
  const now = performance.now();
  game = fromWrong ? resumeAfterWrong(game, now, CONFIG.questionSeconds * 1000) : beginQuestion(game, now, CONFIG.questionSeconds * 1000);
  lastWarnedSecond = null; hideAnnouncement(); audio.startBgm(); renderGameUi(now);
}

async function startGame(event) {
  event?.preventDefault(); elements['settings-error'].textContent = '';
  try {
    settings = readSettingsForm(); saveSettings(settings); await audio.unlock();
    game = createGame(settings, questions, performance.now()); runId++; showScreen('game-screen');
    elements['end-panel'].classList.add('hidden'); elements['route-label'].textContent = settings.routeMode === 'oneWay' ? '片道' : '往復';
    renderer.previousBomb = null; renderer.targetBomb = null; renderer.setBombTarget(game.layouts[currentPlayerIndex(game)], performance.now());
    announce('READY'); audio.cue('move'); schedule(() => { announce('GO!'); schedule(() => enterQuestion(), 360); }, CONFIG.readyMs);
  } catch (error) { console.error(error); elements['settings-error'].textContent = 'ゲームを開始できませんでした。問題設定を確認してください。'; }
}

function markCorrect() {
  if (!game || game.phase !== 'question') return;
  audio.cue('correct'); announce('正解！'); const oldTurn = game.turn; game = answerCorrect(game, performance.now());
  if (game.phase === 'cleared') { audio.stopBgm(); audio.cue('clear'); schedule(() => finishGame('GAME CLEAR'), CONFIG.correctMs); }
  else {
    renderer.setBombTarget(game.layouts[currentPlayerIndex(game)], performance.now()); audio.cue('move');
    schedule(() => { if (game.turn !== oldTurn) enterQuestion(); }, CONFIG.correctMs);
  }
}

function markWrong() {
  if (!game || game.phase !== 'question') return;
  audio.cue('wrong'); game = answerWrong(game, performance.now()); announce('不正解', true); renderGameUi(performance.now());
  schedule(() => enterQuestion(true), CONFIG.wrongMs);
}

function triggerTimeout(now) {
  announce('TIME UP', true); audio.stopBgm(); audio.cue('explode'); schedule(() => { game = explode(game, performance.now()); renderGameUi(performance.now()); schedule(() => finishGame('GAME OVER'), CONFIG.explosionMs); }, 250);
}

function finishGame(title) {
  hideAnnouncement(); elements['end-title'].textContent = title; elements['end-panel'].classList.remove('hidden'); renderGameUi(performance.now());
}

function frame(now) {
  if (game && !elements['game-screen'].classList.contains('hidden')) {
    const previousPhase = game.phase; game = tick(game, now);
    if (previousPhase !== 'timeout' && game.phase === 'timeout') triggerTimeout(now);
    if (game.phase === 'question' && game.deadline !== null) {
      const seconds = Math.ceil((game.deadline - now) / 1000);
      if (seconds <= 5 && seconds > 0 && seconds !== lastWarnedSecond) { lastWarnedSecond = seconds; audio.cue('warning'); }
    }
    renderGameUi(now);
  }
  requestAnimationFrame(frame);
}

elements['player-count'].addEventListener('change', () => renderNameFields(Number(elements['player-count'].value)));
elements['settings-form'].addEventListener('submit', startGame);
elements['correct-button'].addEventListener('click', markCorrect); elements['wrong-button'].addEventListener('click', markWrong);
elements['reveal-button'].addEventListener('click', () => { if (game?.phase === 'question') { game = { ...game, revealed: !game.revealed }; } });
elements['restart-button'].addEventListener('click', startGame);
elements['back-button'].addEventListener('click', () => { runId++; game = null; audio.stopBgm(); showScreen('settings-screen'); });
elements['reset-settings-button'].addEventListener('click', () => applySettingsForm(resetSettings()));
elements['question-editor-button'].addEventListener('click', () => { elements['question-input'].value = formatQuestions(questions); elements['editor-error'].textContent = ''; showScreen('editor-screen'); });
elements['close-editor-button'].addEventListener('click', () => showScreen('settings-screen'));
elements['save-questions-button'].addEventListener('click', () => { try { questions = parseQuestions(elements['question-input'].value); saveQuestions(questions); elements['editor-error'].textContent = '保存しました。'; } catch (error) { elements['editor-error'].textContent = error.message; } });
elements['restore-questions-button'].addEventListener('click', () => { questions = resetQuestions(); elements['question-input'].value = formatQuestions(questions); elements['editor-error'].textContent = '標準問題に戻しました。'; });
elements['sound-button'].addEventListener('click', async () => { await audio.unlock(); audio.setEnabled(!audio.enabled); elements['sound-button'].textContent = audio.enabled ? '音 ON' : '音 OFF'; elements['sound-button'].setAttribute('aria-pressed', String(!audio.enabled)); if (audio.enabled && game?.phase === 'question') audio.startBgm(); });
elements['fullscreen-button'].addEventListener('click', async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch (error) { console.error('Fullscreen request failed', error); } });
document.addEventListener('fullscreenchange', () => { elements['fullscreen-button'].textContent = document.fullscreenElement ? '全画面終了' : '全画面'; });
document.addEventListener('keydown', (event) => { if (event.repeat || !game) return; if (event.code === 'KeyO' || event.code === 'NumpadEnter') markCorrect(); if (event.code === 'KeyX' || event.code === 'Backspace') markWrong(); });

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./service-worker.js').catch((error) => console.warn('Offline cache unavailable', error));
applySettingsForm(settings); requestAnimationFrame(frame);
