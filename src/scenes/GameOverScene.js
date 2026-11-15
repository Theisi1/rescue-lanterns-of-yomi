import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, FONTS, BOSS_LEVEL } from '../config.js';
import MenuList from '../ui/MenuList.js';
import { AudioManager } from '../managers/AudioManager.js';
import { StorageManager } from '../managers/StorageManager.js';
import { GameState, STATES } from '../managers/GameStateManager.js';

/**
 * Game Over: la llama de Akari se apaga y manos brotan desde los bordes.
 * "La última luz se apagó en el lugar equivocado..."
 */
export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create() {
    GameState.setStatus(STATES.GAME_OVER);
    AudioManager.playMusic('gameover');
    const cx = GAME_WIDTH / 2;
    this.cameras.main.setBackgroundColor('#050208');

    const glow = this.add.image(cx, 200, 'light').setScale(1.2).setTint(0xffb040).setAlpha(0.6).setBlendMode('ADD');
    const lantern = this.add.image(cx, 230, 'akari_hurt').setScale(3);
    this.tweens.add({ targets: glow, scale: 0, alpha: 0, duration: 2600, ease: 'Quad.In' });
    this.tweens.add({ targets: lantern, alpha: 0.35, duration: 2600, onComplete: () => lantern.setTexture('lantern_off') });

    // Manos desde los bordes.
    for (let i = 0; i < 10; i++) {
      const left = i % 2 === 0;
      const y = 40 + i * 50;
      const hand = this.add.image(left ? -40 : GAME_WIDTH + 40, y, 'gaki').setAngle(left ? 90 : -90).setAlpha(0.8).setScale(1.4);
      this.tweens.add({ targets: hand, x: left ? 40 + Math.random() * 40 : GAME_WIDTH - 40 - Math.random() * 40, duration: 1800, delay: 300 + i * 120, ease: 'Sine.Out' });
    }

    this.add.text(cx, 330, 'La última luz se apagó en el lugar equivocado...', {
      fontFamily: FONTS.title, fontSize: '26px', color: '#ff5a6a', stroke: '#000', strokeThickness: 6
    }).setOrigin(0.5);

    const best = StorageManager.getHighScore();
    const isRecord = GameState.score > 0 && GameState.score >= best;
    this.add.text(cx, 372, `Puntos: ${GameState.score}   ·   Récord: ${best}${isRecord ? '  ¡Nuevo récord!' : ''}`, {
      fontFamily: FONTS.ui, fontSize: '18px', color: '#ffd76a'
    }).setOrigin(0.5);

    const level = GameState.level;
    new MenuList(this, cx, 430, [
      { label: 'Reintentar', onSelect: () => this.retry(level) },
      { label: 'Menú principal', onSelect: () => this.scene.start('MenuScene') }
    ], { spacing: 50 });
  }

  retry(level) {
    GameState.newGame(level);
    this.scene.start(level >= BOSS_LEVEL ? 'BossScene' : 'GameScene');
  }
}
