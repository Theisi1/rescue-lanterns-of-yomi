import Phaser from 'phaser';
import { FONTS } from '../config.js';

const THANKS = ['¡Gracias, Akari!', 'Estaba tan oscuro...', '¡Puedo ver otra vez!', 'Tu luz me trajo de vuelta', '¿El farol de Tetsu?'];

/**
 * Katashiro: habitante convertido en muñeco de papel.
 * Al tocarlo (overlap) recupera su forma humana y sube como una silueta.
 */
export default class Katashiro extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, { isTetsu = false } = {}) {
    super(scene, x, y, 'katashiro');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);
    this.setOrigin(0.5, 1).setDepth(14);
    this.isTetsu = isTetsu;
    this.rescued = false;
    // Tiembla como si el viento de Yomi tirara de él.
    scene.tweens.add({ targets: this, angle: { from: -6, to: 6 }, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.InOut' });
  }

  rescue() {
    if (this.rescued) return false;
    this.rescued = true;
    this.body.enable = false;
    const scene = this.scene;
    scene.tweens.killTweensOf(this);

    const villager = scene.add.image(this.x, this.y, this.isTetsu ? 'tetsu' : 'villager').setOrigin(0.5, 1).setDepth(14).setAlpha(0);
    scene.tweens.add({ targets: this, alpha: 0, scaleX: 0, duration: 250 });
    scene.tweens.add({ targets: villager, alpha: 1, duration: 300, yoyo: true, hold: 900, onComplete: () => villager.destroy() });
    scene.tweens.add({ targets: villager, y: villager.y - 30, duration: 1500 });

    const text = this.isTetsu ? 'Akari... ¿eres tú?' : Phaser.Math.RND.pick(THANKS);
    const label = scene.add
      .text(this.x, this.y - 54, text, { fontFamily: FONTS.ui, fontSize: '14px', color: '#ffffff', stroke: '#000000', strokeThickness: 4 })
      .setOrigin(0.5)
      .setDepth(60);
    scene.tweens.add({ targets: label, y: label.y - 24, alpha: 0, delay: 900, duration: 800, onComplete: () => label.destroy() });
    return true;
  }
}
