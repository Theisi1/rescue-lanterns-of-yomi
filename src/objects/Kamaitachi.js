import Enemy from './Enemy.js';

/**
 * Kamaitachi: comadreja de viento que cruza la pantalla en ráfagas.
 * Si toca a Akari le roba llama y lo empuja con fuerza. El destello no la detiene.
 */
export default class Kamaitachi extends Enemy {
  constructor(scene, x, y, dir = -1) {
    super(scene, x, y, 'kamaitachi_0', { damage: 15, scoreValue: 0, knockback: 1.8 });
    this.body.setSize(34, 14).setOffset(3, 4);
    this.dir = dir;
    this.baseY = y;
    this.setFlipX(dir > 0);
    this.play('kamaitachi-fly');
  }

  onFlash() {
    /* el viento no se puede paralizar */
  }

  update(time) {
    if (this.dead) return;
    // La velocidad se fija cada frame: al añadirse al grupo, Phaser la reinicia a 0.
    this.setVelocityX(this.dir * 430);
    this.y = this.baseY + Math.sin(time / 90) * 10;
    const view = this.scene.cameras.main.worldView;
    if ((this.dir < 0 && this.x < view.left - 100) || (this.dir > 0 && this.x > view.right + 100)) {
      this.destroy();
    }
  }
}
