import Phaser from 'phaser';

/**
 * Zona invisible que dispara un evento al entrar Akari (requisito 4.4: triggers).
 * Se usa para las manos Gaki, las ráfagas de Kamaitachi, los sustos y el bucle de torii.
 *
 * Como `overlap` se llama cada frame mientras Akari está dentro, la zona tiene
 * un tiempo de enfriamiento (cooldown) y puede ser de un solo uso (once).
 */
export default class TriggerZone extends Phaser.GameObjects.Zone {
  constructor(scene, x, y, width, height, { onEnter, once = false, cooldown = 1000 } = {}) {
    super(scene, x, y, width, height);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.onEnter = onEnter;
    this.once = once;
    this.cooldown = cooldown;
    this.nextAllowed = 0;
    this.enabled = true;
  }

  fire(player) {
    const now = this.scene.time.now;
    if (!this.enabled || now < this.nextAllowed) return;
    this.nextAllowed = now + this.cooldown;
    if (this.once) this.enabled = false;
    this.onEnter?.(player, this);
  }
}
