const MUTE_KEY = 'prompTetrisMute';

let audioCtx: AudioContext | null = null;

function ctx(): AudioContext | null {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    return audioCtx;
  } catch {
    return null;
  }
}

function beep(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain = 0.08,
) {
  if (typeof window === 'undefined' || isMuted()) return;
  const c = ctx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + duration);
}

export function isMuted(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(MUTE_KEY) === '1';
}

export function setMuted(muted: boolean): void {
  localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
}

export function resumeAudioContext(): void {
  void ctx()?.resume();
}

export type GameSound = 'move' | 'drop' | 'correct' | 'wrong' | 'level';

export function playGameSound(kind: GameSound): void {
  if (isMuted()) return;
  switch (kind) {
    case 'move':
      beep(220, 0.04, 'triangle', 0.04);
      break;
    case 'drop':
      beep(180, 0.07, 'square', 0.06);
      break;
    case 'correct':
      beep(523, 0.08, 'sine', 0.07);
      setTimeout(() => beep(659, 0.1, 'sine', 0.06), 70);
      break;
    case 'wrong':
      beep(120, 0.15, 'sawtooth', 0.05);
      break;
    case 'level':
      beep(392, 0.12, 'sine', 0.07);
      setTimeout(() => beep(523, 0.15, 'sine', 0.07), 100);
      setTimeout(() => beep(659, 0.18, 'sine', 0.06), 220);
      break;
    default:
      break;
  }
}
