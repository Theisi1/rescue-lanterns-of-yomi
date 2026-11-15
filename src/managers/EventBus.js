import Phaser from 'phaser';

/**
 * Bus de eventos compartido entre escenas.
 * Las escenas de juego emiten cambios (llama, puntaje, vidas...) y la UIScene los escucha,
 * así el HUD no depende directamente de la lógica del juego.
 */
export const EventBus = new Phaser.Events.EventEmitter();

export const EVENTS = {
  FLAME: 'flame-changed',
  LIVES: 'lives-changed',
  SCORE: 'score-changed',
  RESCUED: 'rescued-changed',
  LEVEL: 'level-changed',
  POWERUP: 'powerup-changed',
  HINT: 'hint',
  TOAST: 'toast',
  BOSS_HP: 'boss-hp',
  YOMI: 'yomi-changed',
  MUTE: 'mute-changed',
  PAUSE_REQUEST: 'pause-request',
  UI_READY: 'ui-ready',
  BANNER: 'banner'
};
