// Gentle two-tone chime via the Web Audio API — no audio asset needed.
// Shared by the dashboard notification badges. Autoplay may be blocked until
// the first user gesture on the page; that's caught and ignored.
export function playChime(): void {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    const notes = [880, 1174.66]; // A5 → D6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = now + i * 0.14;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.34);
    });
    setTimeout(() => ctx.close().catch(() => {}), 900);
  } catch {
    /* autoplay blocked until first gesture — ignore */
  }
}
