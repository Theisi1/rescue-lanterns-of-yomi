import Phaser from 'phaser';
import Enemy from './Enemy.js';

/**
 * Yūrei: fantasma de kimono blanco que flota de lado a lado.
 *
 * IA básica (bonus): cuando la llama de Akari está baja, lo persigue;
 * si Akari lleva incienso, huye. Paralizado por el destello, se le puede pisar.
 */
export default class Yurei extends Enemy {
  constructor(scene, x, y, { range = 96, speed = 45 } = {}) {
    super(scene, x, y, 'yurei_0', { damage: 20, scoreValue: 50 });
    this.body.setSize(20, 34).setOffset(4, 4);
    this.homeX = x;
    this.baseY = y;
    this.range = range;
    this.speed = speed;
    this.dir = Phaser.Math.RND.pick([-1, 1]);
    this.phase = Math.random() * Math.PI * 2;
    this.play('yurei-float');
  }

  get canBeStomped() {
    return this.isStunned;
  }

  update(time) {
    if (this.dead) return;
    const player = this.scene.player;

    if (this.isStunned) {
      this.setVelocityX(0);
      this.setTint(0x8fb4ff);
      this.anims.pause();
      return;
    }
    this.clearTint();
    this.anims.resume();

    let vx = this.dir * this.speed;
    const dx = player.x - this.x;
    const close = Math.abs(dx) < 240 && Math.abs(player.y - this.y) < 120 && !player.isDead;
    if (close && player.hasIncense) {
      vx = -Math.sign(dx) * this.speed * 1.4; // huye del incienso
    } else if (close && this.scene.flame.ratio < 0.35) {
      vx = Math.sign(dx) * this.speed * 1.5; // la llama débil lo atrae
    } else {
      if (this.x > this.homeX + this.range) this.dir = -1;
      else if (this.x < this.homeX - this.range) this.dir = 1;
      vx = this.dir * this.speed;
    }
    // No se aleja demasiado de su zona.
    if (Math.abs(this.x - this.homeX) > this.range * 2.2) vx = Math.sign(this.homeX - this.x) * this.speed;

    this.setVelocityX(vx);
    this.setFlipX(vx < 0);
    this.y = this.baseY + Math.sin(time / 420 + this.phase) * 6;
    this.setAlpha(0.75 + Math.sin(time / 90 + this.phase) * 0.08);
  }
}
