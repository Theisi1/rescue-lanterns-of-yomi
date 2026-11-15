import Phaser from 'phaser';

/**
 * Clase base de todos los espíritus enemigos.
 * Centraliza daño, parálisis por el destello y la animación de disolverse.
 */
export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, { damage = 20, scoreValue = 50, knockback = 1 } = {}) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);
    this.damage = damage;
    this.scoreValue = scoreValue;
    this.knockback = knockback;
    this.harmful = true;
    this.stunnedUntil = 0;
    this.dead = false;
    this.setDepth(15);
  }

  get isStunned() {
    return this.scene.time.now < this.stunnedUntil;
  }

  /** ¿Se le puede disolver saltándole encima? (solo Yūrei paralizados) */
  get canBeStomped() {
    return false;
  }

  /** Por defecto, el destello paraliza. Las subclases pueden cambiarlo. */
  onFlash() {
    this.stunnedUntil = this.scene.time.now + 2500;
  }

  dissolve() {
    if (this.dead) return;
    this.dead = true;
    this.harmful = false;
    this.body.enable = false;
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleY: 1.5,
      scaleX: 0.4,
      y: this.y - 18,
      duration: 420,
      onComplete: () => this.destroy()
    });
  }
}
