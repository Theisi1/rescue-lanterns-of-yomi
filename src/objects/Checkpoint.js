import Phaser from 'phaser';

/**
 * Tōrō (farol de piedra): checkpoint.
 * Akari lo enciende al pasar: guarda el punto de reaparición y recarga un poco de llama.
 */
export default class Checkpoint extends Phaser.Physics.Arcade.Image {
  constructor(scene, x, y) {
    super(scene, x, y, 'toro_off');
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setOrigin(0.5, 1).setDepth(12);
    this.body.updateFromGameObject(); // reubica el cuerpo estático tras cambiar el origen
    this.lit = false;
  }

  /** Devuelve true solo la primera vez que se enciende. */
  light() {
    if (this.lit) return false;
    this.lit = true;
    this.setTexture('toro_on');
    this.scene.tweens.add({ targets: this, scale: 1.12, yoyo: true, duration: 120 });
    return true;
  }
}
