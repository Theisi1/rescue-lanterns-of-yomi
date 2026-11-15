import Enemy from './Enemy.js';
import { AudioManager } from '../managers/AudioManager.js';

/**
 * Gaki: mano hambrienta escondida bajo el suelo.
 * Una TriggerZone la activa cuando Akari pisa la zona: el suelo tiembla,
 * la mano brota, sujeta el aire un momento y vuelve a hundirse.
 */
export default class Gaki extends Enemy {
  constructor(scene, x, groundY) {
    super(scene, x, groundY + 6, 'gaki', { damage: 20, scoreValue: 0 });
    this.setOrigin(0.5, 0).setDepth(5); // detrás del suelo (depth 10): queda oculta
    this.body.setSize(16, 48).setOffset(4, 4);
    this.groundY = groundY;
    this.hiddenY = groundY + 6;
    this.harmful = false;
    this.busy = false;
  }

  /** Llamado por la TriggerZone asociada. */
  trigger() {
    if (this.busy || this.dead) return;
    this.busy = true;
    AudioManager.sfx('gaki');
    // Aviso: polvo y temblor antes de salir.
    this.scene.dust?.emitParticleAt(this.x, this.groundY, 8);
    this.scene.tweens.add({ targets: this, x: this.x + 2, yoyo: true, repeat: 5, duration: 40 });
    this.scene.time.delayedCall(420, () => this.rise());
  }

  rise() {
    if (this.dead) return;
    this.harmful = true;
    this.scene.tweens.add({
      targets: this,
      y: this.groundY - 50,
      duration: 140,
      ease: 'Back.Out',
      onComplete: () => this.scene.time.delayedCall(650, () => this.retract())
    });
  }

  retract() {
    if (this.dead || !this.scene) return;
    this.scene.tweens.add({
      targets: this,
      y: this.hiddenY,
      duration: 360,
      ease: 'Quad.In',
      onComplete: () => {
        this.harmful = false;
        this.scene?.time.delayedCall(1800, () => { this.busy = false; });
      }
    });
  }

  /** El destello la hace retroceder de inmediato. */
  onFlash() {
    if (this.harmful) {
      this.scene.tweens.killTweensOf(this);
      this.retract();
    }
  }
}
