let audioContext;
let backgroundTimer;
let backgroundMood = 'battle';
let backgroundPlaying = false;
let backgroundStep = 0;

const NOTES = {
  c3: 130.81,
  d3: 146.83,
  e3: 164.81,
  f3: 174.61,
  g3: 196,
  a3: 220,
  b3: 246.94,
  c4: 261.63,
  d4: 293.66,
  e4: 329.63,
  f4: 349.23,
  g4: 392,
  a4: 440,
  b4: 493.88,
  c5: 523.25,
  d5: 587.33,
  e5: 659.25,
  f5: 698.46,
  g5: 783.99,
  a5: 880,
  c6: 1046.5
};

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

function playBell(frequency, start = 0, volume = 0.026) {
  playTone({ frequency, duration: 0.22, type: 'sine', volume, start });
  playTone({ frequency: frequency * 2.01, duration: 0.12, type: 'sine', volume: volume * 0.35, start });
}

function playChord(frequencies, start = 0, volume = 0.018) {
  frequencies.forEach((frequency, index) => {
    playTone({
      frequency,
      duration: 0.46,
      type: 'triangle',
      volume: volume * (index === 0 ? 1 : 0.72),
      start
    });
  });
}

function playSoftKick(start = 0, volume = 0.035) {
  playTone({ frequency: 92, duration: 0.08, type: 'sine', volume, start });
  playNoise({ duration: 0.035, volume: volume * 0.7, start });
}

function playSoftClick(start = 0, volume = 0.016) {
  playNoise({ duration: 0.035, volume, start });
  playTone({ frequency: NOTES.c5, duration: 0.035, type: 'triangle', volume: volume * 0.7, start });
}

function playArpeggio(notes, start = 0, volume = 0.026, gap = 0.18) {
  notes.forEach((note, index) => {
    playBell(note, start + index * gap, volume);
  });
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

export function playVictoryMusic() {
  playChord([NOTES.c4, NOTES.e4, NOTES.g4], 0, 0.03);
  playBell(NOTES.c5, 0.04, 0.04);
  playBell(NOTES.e5, 0.24, 0.04);
  playBell(NOTES.g5, 0.44, 0.04);
  playBell(NOTES.c6, 0.72, 0.042);
  playChord([NOTES.f4, NOTES.a4, NOTES.c5], 1.02, 0.026);
  playBell(NOTES.a5, 1.08, 0.032);
  playBell(NOTES.g5, 1.3, 0.03);
  playBell(NOTES.c6, 1.58, 0.036);
}

function playBackgroundPattern() {
  if (backgroundMood === 'focus') {
    const patterns = [
      [NOTES.c4, NOTES.e4, NOTES.g4, NOTES.e4],
      [NOTES.d4, NOTES.f4, NOTES.a4, NOTES.f4],
      [NOTES.e4, NOTES.g4, NOTES.b4, NOTES.g4],
      [NOTES.c4, NOTES.g4, NOTES.e4, NOTES.g4]
    ];
    const pattern = patterns[backgroundStep % patterns.length];
    playChord([pattern[0] / 2, pattern[0], pattern[2]], 0, 0.012);
    playArpeggio(pattern, 0.08, 0.022, 0.22);
    playSoftClick(0.88, 0.012);
    backgroundStep += 1;
    return 1180;
  }

  if (backgroundMood === 'combo') {
    const patterns = [
      [NOTES.g4, NOTES.b4, NOTES.d5, NOTES.g5],
      [NOTES.a4, NOTES.c5, NOTES.e5, NOTES.a5],
      [NOTES.g4, NOTES.d5, NOTES.e5, NOTES.g5]
    ];
    playSoftKick(0, 0.032);
    playSoftClick(0.34, 0.018);
    playSoftKick(0.66, 0.026);
    playArpeggio(patterns[backgroundStep % patterns.length], 0.04, 0.028, 0.16);
    playBell(NOTES.c6, 0.78, 0.018);
    backgroundStep += 1;
    return 1040;
  }

  if (backgroundMood === 'danger') {
    const pulse = backgroundStep % 2 === 0 ? NOTES.d3 : NOTES.c3;
    playTone({ frequency: pulse, duration: 0.22, type: 'sawtooth', volume: 0.022 });
    playTone({ frequency: pulse * 1.5, duration: 0.14, type: 'triangle', volume: 0.014, start: 0.28 });
    playSoftClick(0.54, 0.015);
    playTone({ frequency: pulse * 1.12, duration: 0.18, type: 'sine', volume: 0.014, start: 0.78 });
    backgroundStep += 1;
    return 980;
  }

  if (backgroundMood === 'warning') {
    playTone({ frequency: NOTES.g3, duration: 0.1, type: 'sawtooth', volume: 0.024 });
    playTone({ frequency: NOTES.d3, duration: 0.18, type: 'sawtooth', volume: 0.022, start: 0.16 });
    playSoftClick(0.42, 0.018);
    backgroundStep += 1;
    return 760;
  }

  if (backgroundMood === 'victory') {
    playChord([NOTES.c4, NOTES.e4, NOTES.g4], 0, 0.018);
    playArpeggio([NOTES.c5, NOTES.e5, NOTES.g5, NOTES.c6], 0.02, 0.03, 0.16);
    playBell(NOTES.g5, 0.86, 0.02);
    backgroundStep += 1;
    return 1700;
  }

  const patterns = [
    [NOTES.c4, NOTES.e4, NOTES.g4, NOTES.c5],
    [NOTES.g3, NOTES.d4, NOTES.g4, NOTES.b4],
    [NOTES.a3, NOTES.e4, NOTES.a4, NOTES.c5],
    [NOTES.f3, NOTES.c4, NOTES.f4, NOTES.a4]
  ];
  const pattern = patterns[backgroundStep % patterns.length];
  playSoftKick(0, 0.028);
  playSoftClick(0.48, 0.014);
  playChord([pattern[0], pattern[1], pattern[2]], 0.02, 0.012);
  playArpeggio(pattern, 0.08, 0.024, 0.2);
  backgroundStep += 1;
  return 1260;
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
  backgroundStep = 0;
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
