import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, FONTS } from '../config.js';
import MenuList from '../ui/MenuList.js';
import { AudioManager } from '../managers/AudioManager.js';
import { GameState } from '../managers/GameStateManager.js';

/**
 * Pausa (superpuesta): "Los espíritus también esperan..."
 * Continuar / Reiniciar nivel / Sonido / Menú principal.
 */
export default class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
  }

  create(data) {
    this.from = data.from;
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x07040b, 0.78).setOrigin(0);
    this.add.text(GAME_WIDTH / 2, 120, 'Pausa', {
      fontFamily: FONTS.title, fontSize: '48px', color: '#ffe9a8', stroke: '#000', strokeThickness: 6
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 170, 'Los espíritus también esperan...', {
      fontFamily: FONTS.ui, fontSize: '18px', color: '#ff9aa8'
    }).setOrigin(0.5);

    this.menu = new MenuList(this, GAME_WIDTH / 2, 240, [
      { label: 'Continuar', onSelect: () => this.resumeGame() },
      { label: 'Reiniciar nivel', onSelect: () => this.restartLevel() },
      { label: () => `Sonido: ${AudioManager.muted ? 'OFF' : 'ON'}`, onSelect: () => AudioManager.toggleMute() },
      { label: 'Menú principal', onSelect: () => this.toMenu() }
    ]);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, 'P / Esc para continuar', {
      fontFamily: FONTS.ui, fontSize: '14px', color: '#bdb3c7'
    }).setOrigin(0.5);

    const kb = this.input.keyboard;
    kb.on('keydown-P', () => this.resumeGame());
    kb.on('keydown-ESC', () => this.resumeGame());
    kb.on('keydown-M', () => { AudioManager.toggleMute(); this.menu.refresh(); });
  }

  resumeGame() {
    this.scene.resume(this.from);
    this.scene.resume('UIScene');
    this.scene.stop();
  }

  restartLevel() {
    GameState.restartLevel();
    this.scene.stop('UIScene');
    this.scene.stop(this.from);
    this.scene.start(this.from);
  }

  toMenu() {
    this.scene.stop('UIScene');
    this.scene.stop(this.from);
    this.scene.start('MenuScene');
  }
}
