import Phaser from 'phaser';

/**
 * Objetos recogibles: omamori (puntos), aceite (llama), mecha (vida)
 * y power-ups (incienso, parche de washi, pluma de tengu).
 * El efecto lo aplica la escena (BaseLevelScene.collectPowerUp) según `type`.
 */
export const PICKUP_TEXTURES = {
  omamori: 'omamori',
  oil: 'oil',
  wick: 'pu_wick',
  incense: 'pu_incense',
  washi: 'pu_washi',
  feather: 'pu_feather'
};

export default class PowerUp extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type) {
    super(scene, x, y, PICKUP_TEXTURES[type]);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);
    this.type = type;
    this.setDepth(13);
    scene.tweens.add({ targets: this, y: y - 5, yoyo: true, repeat: -1, duration: 900 + Math.random() * 300, ease: 'Sine.InOut' });
  }

  collect() {
    this.body.enable = false;
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({ targets: this, y: this.y - 20, alpha: 0, scale: 1.6, duration: 260, onComplete: () => this.destroy() });
  }
}
