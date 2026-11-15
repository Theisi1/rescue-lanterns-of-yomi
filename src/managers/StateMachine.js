/**
 * Máquina de estados finita y reutilizable.
 * La usan Akari (idle/run/jump/fall/hurt/dead) y Kurohime (fases del jefe).
 *
 * Cada estado es un objeto con métodos opcionales: enter(data), update(time, delta), exit().
 * Dentro de esos métodos `this` es el dueño (owner) de la máquina.
 */
export default class StateMachine {
  constructor(owner, states, initial) {
    this.owner = owner;
    this.states = states;
    this.current = null;
    this.currentName = null;
    this.elapsed = 0;
    if (initial) this.set(initial);
  }

  set(name, data) {
    if (this.currentName === name) return;
    const next = this.states[name];
    if (!next) throw new Error(`Estado desconocido: ${name}`);
    this.current?.exit?.call(this.owner);
    this.previousName = this.currentName;
    this.currentName = name;
    this.current = next;
    this.elapsed = 0;
    next.enter?.call(this.owner, data);
  }

  is(name) {
    return this.currentName === name;
  }

  update(time, delta) {
    this.elapsed += delta;
    this.current?.update?.call(this.owner, time, delta);
  }
}
