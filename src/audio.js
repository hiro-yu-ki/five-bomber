export class AudioController {
  constructor() { this.context = null; this.enabled = true; this.loopTimer = null; }
  setEnabled(enabled) { this.enabled = enabled; if (!enabled) this.stopBgm(); }
  async unlock() {
    if (!this.context) this.context = new AudioContext();
    if (this.context.state === 'suspended') await this.context.resume();
  }
  tone(frequency, duration = 0.12, type = 'square', volume = 0.05, delay = 0) {
    if (!this.enabled || !this.context) return;
    const start = this.context.currentTime + delay, oscillator = this.context.createOscillator(), gain = this.context.createGain();
    oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(volume, start); gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(this.context.destination); oscillator.start(start); oscillator.stop(start + duration);
  }
  cue(name) {
    if (name === 'correct') { this.tone(660); this.tone(990, 0.2, 'square', 0.05, 0.1); }
    else if (name === 'wrong') this.tone(170, 0.35, 'sawtooth', 0.07);
    else if (name === 'move') this.tone(330, 0.08, 'square', 0.035);
    else if (name === 'warning') this.tone(880, 0.1, 'square', 0.05);
    else if (name === 'explode') { [110, 80, 55].forEach((note, i) => this.tone(note, 0.8, 'sawtooth', 0.1, i * 0.08)); }
    else if (name === 'clear') [523, 659, 784, 1047].forEach((note, i) => this.tone(note, 0.24, 'square', 0.05, i * 0.13));
  }
  startBgm() {
    if (!this.enabled || this.loopTimer) return;
    let step = 0; const notes = [110, 110, 147, 165, 147, 110, 98, 110];
    const beat = () => { this.tone(notes[step++ % notes.length], 0.18, 'triangle', 0.025); };
    beat(); this.loopTimer = setInterval(beat, 260);
  }
  stopBgm() { clearInterval(this.loopTimer); this.loopTimer = null; }
}
