import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, GRAVITY } from './config.js';
import { AudioManager } from './managers/AudioManager.js';
import { GameState } from './managers/GameStateManager.js';
import { TouchState } from './managers/InputManager.js';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import MenuScene from './scenes/MenuScene.js';
import IntroScene from './scenes/IntroScene.js';
import GameScene from './scenes/GameScene.js';
import BossScene from './scenes/BossScene.js';
import UIScene from './scenes/UIScene.js';
import PauseScene from './scenes/PauseScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import VictoryScene from './scenes/VictoryScene.js';

/**
 * Punto de entrada. Flujo de escenas:
 * Boot → Preload → Menu → Intro → Game (niveles 1-3) → Boss → GameOver / Victory,
 * con UIScene (HUD) y PauseScene superpuestas.
 */
const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#07040b',
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,               // se adapta a escritorio, tablet y móvil
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  input: { activePointers: 4 },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: GRAVITY }, debug: false }
  },
  fps: { target: 60 },
  scene: [BootScene, PreloadScene, MenuScene, IntroScene, GameScene, BossScene, UIScene, PauseScene, GameOverScene, VictoryScene]
};

// Los navegadores solo permiten audio tras un gesto del usuario.
['pointerdown', 'keydown', 'touchstart'].forEach((evt) =>
  window.addEventListener(evt, () => AudioManager.unlock(), { passive: true })
);

// Esperamos a las fuentes (máx. 1,5 s) para que los textos no aparezcan con la fuente por defecto.
const fontsReady = document.fonts
  ? Promise.race([
      Promise.all([document.fonts.load('20px "DotGothic16"'), document.fonts.load('700 20px "Shippori Mincho"')]),
      new Promise((resolve) => setTimeout(resolve, 1500))
    ]).catch(() => {})
  : Promise.resolve();

fontsReady.then(() => {
  const game = new Phaser.Game(config);
  // Solo en desarrollo: acceso desde la consola para depurar (no se incluye en el build).
  if (import.meta.env.DEV) window.__RESCUE__ = { game, GameState, TouchState };
});
