'use client';

// Tiny Web Audio sound design for the tour — no external/licensed assets, all
// synthesized. Soft sine "chimes" so stepping through the tour feels tactile
// and premium. Audio only starts after a user gesture (browser autoplay
// policy), which suits the tour: the first sound plays on the first "Next".

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** One soft sine note with a gentle bell-like decay. */
function note(freq: number, startAt: number, dur: number, gain: number) {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, ac.currentTime + startAt);
  // Quick attack, smooth exponential release.
  g.gain.setValueAtTime(0.0001, ac.currentTime + startAt);
  g.gain.exponentialRampToValueAtTime(gain, ac.currentTime + startAt + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + startAt + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(ac.currentTime + startAt);
  osc.stop(ac.currentTime + startAt + dur + 0.05);
}

/** Advance/step tick — a single bright note. */
export function playStep() {
  note(660, 0, 0.28, 0.05);
  note(990, 0.02, 0.22, 0.03);
}

/** Back — a lower, quieter note. */
export function playBack() {
  note(440, 0, 0.24, 0.04);
}

/** Welcome — a warm rising triad. */
export function playWelcome() {
  note(523.25, 0, 0.5, 0.05); // C5
  note(659.25, 0.09, 0.5, 0.045); // E5
  note(783.99, 0.18, 0.6, 0.05); // G5
}

/** Finish — a satisfying resolving arpeggio. */
export function playFinish() {
  note(659.25, 0, 0.4, 0.05); // E5
  note(783.99, 0.1, 0.4, 0.045); // G5
  note(1046.5, 0.2, 0.7, 0.055); // C6
}
