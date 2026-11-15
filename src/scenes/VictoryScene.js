import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, FONTS } from '../config.js';
import MenuList from '../ui/MenuList.js';
import { AudioManager } from '../managers/AudioManager.js';
import { StorageManager } from '../managers/StorageManager.js';
import { GameState, STATES } from '../managers/GameStateManager.js';

/**
 * Victoria: la puerta se cierra y amanece.
 * Epílogo: el verano siguiente Tetsu enciende un farol nuevo... con un ojo pintado.
 */
export default class VictoryScene extends Phaser.Scene {
  constructor() {
    super('VictoryScene');
  }

  create() {
    GameState.setStatus(STATES.VICTORY);
    AudioManager.playMusic('dawn');
    const cx = GAME_WIDTH / 2;

    this.add.image(0, 0, 'sky_dawn').setOrigin(0);
    const sun = this.add.circle(cx, 460, 70, 0xfff1c0).setAlpha(0.9);
    this.tweens.add({ targets: sun, y: 330, duration: 6000, ease: 'Sine.Out' });
    this.add.image(0, 0, 'far_dawn').setOrigin(0);
    this.add.particles(0, 0, 'petal', {
      x: { min: 0, max: GAME_WIDTH }, y: -10, lifespan: 9000, speedY: { min: 20, max: 40 },
      speedX: { min: -10, max: 20 }, rotate: { start: 0, end: 360 }, frequency: 300
    });

    this.add.text(cx, 60, 'El Obon terminó', {
      fontFamily: FONTS.title, fontSize: '44px', color: '#2a0f1a', stroke: '#fff1d6', strokeThickness: 6
    }).setOrigin(0.5);
    this.add.text(cx, 118, 'Kurokiri despierta... y en el taller de Tetsu, un farol nuevo abre los ojos.', {
      fontFamily: FONTS.ui, fontSize: '17px', color: '#2a0f1a', stroke: '#fff1d6', strokeThickness: 4,
      wordWrap: { width: 760 }, align: 'center'
    }).setOrigin(0.5);

    // El farol nuevo: aparece apagado y "abre su ojo".
    const lantern = this.add.image(cx, 250, 'lantern_off').setScale(3);
    this.time.delayedCall(2500, () => {
      lantern.setTexture('akari_idle');
      AudioManager.sfx('rescue');
      this.tweens.add({ targets: lantern, scale: 3.3, yoyo: true, duration: 200 });
    });

    const isRecord = StorageManager.submitScore(GameState.score) || GameState.score >= StorageManager.getHighScore();
    this.add.text(cx, 345, `Puntaje final: ${GameState.score}${isRecord ? '  ¡Nuevo récord!' : ''}`, {
      fontFamily: FONTS.ui, fontSize: '22px', color: '#fff1d6', stroke: '#2a0f1a', strokeThickness: 5
    }).setOrigin(0.5);
    this.add.text(cx, 375, `Récord: ${StorageManager.getHighScore()}`, {
      fontFamily: FONTS.ui, fontSize: '16px', color: '#fff1d6', stroke: '#2a0f1a', strokeThickness: 4
    }).setOrigin(0.5);

    new MenuList(this, cx, 440, [{ label: 'Volver al menú', onSelect: () => this.scene.start('MenuScene') }]);
    this.cameras.main.fadeIn(1500, 255, 240, 220);
  }
}
