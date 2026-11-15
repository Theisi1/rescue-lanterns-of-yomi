/**
 * Instrumentos sintetizados con Web Audio API.
 * Todo el audio del juego se genera por código: no hay archivos con licencias de terceros
 * y la carga inicial es instantánea (requisito 4.8: carga eficiente).
 */

export const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);

let noiseBuffer = null;

/** Buffer de ruido blanco reutilizable (viento, papel, tambores). */
export function getNoise(ctx) {
  if (noiseBuffer) return noiseBuffer;
  noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return noiseBuffer;
}

function envGain(ctx, dest, time, attack, peak, decay) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, time);
  g.gain.linearRampToValueAtTime(peak, time + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, time + attack + decay);
  g.connect(dest);
  return g;
}

/**
 * Koto: cuerda pulsada (triángulo + armónicos) con decaimiento rápido.
 * `reversed` invierte la envolvente (ataque lento, corte seco) para la Visión de Yomi.
 */
export function koto(ctx, dest, midi, time, { vol = 0.18, decay = 1.2, detune = 0, reversed = false } = {}) {
  const f = midiToFreq(midi);
  const g = ctx.createGain();
  if (reversed) {
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(vol, time + decay * 0.8);
    g.gain.linearRampToValueAtTime(0.0001, time + decay * 0.85);
  } else {
    g.gain.setValueAtTime(vol, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + decay);
  }
  g.connect(dest);
  [[1, 'triangle', 1], [2.01, 'sine', 0.35], [3, 'sine', 0.12]].forEach(([mult, type, amp]) => {
    const o = ctx.createOscillator();
    const og = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f * mult, time);
    o.detune.value = detune;
    og.gain.value = amp;
    o.connect(og).connect(g);
    o.start(time);
    o.stop(time + decay + 0.05);
  });
}

/** Taiko: golpe grave con caída de tono + ruido del parche. */
export function taiko(ctx, dest, time, { vol = 0.5, pitch = 90 } = {}) {
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(pitch * 1.8, time);
  o.frequency.exponentialRampToValueAtTime(pitch * 0.6, time + 0.35);
  o.connect(envGain(ctx, dest, time, 0.004, vol, 0.45));
  o.start(time);
  o.stop(time + 0.5);

  const n = ctx.createBufferSource();
  n.buffer = getNoise(ctx);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 900;
  n.connect(lp).connect(envGain(ctx, dest, time, 0.002, vol * 0.35, 0.12));
  n.start(time);
  n.stop(time + 0.15);
}

/** Shakuhachi: flauta de bambú (seno con vibrato + soplido filtrado). */
export function shakuhachi(ctx, dest, midi, time, dur, { vol = 0.09, detune = 0 } = {}) {
  const f = midiToFreq(midi);
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(f * 0.97, time);
  o.frequency.linearRampToValueAtTime(f, time + 0.25);
  o.detune.value = detune;
  const vib = ctx.createOscillator();
  const vibGain = ctx.createGain();
  vib.frequency.value = 5;
  vibGain.gain.setValueAtTime(0, time);
  vibGain.gain.linearRampToValueAtTime(f * 0.012, time + dur * 0.6);
  vib.connect(vibGain).connect(o.frequency);

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, time);
  g.gain.linearRampToValueAtTime(vol, time + 0.3);
  g.gain.setValueAtTime(vol, time + dur - 0.3);
  g.gain.linearRampToValueAtTime(0.0001, time + dur);
  g.connect(dest);
  o.connect(g);

  const n = ctx.createBufferSource();
  n.buffer = getNoise(ctx);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = f * 2;
  bp.Q.value = 3;
  const ng = ctx.createGain();
  ng.gain.value = vol * 0.25;
  n.connect(bp).connect(ng).connect(g);

  [o, vib, n].forEach((s) => { s.start(time); s.stop(time + dur + 0.05); });
}

/** Campana de santuario: parciales inarmónicos con cola larga. */
export function bell(ctx, dest, midi, time, { vol = 0.2, decay = 2.5 } = {}) {
  const f = midiToFreq(midi);
  [[1, 1], [2.76, 0.5], [5.4, 0.25], [8.9, 0.12]].forEach(([mult, amp]) => {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = f * mult;
    o.connect(envGain(ctx, dest, time, 0.003, vol * amp, decay / mult ** 0.3));
    o.start(time);
    o.stop(time + decay + 0.1);
  });
}

/** Ruido filtrado con barrido: viento, susurros, papel rasgado, destellos. */
export function noiseSweep(ctx, dest, time, { dur = 0.4, vol = 0.2, from = 400, to = 2000, q = 1, type = 'bandpass', attack = 0.01 } = {}) {
  const n = ctx.createBufferSource();
  n.buffer = getNoise(ctx);
  n.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.Q.value = q;
  f.frequency.setValueAtTime(from, time);
  f.frequency.exponentialRampToValueAtTime(to, time + dur);
  n.connect(f).connect(envGain(ctx, dest, time, attack, vol, dur));
  n.start(time);
  n.stop(time + attack + dur + 0.05);
}

/** Tono simple con barrido de frecuencia (saltos, recolección, golpes). */
export function blip(ctx, dest, time, { type = 'square', from = 300, to = 600, dur = 0.12, vol = 0.12 } = {}) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(from, time);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, to), time + dur);
  o.connect(envGain(ctx, dest, time, 0.004, vol, dur));
  o.start(time);
  o.stop(time + dur + 0.05);
}
