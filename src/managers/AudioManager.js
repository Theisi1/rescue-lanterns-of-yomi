import { StorageManager } from './StorageManager.js';
import { EventBus, EVENTS } from './EventBus.js';
import { TRACKS } from '../audio/MusicTracks.js';
import { koto, taiko, bell, noiseSweep, blip } from '../audio/Synth.js';

const MUSIC_VOLUME = 0.55;
const MASTER_VOLUME = 0.9;

/**
 * Gestor de audio (requisito 4.5): música de fondo, efectos y mute persistente.
 *
 * Usa un secuenciador con "lookahead": cada 25 ms agenda las notas de los próximos
 * 120 ms en el reloj de Web Audio, así el ritmo se mantiene estable aunque baje el FPS.
 */
class AudioManagerClass {
  constructor() {
    this.ctx = null;
    this.muted = !!StorageManager.getAudio().muted;
    this.track = null;
    this.trackName = null;
    this.intensity = 0;
    this.yomi = false;
    this.step = 0;
    this.nextTime = 0;
    this.timer = null;
  }

  /** Crea/reanuda el AudioContext. Los navegadores exigen un gesto del usuario antes de sonar. */
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : MASTER_VOLUME;
      this.master.connect(this.ctx.destination);

      // Bus de música con filtro: la Visión de Yomi "ahoga" la música.
      this.musicFilter = this.ctx.createBiquadFilter();
      this.musicFilter.type = 'lowpass';
      this.musicFilter.frequency.value = 18000;
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = MUSIC_VOLUME;
      this.musicGain.connect(this.musicFilter).connect(this.master);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.8;
      this.sfxGain.connect(this.master);

      if (this.trackName) this.playMusic(this.trackName, true);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  get ready() {
    return !!this.ctx && this.ctx.state === 'running';
  }

  // ---------------------------------------------------------------- música
  playMusic(name, force = false) {
    if (this.trackName === name && !force) return;
    this.trackName = name;
    this.track = TRACKS[name];
    this.step = 0;
    if (!this.ctx) return; // empezará cuando el usuario desbloquee el audio
    clearInterval(this.timer);
    const now = this.ctx.currentTime;
    this.musicGain.gain.cancelScheduledValues(now);
    this.musicGain.gain.setValueAtTime(0.0001, now);
    this.musicGain.gain.linearRampToValueAtTime(MUSIC_VOLUME, now + 0.8);
    this.nextTime = now + 0.1;
    this.timer = setInterval(() => this.schedule(), 25);
  }

  /**
   * Cambia de pista sin cortar el ritmo (sin fundido ni silencio).
   * Se usa en las fases del jefe para que la música "acelere" de golpe.
   */
  switchMusic(name) {
    if (this.trackName === name) return;
    this.trackName = name;
    this.track = TRACKS[name];
    this.step = 0;
  }

  stopMusic() {
    clearInterval(this.timer);
    this.timer = null;
    this.trackName = null;
    this.track = null;
  }

  schedule() {
    if (!this.track || !this.ctx) return;
    const stepDur = 60 / this.track.bpm / 2;
    // Si la pestaña estuvo oculta no intentamos "recuperar" las notas atrasadas.
    if (this.nextTime < this.ctx.currentTime - 0.5) this.nextTime = this.ctx.currentTime + 0.05;
    while (this.nextTime < this.ctx.currentTime + 0.12) {
      this.track.step(
        { ctx: this.ctx, dest: this.musicGain, intensity: this.intensity, yomi: this.yomi },
        this.step,
        this.nextTime
      );
      this.step = (this.step + 1) % this.track.length;
      this.nextTime += stepDur;
    }
  }

  /** 0-1: qué tan cerca están los espíritus (los taiko se aceleran). */
  setIntensity(value) {
    this.intensity = value;
  }

  /** La Visión de Yomi distorsiona e invierte la música. */
  setYomi(active) {
    if (this.yomi === active) return;
    this.yomi = active;
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.musicFilter.frequency.cancelScheduledValues(now);
    this.musicFilter.frequency.setTargetAtTime(active ? 650 : 18000, now, 0.15);
  }

  // ---------------------------------------------------------------- mute
  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  setMuted(muted) {
    this.muted = muted;
    StorageManager.setAudio({ muted });
    if (this.master) this.master.gain.setTargetAtTime(muted ? 0 : MASTER_VOLUME, this.ctx.currentTime, 0.05);
    EventBus.emit(EVENTS.MUTE, muted);
  }

  // ---------------------------------------------------------------- efectos
  /** Reproduce un efecto por nombre; se sintetiza en el momento. */
  sfx(name) {
    if (!this.ready || this.muted) return;
    const c = this.ctx;
    const d = this.sfxGain;
    const t = c.currentTime + 0.005;
    switch (name) {
      case 'jump': // patitas de madera
        blip(c, d, t, { type: 'triangle', from: 220, to: 440, dur: 0.1, vol: 0.18 });
        noiseSweep(c, d, t, { dur: 0.04, vol: 0.15, from: 3000, to: 2500, q: 8 });
        break;
      case 'doublejump':
        blip(c, d, t, { type: 'triangle', from: 330, to: 880, dur: 0.14, vol: 0.16 });
        break;
      case 'flash': // la llama ruge
        noiseSweep(c, d, t, { dur: 0.45, vol: 0.35, from: 200, to: 3500, q: 0.7 });
        blip(c, d, t, { type: 'sawtooth', from: 110, to: 440, dur: 0.3, vol: 0.06 });
        break;
      case 'rescue': // campanilla de santuario
        bell(c, d, 81, t, { vol: 0.22, decay: 2 });
        bell(c, d, 88, t + 0.12, { vol: 0.16, decay: 2 });
        break;
      case 'pickup':
        blip(c, d, t, { type: 'square', from: 880, to: 1320, dur: 0.06, vol: 0.06 });
        blip(c, d, t + 0.06, { type: 'square', from: 1320, to: 1760, dur: 0.08, vol: 0.06 });
        break;
      case 'oil':
        blip(c, d, t, { type: 'sine', from: 300, to: 700, dur: 0.25, vol: 0.18 });
        break;
      case 'powerup':
        [74, 79, 81, 86].forEach((n, i) => koto(c, d, n, t + i * 0.07, { vol: 0.15, decay: 0.6 }));
        break;
      case 'hurt': // papel que se rasga
        noiseSweep(c, d, t, { dur: 0.22, vol: 0.4, from: 4000, to: 1200, q: 2 });
        blip(c, d, t, { type: 'sawtooth', from: 200, to: 80, dur: 0.2, vol: 0.1 });
        break;
      case 'shield':
        bell(c, d, 76, t, { vol: 0.15, decay: 0.8 });
        break;
      case 'stomp':
        taiko(c, d, t, { vol: 0.5, pitch: 140 });
        blip(c, d, t, { type: 'sine', from: 600, to: 100, dur: 0.3, vol: 0.12 });
        break;
      case 'checkpoint': // farol de piedra encendido
        noiseSweep(c, d, t, { dur: 0.5, vol: 0.2, from: 300, to: 1800, q: 0.8 });
        bell(c, d, 69, t + 0.1, { vol: 0.15, decay: 2.5 });
        break;
      case 'whisper':
        noiseSweep(c, d, t, { dur: 1.1, vol: 0.12, from: 1800, to: 900, q: 6, attack: 0.3 });
        noiseSweep(c, d, t + 0.4, { dur: 0.8, vol: 0.08, from: 2500, to: 1400, q: 7, attack: 0.2 });
        break;
      case 'wind': // ráfaga de Kamaitachi o de Kurohime
        noiseSweep(c, d, t, { dur: 0.9, vol: 0.3, from: 400, to: 4000, q: 1.5, attack: 0.2 });
        break;
      case 'scare':
        taiko(c, d, t, { vol: 0.6, pitch: 50 });
        noiseSweep(c, d, t, { dur: 0.6, vol: 0.25, from: 6000, to: 800, q: 3 });
        break;
      case 'gaki':
        noiseSweep(c, d, t, { dur: 0.4, vol: 0.25, from: 150, to: 600, q: 1, type: 'lowpass' });
        break;
      case 'heartbeat':
        taiko(c, d, t, { vol: 0.35, pitch: 45 });
        taiko(c, d, t + 0.18, { vol: 0.25, pitch: 40 });
        break;
      case 'loseLife':
        [70, 67, 63, 62].forEach((n, i) => koto(c, d, n - 12, t + i * 0.15, { vol: 0.2, decay: 1 }));
        break;
      case 'bossHit': // el espejo se agrieta
        bell(c, d, 93, t, { vol: 0.2, decay: 0.8 });
        noiseSweep(c, d, t, { dur: 0.3, vol: 0.3, from: 6000, to: 2000, q: 4 });
        break;
      case 'bossRoar':
        noiseSweep(c, d, t, { dur: 1.4, vol: 0.35, from: 120, to: 900, q: 2, type: 'lowpass', attack: 0.3 });
        blip(c, d, t, { type: 'sawtooth', from: 70, to: 40, dur: 1.2, vol: 0.12 });
        break;
      case 'petal':
        blip(c, d, t, { type: 'sine', from: 1200, to: 600, dur: 0.12, vol: 0.05 });
        break;
      case 'teleport':
        noiseSweep(c, d, t, { dur: 0.8, vol: 0.25, from: 3000, to: 200, q: 3 });
        break;
      case 'deny':
        blip(c, d, t, { type: 'square', from: 180, to: 140, dur: 0.15, vol: 0.08 });
        break;
      case 'select':
        koto(c, d, 74, t, { vol: 0.14, decay: 0.5 });
        break;
      default:
        break;
    }
  }
}

/** Instancia única compartida por todas las escenas. */
export const AudioManager = new AudioManagerClass();
