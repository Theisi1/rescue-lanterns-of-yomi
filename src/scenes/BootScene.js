import Phaser from 'phaser';
import { GameState, STATES } from '../managers/GameStateManager.js';

/**
 * Primera escena: configura lo mínimo y pasa al Preload.
 */
export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    GameState.setStatus(STATES.BOOT);
    this.registry.set('showFps', false);
    this.scene.start('PreloadScene');
  }
}
