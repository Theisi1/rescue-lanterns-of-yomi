import { FLAME, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config.js';
import { EventBus, EVENTS } from './EventBus.js';
import { AudioManager } from './AudioManager.js';

/**
 * Visión de Yomi (mantener presionado): muestra el mundo de los muertos.
 *  - Activa el collider de las plataformas espirituales.
 *  - Revela objetos "solo Yomi" (pistas, torii verdadero).
 *  - Tiñe la pantalla de rojo/violeta y distorsiona la música.
 *  - Consume llama poco a poco mientras está activa.
 */
export default class YomiVisionManager {
  constructor(scene, flame, { spirits, collider, drainPerSec = FLAME.yomiDrainPerSec } = {}) {
    this.scene = scene;
    this.flame = flame;
    this.spirits = spirits;
    this.collider = collider;
    this.drainPerSec = drainPerSec;
    this.active = false;
    this.revealables = [];

    if (this.collider) this.collider.active = false;

    // Filtro de color sobre toda la escena (por encima de la oscuridad).
    this.overlay = scene.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.yomi, 1)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(55)
      .setBlendMode('ADD')
      .setAlpha(0);

    this.applyVisuals(false, true);
  }

  /** Objetos que solo se ven con la Visión de Yomi. */
  addRevealable(gameObject) {
    this.revealables.push(gameObject);
    gameObject.setAlpha(this.active ? 1 : 0);
  }

  update(wantsActive, delta) {
    const shouldBeActive = wantsActive && this.flame.value > 1;
    if (shouldBeActive !== this.active) this.setActive(shouldBeActive);
    if (this.active) this.flame.drain(this.drainPerSec, delta);
  }

  setActive(active) {
    this.active = active;
    if (this.collider) this.collider.active = active;
    this.applyVisuals(active);
    AudioManager.setYomi(active);
    EventBus.emit(EVENTS.YOMI, active);
  }

  applyVisuals(active, instant = false) {
    const duration = instant ? 0 : 160;
    const tweens = this.scene.tweens;
    tweens.add({ targets: this.overlay, alpha: active ? 0.32 : 0, duration });
    // Las plataformas espirituales quedan como un leve "brillo" cuando no hay visión.
    if (this.spirits) {
      this.spirits.getChildren().forEach((p) => tweens.add({ targets: p, alpha: active ? 1 : 0.12, duration }));
    }
    this.revealables.forEach((o) => {
      if (o.active) tweens.add({ targets: o, alpha: active ? 1 : 0, duration });
    });
  }

  /** Apaga la visión de inmediato (al morir, al pausar, al terminar un nivel). */
  forceOff() {
    if (this.active) this.setActive(false);
  }
}
