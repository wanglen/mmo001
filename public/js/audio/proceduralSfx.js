/**
 * Procedural one-shot SFX via Web Audio (no asset files).
 * @param {AudioContext} ctx
 * @param {GainNode} bus
 * @param {string} name
 */
export function playProceduralSfx(ctx, bus, name) {
  const t = ctx.currentTime;
  switch (name) {
    case 'levelUp':
      playToneSweep(ctx, bus, t, { startHz: 440, endHz: 880, duration: 0.35, type: 'triangle', peak: 0.2 });
      playToneSweep(ctx, bus, t + 0.08, { startHz: 660, endHz: 1320, duration: 0.28, type: 'sine', peak: 0.12 });
      break;
    case 'hit':
      playNoiseBurst(ctx, bus, t, { duration: 0.06, peak: 0.25, filterHz: 900 });
      break;
    case 'swing':
      playWhoosh(ctx, bus, t, { duration: 0.12, peak: 0.15 });
      break;
    case 'skill':
      playToneSweep(ctx, bus, t, { startHz: 320, endHz: 640, duration: 0.18, type: 'sine', peak: 0.14 });
      playNoiseBurst(ctx, bus, t + 0.04, { duration: 0.08, peak: 0.08, filterHz: 2400 });
      break;
    case 'pickup':
      playToneSweep(ctx, bus, t, { startHz: 880, endHz: 1175, duration: 0.12, type: 'square', peak: 0.08 });
      break;
    case 'death':
      playToneSweep(ctx, bus, t, { startHz: 220, endHz: 55, duration: 0.55, type: 'sawtooth', peak: 0.18 });
      break;
    case 'zone':
      playToneSweep(ctx, bus, t, { startHz: 180, endHz: 720, duration: 0.45, type: 'sine', peak: 0.12 });
      playNoiseBurst(ctx, bus, t + 0.1, { duration: 0.2, peak: 0.06, filterHz: 4000 });
      break;
    case 'ui':
      playToneSweep(ctx, bus, t, { startHz: 520, endHz: 780, duration: 0.06, type: 'triangle', peak: 0.06 });
      break;
    default:
      break;
  }
}

/**
 * @param {AudioContext} ctx
 * @param {GainNode} destination
 * @param {number} t
 * @param {{ startHz: number, endHz: number, duration: number, type: OscillatorType, peak: number }} opts
 */
function playToneSweep(ctx, destination, t, opts) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = opts.type;
  osc.frequency.setValueAtTime(opts.startHz, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(opts.endHz, 1), t + opts.duration);
  gain.gain.setValueAtTime(opts.peak, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + opts.duration);
  osc.connect(gain);
  gain.connect(destination);
  osc.start(t);
  osc.stop(t + opts.duration + 0.02);
}

/**
 * @param {AudioContext} ctx
 * @param {GainNode} destination
 * @param {number} t
 * @param {{ duration: number, peak: number, filterHz: number }} opts
 */
function playNoiseBurst(ctx, destination, t, opts) {
  const bufferSize = Math.floor(ctx.sampleRate * opts.duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = opts.filterHz;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(opts.peak, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + opts.duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  source.start(t);
  source.stop(t + opts.duration + 0.02);
}

function playWhoosh(ctx, destination, t, opts) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(1200, t);
  osc.frequency.exponentialRampToValueAtTime(120, t + opts.duration);
  gain.gain.setValueAtTime(opts.peak, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + opts.duration);
  osc.connect(gain);
  gain.connect(destination);
  osc.start(t);
  osc.stop(t + opts.duration + 0.02);
}
