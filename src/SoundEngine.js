let audioContext;
let backgroundTimer;
let backgroundMood = 'battle';
let backgroundPlaying = false;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  return audioContext;
}

function playTone({ frequency, duration, type = 'sine', volume = 0.12, start = 0 }) {
  const context = getAudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const startTime = context.currentTime + start;
  const endTime = startTime + duration;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(endTime + 0.02);
}

function playNoise({ duration, volume = 0.08, start = 0 }) {
  const context = getAudioContext();
  const bufferSize = context.sampleRate * duration;
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const output = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i += 1) {
    output[i] = Math.random() * 2 - 1;
  }

  const source = context.createBufferSource();
  const gain = context.createGain();
  const startTime = context.currentTime + start;
  const endTime = startTime + duration;

  source.buffer = buffer;
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

  source.connect(gain);
  gain.connect(context.destination);
  source.start(startTime);
  source.stop(endTime);
}

export function playAttackSound(isCritical = false) {
  playTone({ frequency: isCritical ? 620 : 480, duration: 0.08, type: 'square', volume: 0.08 });
  playTone({ frequency: isCritical ? 920 : 720, duration: 0.12, type: 'sawtooth', volume: 0.07, start: 0.05 });
  playNoise({ duration: isCritical ? 0.22 : 0.14, volume: isCritical ? 0.09 : 0.06, start: 0.02 });
}

export function playMonsterHitSound() {
  playTone({ frequency: 170, duration: 0.09, type: 'triangle', volume: 0.12, start: 0.1 });
  playTone({ frequency: 110, duration: 0.13, type: 'triangle', volume: 0.09, start: 0.17 });
}

export function playWrongSound() {
  playTone({ frequency: 150, duration: 0.16, type: 'sawtooth', volume: 0.08 });
  playTone({ frequency: 95, duration: 0.2, type: 'sine', volume: 0.08, start: 0.12 });
}

export function playMonsterDefeatSound() {
  playTone({ frequency: 520, duration: 0.12, type: 'triangle', volume: 0.11 });
  playTone({ frequency: 660, duration: 0.12, type: 'triangle', volume: 0.11, start: 0.11 });
  playTone({ frequency: 880, duration: 0.18, type: 'triangle', volume: 0.12, start: 0.22 });
  playNoise({ duration: 0.28, volume: 0.05, start: 0.08 });
}

function playBackgroundPattern() {
  if (backgroundMood === 'focus') {
    playTone({ frequency: 262, duration: 0.18, type: 'triangle', volume: 0.026 });
    playTone({ frequency: 330, duration: 0.18, type: 'triangle', volume: 0.022, start: 0.34 });
    playTone({ frequency: 392, duration: 0.2, type: 'triangle', volume: 0.024, start: 0.68 });
    playTone({ frequency: 330, duration: 0.18, type: 'triangle', volume: 0.02, start: 1.04 });
    return 1500;
  }

  if (backgroundMood === 'combo') {
    playTone({ frequency: 392, duration: 0.12, type: 'square', volume: 0.025 });
    playTone({ frequency: 523, duration: 0.12, type: 'square', volume: 0.023, start: 0.22 });
    playTone({ frequency: 659, duration: 0.16, type: 'square', volume: 0.024, start: 0.44 });
    playTone({ frequency: 784, duration: 0.18, type: 'triangle', volume: 0.026, start: 0.74 });
    return 1300;
  }

  if (backgroundMood === 'danger') {
    playTone({ frequency: 146, duration: 0.2, type: 'sawtooth', volume: 0.024 });
    playTone({ frequency: 138, duration: 0.2, type: 'sawtooth', volume: 0.022, start: 0.38 });
    playTone({ frequency: 164, duration: 0.18, type: 'triangle', volume: 0.02, start: 0.76 });
    return 1250;
  }

  if (backgroundMood === 'warning') {
    playTone({ frequency: 196, duration: 0.12, type: 'sawtooth', volume: 0.026 });
    playTone({ frequency: 147, duration: 0.18, type: 'sawtooth', volume: 0.024, start: 0.2 });
    return 900;
  }

  if (backgroundMood === 'victory') {
    playTone({ frequency: 523, duration: 0.16, type: 'triangle', volume: 0.03 });
    playTone({ frequency: 659, duration: 0.16, type: 'triangle', volume: 0.03, start: 0.18 });
    playTone({ frequency: 784, duration: 0.2, type: 'triangle', volume: 0.032, start: 0.36 });
    playTone({ frequency: 1047, duration: 0.28, type: 'triangle', volume: 0.028, start: 0.6 });
    return 1800;
  }

  playTone({ frequency: 220, duration: 0.16, type: 'triangle', volume: 0.022 });
  playTone({ frequency: 277, duration: 0.16, type: 'triangle', volume: 0.02, start: 0.32 });
  playTone({ frequency: 330, duration: 0.18, type: 'triangle', volume: 0.022, start: 0.64 });
  playTone({ frequency: 277, duration: 0.16, type: 'triangle', volume: 0.018, start: 1.02 });
  return 1550;
}

function scheduleBackgroundLoop() {
  if (!backgroundPlaying) {
    return;
  }

  const delay = playBackgroundPattern();
  backgroundTimer = window.setTimeout(scheduleBackgroundLoop, delay);
}

export function startBackgroundMusic(mood = 'battle') {
  backgroundMood = mood;
  backgroundPlaying = true;
  window.clearTimeout(backgroundTimer);
  getAudioContext();
  scheduleBackgroundLoop();
}

export function setBackgroundMusicMood(mood) {
  backgroundMood = mood;
}

export function stopBackgroundMusic() {
  backgroundPlaying = false;
  window.clearTimeout(backgroundTimer);
}
