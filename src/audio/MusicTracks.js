import { koto, taiko, shakuhachi, bell } from './Synth.js';

/**
 * Pistas musicales generativas. Cada pista define su tempo y una función `step`
 * que agenda las notas de una corchea en el instante `t`.
 *
 * Escala "In" japonesa sobre Re (D Eb G A Bb): tono melancólico y tenso.
 * Contexto `m`: { ctx, dest, intensity (0-1), yomi (bool) }
 */
const IN_SCALE = [62, 63, 67, 69, 70, 74, 75];
const DAWN_SCALE = [62, 64, 66, 69, 71, 74, 76];

// En la Visión de Yomi el koto suena "al revés" y desafinado.
const kotoOpts = (m, extra = {}) => ({
  ...extra,
  reversed: m.yomi,
  detune: m.yomi ? -60 : 0
});

export const TRACKS = {
  menu: {
    bpm: 58,
    length: 32,
    step(m, i, t) {
      const phrase = [0, -1, 2, -1, 3, -1, -1, -1, 4, -1, 3, -1, 2, -1, 1, -1];
      const n = phrase[i % 16];
      if (n >= 0) koto(m.ctx, m.dest, IN_SCALE[n] - (i >= 16 ? 12 : 0), t, kotoOpts(m, { vol: 0.14, decay: 2.2 }));
      if (i === 0) shakuhachi(m.ctx, m.dest, 69, t + 0.5, 4.5);
      if (i === 16) shakuhachi(m.ctx, m.dest, 67, t + 0.5, 3.5);
      if (i % 16 === 8) taiko(m.ctx, m.dest, t, { vol: 0.25, pitch: 60 });
    }
  },

  level: {
    bpm: 84,
    length: 32,
    step(m, i, t) {
      const ost = [0, 3, 4, 3, 2, 1, 0, -1];
      const n = ost[i % 8];
      const lift = i >= 16 ? 2 : 0;
      if (n >= 0) koto(m.ctx, m.dest, IN_SCALE[n] + (n === 0 ? lift : 0), t, kotoOpts(m, { vol: 0.12, decay: 0.9 }));
      // El taiko se densifica cuando hay espíritus cerca (intensity).
      const beat = i % 8;
      if (beat === 0) taiko(m.ctx, m.dest, t, { vol: 0.35 + m.intensity * 0.2 });
      if (beat === 6 && m.intensity > 0.2) taiko(m.ctx, m.dest, t, { vol: 0.22, pitch: 120 });
      if ((beat === 3 || beat === 5) && m.intensity > 0.55) taiko(m.ctx, m.dest, t, { vol: 0.18, pitch: 140 });
      if (i === 8) shakuhachi(m.ctx, m.dest, 74, t, 2.4, { detune: m.yomi ? -60 : 0 });
      if (i === 24) shakuhachi(m.ctx, m.dest, 70, t, 2.0, { detune: m.yomi ? -60 : 0 });
    }
  },

  boss: {
    bpm: 132,
    length: 16,
    step(m, i, t) {
      const pattern = [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1];
      if (pattern[i]) taiko(m.ctx, m.dest, t, { vol: 0.42, pitch: i % 4 === 0 ? 70 : 110 });
      const bass = [0, 0, 1, 0, 0, 0, 1, 2];
      koto(m.ctx, m.dest, IN_SCALE[bass[i % 8]] - 12, t, kotoOpts(m, { vol: 0.1, decay: 0.3 }));
      if (i === 0) koto(m.ctx, m.dest, IN_SCALE[4], t, kotoOpts(m, { vol: 0.12, decay: 1.4 }));
      if (i === 8) koto(m.ctx, m.dest, IN_SCALE[6], t, kotoOpts(m, { vol: 0.12, decay: 1.4 }));
    }
  },

  // Fase 2: más rápida, taiko más denso y un shakuhachi desafinado que inquieta.
  boss2: {
    bpm: 150,
    length: 16,
    step(m, i, t) {
      const pattern = [1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1];
      if (pattern[i]) taiko(m.ctx, m.dest, t, { vol: 0.46, pitch: i % 4 === 0 ? 65 : 115 });
      const bass = [0, 0, 1, 0, 2, 0, 1, 3];
      koto(m.ctx, m.dest, IN_SCALE[bass[i % 8]] - 12, t, kotoOpts(m, { vol: 0.11, decay: 0.25 }));
      const stabs = { 0: 5, 4: 4, 8: 6, 12: 3 };
      if (stabs[i] !== undefined) koto(m.ctx, m.dest, IN_SCALE[stabs[i]], t, kotoOpts(m, { vol: 0.12, decay: 0.9 }));
      if (i === 0) shakuhachi(m.ctx, m.dest, 74, t, 1.6, { vol: 0.08, detune: -35 });
    }
  },

  // Fase 3: frenética. Taiko en cada corchea, tritono disonante y un grito de flauta.
  boss3: {
    bpm: 176,
    length: 16,
    step(m, i, t) {
      taiko(m.ctx, m.dest, t, { vol: i % 2 === 0 ? 0.5 : 0.26, pitch: i % 4 === 0 ? 58 : i % 2 ? 145 : 100 });
      const bass = [0, 1, 0, 1, 0, 2, 0, 1];
      koto(m.ctx, m.dest, IN_SCALE[bass[i % 8]] - 12, t, kotoOpts(m, { vol: 0.12, decay: 0.2 }));
      if (i % 4 === 0) {
        // Mi bemol + La: un tritono que nunca resuelve.
        koto(m.ctx, m.dest, 63, t, kotoOpts(m, { vol: 0.1, decay: 0.5 }));
        koto(m.ctx, m.dest, 69, t, kotoOpts(m, { vol: 0.1, decay: 0.5 }));
      }
      if (i === 0) bell(m.ctx, m.dest, 75, t, { vol: 0.07, decay: 2 });
      if (i === 8) shakuhachi(m.ctx, m.dest, 75, t, 0.9, { vol: 0.09, detune: -50 });
    }
  },

  dawn: {
    bpm: 70,
    length: 16,
    step(m, i, t) {
      const mel = [0, -1, 2, -1, 3, 4, -1, -1, 5, -1, 4, -1, 3, -1, 2, -1];
      const n = mel[i];
      if (n >= 0) koto(m.ctx, m.dest, DAWN_SCALE[n], t, { vol: 0.13, decay: 2 });
      if (i === 0) bell(m.ctx, m.dest, 86, t, { vol: 0.06, decay: 4 });
      if (i === 4) shakuhachi(m.ctx, m.dest, 74, t, 3.5, { vol: 0.07 });
    }
  },

  gameover: {
    bpm: 50,
    length: 16,
    step(m, i, t) {
      const mel = [6, -1, 4, -1, 3, -1, 1, -1, 0, -1, -1, -1, -1, -1, -1, -1];
      const n = mel[i];
      if (n >= 0) koto(m.ctx, m.dest, IN_SCALE[n] - 12, t, { vol: 0.14, decay: 2.5, detune: -30 });
      if (i === 8) taiko(m.ctx, m.dest, t, { vol: 0.3, pitch: 50 });
    }
  }
};
