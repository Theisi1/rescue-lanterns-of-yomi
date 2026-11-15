import { LIVES, BOSS_LEVEL } from '../config.js';
import { StorageManager } from './StorageManager.js';
import { EventBus, EVENTS } from './EventBus.js';

/** Estados globales del juego (requisito 4.1: sistema de estados). */
export const STATES = {
  BOOT: 'BOOT',
  MENU: 'MENU',
  STORY: 'STORY',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
  VICTORY: 'VICTORY'
};

/**
 * Estado de la partida en curso: puntaje, mechas (vidas) y nivel.
 * Es un módulo único para que todas las escenas compartan la misma sesión.
 */
export const GameState = {
  status: STATES.BOOT,
  score: 0,
  lives: LIVES,
  level: 1,
  levelStartScore: 0,

  setStatus(status) {
    this.status = status;
  },

  /** Nueva partida desde un nivel (1 = inicio, >1 = "Continuar"). */
  newGame(level = 1) {
    this.score = 0;
    this.lives = LIVES;
    this.level = level;
    this.levelStartScore = 0;
  },

  /** Al empezar un nivel se recuerda el puntaje para poder reiniciarlo. */
  startLevel() {
    this.levelStartScore = this.score;
  },

  /** Reinicio del nivel actual (desde Pausa): se restaura puntaje y mechas. */
  restartLevel() {
    this.score = this.levelStartScore;
    this.lives = LIVES;
  },

  addScore(points) {
    this.score += points;
    EventBus.emit(EVENTS.SCORE, this.score);
  },

  loseLife() {
    this.lives = Math.max(0, this.lives - 1);
    EventBus.emit(EVENTS.LIVES, this.lives);
    return this.lives;
  },

  gainLife() {
    this.lives = Math.min(5, this.lives + 1);
    EventBus.emit(EVENTS.LIVES, this.lives);
  },

  /** Pasa al siguiente nivel y guarda el progreso. */
  completeLevel() {
    this.level = Math.min(this.level + 1, BOSS_LEVEL);
    StorageManager.unlockLevel(this.level);
    StorageManager.submitScore(this.score);
  }
};
