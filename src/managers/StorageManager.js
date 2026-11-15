import { STORAGE_KEYS } from '../config.js';

/**
 * Persistencia con localStorage (requisito 4.6).
 * Todas las lecturas/escrituras van en try/catch: en modo privado o con el
 * almacenamiento bloqueado el juego debe seguir funcionando sin guardar.
 */
function read(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* almacenamiento no disponible: se ignora */
  }
}

export const StorageManager = {
  getHighScore() {
    return Number(read(STORAGE_KEYS.highScore, 0)) || 0;
  },

  /** Guarda el puntaje solo si supera el récord. Devuelve true si es nuevo récord. */
  submitScore(score) {
    if (score > this.getHighScore()) {
      write(STORAGE_KEYS.highScore, score);
      return true;
    }
    return false;
  },

  getLevel() {
    return Number(read(STORAGE_KEYS.level, 1)) || 1;
  },

  /** Guarda el nivel más alto desbloqueado (nunca retrocede). */
  unlockLevel(level) {
    if (level > this.getLevel()) write(STORAGE_KEYS.level, level);
  },

  getAudio() {
    return read(STORAGE_KEYS.audio, { muted: false });
  },

  setAudio(settings) {
    write(STORAGE_KEYS.audio, settings);
  }
};
