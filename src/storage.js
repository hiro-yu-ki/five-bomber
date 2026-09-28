import { CONFIG } from './config.js';
import { normalizeSettings } from './core.js';
import { DEFAULT_QUESTIONS } from './questions.js';

export function loadSettings(storage = localStorage) {
  try { return normalizeSettings(JSON.parse(storage.getItem(CONFIG.storageKey) || '{}')); }
  catch (error) { console.warn('Saved settings could not be read', error); return normalizeSettings(); }
}
export function saveSettings(settings, storage = localStorage) {
  try { storage.setItem(CONFIG.storageKey, JSON.stringify(normalizeSettings(settings))); return true; }
  catch (error) { console.error('Settings could not be saved', error); return false; }
}
export function resetSettings(storage = localStorage) {
  try { storage.removeItem(CONFIG.storageKey); } catch (error) { console.error('Settings could not be reset', error); }
  return normalizeSettings();
}
export function loadQuestions(storage = localStorage) {
  try {
    const saved = JSON.parse(storage.getItem(CONFIG.questionStorageKey) || 'null');
    return Array.isArray(saved) && saved.length ? saved : [...DEFAULT_QUESTIONS];
  } catch (error) { console.warn('Saved questions could not be read', error); return [...DEFAULT_QUESTIONS]; }
}
export function saveQuestions(questions, storage = localStorage) {
  try { storage.setItem(CONFIG.questionStorageKey, JSON.stringify(questions)); return true; }
  catch (error) { console.error('Questions could not be saved', error); return false; }
}
export function resetQuestions(storage = localStorage) {
  try { storage.removeItem(CONFIG.questionStorageKey); } catch (error) { console.error('Questions could not be reset', error); }
  return [...DEFAULT_QUESTIONS];
}
