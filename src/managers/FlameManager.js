import Phaser from 'phaser';
import { FLAME } from '../config.js';
import { EventBus, EVENTS } from './EventBus.js';
import { AudioManager } from './AudioManager.js';

/**
 * La llama de Akari: es a la vez su vida, su luz y su arma.
 * Este manager solo lleva la cuenta del recurso; las escenas deciden qué pasa cuando se agota.
 */
export default class FlameManager {
  constructor(scene, initial = FLAME.max) {
    this.scene = scene;
    this.value = initial;
    this.heartbeatTimer = 0;
    this.emit();
  }

  get ratio() {
    return this.value / FLAME.max;
  }

  get isEmpty() {
    return this.value <= 0;
  }

  /** Radio del círculo de luz alrededor de Akari: más llama, más visión. */
  get lightRadius() {
    return FLAME.lightMin + this.value * FLAME.lightPerFlame;
  }

  set(value) {
    this.value = Phaser.Math.Clamp(value, 0, FLAME.max);
    this.emit();
  }

  add(amount) {
    this.set(this.value + amount);
  }

  /** Gasto voluntario (destello): solo se permite si queda llama después de gastar. */
  spend(amount) {
    if (this.value <= amount) return false;
    this.set(this.value - amount);
    return true;
  }

  /** Daño recibido. Devuelve true si la llama se apagó. */
  damage(amount) {
    this.set(this.value - amount);
    return this.isEmpty;
  }

  /** Consumo continuo (Visión de Yomi, viento de Kurohime). */
  drain(perSecond, delta) {
    this.set(this.value - (perSecond * delta) / 1000);
  }

  /** Latido cuando la llama está baja: aviso sonoro de peligro. */
  update(delta) {
    if (this.value > 0 && this.value < FLAME.lowThreshold) {
      this.heartbeatTimer -= delta;
      if (this.heartbeatTimer <= 0) {
        AudioManager.sfx('heartbeat');
        this.heartbeatTimer = 600 + this.value * 30;
      }
    }
  }

  emit() {
    EventBus.emit(EVENTS.FLAME, this.value, FLAME.max);
  }
}
