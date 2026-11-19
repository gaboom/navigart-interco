// Morse helpers: visual rendering and audio (Web Audio). Morse is stored as '.' and '-' strings in the data.
let ctx;
let stopFlag = false;

export function visual(code) {
  return `<span class="morse-vis" aria-label="${spoken(code)}">` +
    [...code].map((c) => `<i class="${c === '.' ? 'dot' : 'dash'}"></i>`).join('') + '</span>';
}

export function pretty(code) {
  return [...code].map((c) => (c === '.' ? '•' : '–')).join(' ');
}

export function spoken(code) {
  return [...code].map((c) => (c === '.' ? 'dit' : 'dah')).join(' ');
}

// Plays a Morse string; `onSymbol(i)` is called as each symbol starts (to flash the visual), `onEnd()` at the end.
export async function play(code, { unit = 0.09, freq = 620, onSymbol, onEnd } = {}) {
  stopFlag = false;
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    await ctx.resume();
  } catch { ctx = null; }
  const sleep = (s) => new Promise((r) => setTimeout(r, s * 1000));
  for (let i = 0; i < code.length && !stopFlag; i++) {
    if (code[i] === ' ') { await sleep(unit * 2); continue; } // letter gap
    const len = code[i] === '.' ? unit : unit * 3;
    onSymbol?.(i);
    if (ctx) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.01);
      g.gain.setValueAtTime(0.25, ctx.currentTime + len - 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + len);
      osc.connect(g).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + len + 0.02);
    }
    await sleep(len + unit);
  }
  onSymbol?.(-1);
  onEnd?.();
}

export function stop() { stopFlag = true; }
