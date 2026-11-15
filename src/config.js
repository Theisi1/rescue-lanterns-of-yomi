/**
 * Constantes globales del juego.
 * Centralizar los "números mágicos" aquí facilita balancear el juego sin tocar la lógica.
 */
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;
export const TILE = 32;

export const FONTS = {
  title: '"Shippori Mincho", Georgia, serif',
  ui: '"DotGothic16", monospace'
};

export const COLORS = {
  flame: 0xffc94d,
  flameText: '#ffd76a',
  text: '#f5efe6',
  red: 0xc0182c,
  redText: '#ff5a6a',
  yomi: 0x7a1450,
  panel: 0x0d0812,
  spirit: 0xb07cff
};

/** Física del jugador (Arcade Physics). */
export const PLAYER = {
  speed: 200,
  accel: 1600,
  drag: 1800,
  jumpVelocity: -520,
  jumpCutFactor: 0.45,   // al soltar el salto antes de tiempo se recorta la velocidad
  coyoteTime: 90,        // ms en los que aún se puede saltar tras dejar una plataforma
  jumpBuffer: 110,       // ms en los que se recuerda una pulsación de salto anticipada
  invulnerableTime: 1200,
  knockbackX: 220,
  knockbackY: -260
};

export const GRAVITY = 1100;

/** La llama: vida + luz + ataque + visión. */
export const FLAME = {
  max: 100,
  flashCost: 15,
  flashCooldown: 550,
  yomiDrainPerSec: 12,
  respawnValue: 100,
  checkpointBonus: 20,
  oilValue: 30,
  killReward: 10,        // llama que devuelve disolver a un espíritu
  bossHitReward: 12,     // llama que devuelve golpear a Kurohime
  bossMirrorReward: 20,  // ... y si el golpe fue con el espejo expuesto
  lowThreshold: 25,
  lightMin: 70,
  lightPerFlame: 1.3
};

export const LIVES = 3;

export const SCORE = {
  rescue: 100,
  omamori: 10,
  stomp: 50,
  hitodama: 50,
  bossHit: 200,
  bossDefeat: 1000,
  flameBonusFactor: 2
};

export const POWERUPS = {
  incense: { duration: 10000, label: 'Incienso' },
  feather: { duration: 15000, label: 'Pluma de tengu' },
  washi: { duration: 0, label: 'Parche de washi' }
};

/** Claves de localStorage (requisito 4.6). */
export const STORAGE_KEYS = {
  highScore: 'rescue_highscore',
  level: 'rescue_level',
  audio: 'rescue_audio'
};

/** Niveles 1-3 usan GameScene; el 4 es la Puerta de Yomi (BossScene). */
export const LEVEL_COUNT = 3;
export const BOSS_LEVEL = 4;
