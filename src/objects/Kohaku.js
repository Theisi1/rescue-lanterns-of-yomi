import Phaser from 'phaser';

/**
 * Kohaku: espíritu zorro que da consejos junto a los faroles.
 * Al acercarse Akari muestra su pista en el HUD (no bloquea el juego).
 */
export default class Kohaku extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, hint) {
    super(scene, x, y, 'kohaku');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);
    this.setOrigin(0.5, 1).setDepth(11).setAlpha(0.85);
    // Zona de "conversación" más grande que el sprite (28x24), centrada y hacia arriba.
    this.body.setSize(120, 90, false).setOffset(14 - 60, 24 - 90);
    this.hint = hint;
    this.lastShown = -Infinity;
    scene.tweens.add({ targets: this, y: y - 4, yoyo: true, repeat: -1, duration: 1100, ease: 'Sine.InOut' });
  }

  /** Devuelve el texto si toca mostrarlo (con espera para no repetirlo en bucle). */
  speak(time) {
    if (time - this.lastShown < 12000) return null;
    this.lastShown = time;
    this.setFlipX(this.scene.player.x < this.x);
    return this.hint;
  }
}
