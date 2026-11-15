import Enemy from './Enemy.js';
import { AudioManager } from '../managers/AudioManager.js';

/**
 * Rokurokubi: cabeza de cuello largo que cae del techo cuando Akari pasa debajo.
 * El cuello es un rectángulo que se estira según la posición de la cabeza
 * (más barato que redibujar un Graphics cada frame).
 */
export default class Rokurokubi extends Enemy {
  constructor(scene, x, ceilingY, floorY) {
    super(scene, x, ceilingY - 6, 'rokuro', { damage: 20, scoreValue: 0 });
    this.setDepth(6);
    this.body.setSize(20, 20).setOffset(4, 6);
    this.ceilingY = ceilingY;
    this.restY = ceilingY - 6;
    this.dropY = floorY - 22;
    this.harmful = false;
    this.mode = 'idle';
    this.neck = scene.add.rectangle(x, ceilingY - 12, 5, 0, 0xe9dcc4).setOrigin(0.5, 0).setDepth(5);
  }

  update() {
    if (this.dead) return;
    this.neck.height = Math.max(0, this.y - this.ceilingY + 2);
    this.neck.setSize(5, this.neck.height);
    if (this.mode !== 'idle') return;

    const player = this.scene.player;
    if (!player.isDead && Math.abs(player.x - this.x) < 60 && player.y > this.ceilingY) {
      this.mode = 'warning';
      AudioManager.sfx('whisper');
      // Se asoma y tiembla antes de caer: el jugador tiene tiempo de reaccionar.
      this.scene.tweens.add({ targets: this, y: this.restY + 14, duration: 150 });
      this.scene.tweens.add({
        targets: this,
        angle: { from: -12, to: 12 },
        yoyo: true,
        repeat: 2,
        duration: 70,
        onComplete: () => this.drop()
      });
    }
  }

  drop() {
    if (this.dead) return;
    this.mode = 'drop';
    this.harmful = true;
    this.angle = 0;
    this.scene.tweens.add({
      targets: this,
      y: this.dropY,
      duration: 230,
      ease: 'Quad.In',
      onComplete: () => {
        this.scene.cameras.main.shake(120, 0.004);
        this.scene.time.delayedCall(600, () => this.retract());
      }
    });
  }

  retract() {
    if (this.dead || !this.scene) return;
    this.scene.tweens.add({
      targets: this,
      y: this.restY,
      duration: 900,
      ease: 'Sine.InOut',
      onComplete: () => {
        this.harmful = false;
        this.scene?.time.delayedCall(1200, () => { this.mode = 'idle'; });
      }
    });
  }

  /** El destello la obliga a retirarse. */
  onFlash() {
    if (this.mode === 'drop') {
      this.scene.tweens.killTweensOf(this);
      this.retract();
    }
  }

  destroy(fromScene) {
    this.neck?.destroy();
    super.destroy(fromScene);
  }
}
