import Phaser from 'phaser';
import Enemy from './Enemy.js';

/**
 * Hitodama: fuego fantasma azul que vuela en onda y persigue la luz de Akari.
 * El destello lo deshace por completo.
 */
export default class Hitodama extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'hitodama', { damage: 15, scoreValue: 50 });
    this.body.setCircle(8, 2, 10);
    this.setBlendMode('ADD');
    this.home = new Phaser.Math.Vector2(x, y);
    this.phase = Math.random() * Math.PI * 2;
  }

  /** El destello lo extingue en lugar de solo paralizarlo. */
  onFlash() {
    this.scene.addScore(this.scoreValue, this.x, this.y);
    this.scene.onEnemyKilled(this);
    this.dissolve();
  }

  update(time) {
    if (this.dead) return;
    const player = this.scene.player;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y - 20);
    let tx = this.home.x + Math.cos(time / 900 + this.phase) * 40;
    let ty = this.home.y + Math.sin(time / 500 + this.phase) * 20;
    let speed = 55;
    if (dist < 300 && !player.isDead) {
      // Se siente atraído por la llama... salvo que haya incienso.
      const away = player.hasIncense ? -1 : 1;
      tx = this.x + (player.x - this.x) * away;
      ty = player.y - 24 + Math.sin(time / 180) * 26;
      speed = 75;
    }
    const angle = Phaser.Math.Angle.Between(this.x, this.y, tx, ty);
    const near = Phaser.Math.Distance.Between(this.x, this.y, tx, ty) < 6;
    this.setVelocity(near ? 0 : Math.cos(angle) * speed, near ? 0 : Math.sin(angle) * speed);
    this.setScale(1 + Math.sin(time / 70 + this.phase) * 0.08);
  }
}
