import Phaser from 'phaser';

/**
 * Estado de los botones táctiles. Lo escriben los botones de TouchControls (UIScene)
 * y lo lee InputManager, de modo que teclado y pantalla táctil son equivalentes (4.7).
 */
export const TouchState = {
  left: false,
  right: false,
  jump: false,
  flash: false,
  yomi: false,
  reset() {
    this.left = this.right = this.jump = this.flash = this.yomi = false;
  }
};

/**
 * Unifica teclado y controles táctiles en acciones de juego.
 *  - Moverse: ← → / A D
 *  - Saltar: ↑ / W / Espacio
 *  - Destello: X / J
 *  - Visión de Yomi (mantener): C / K / Shift
 */
export default class InputManager {
  constructor(scene) {
    this.scene = scene;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = scene.input.keyboard.addKeys({
      left: K.LEFT, right: K.RIGHT, up: K.UP,
      a: K.A, d: K.D, w: K.W, space: K.SPACE,
      x: K.X, j: K.J,
      c: K.C, k: K.K, shift: K.SHIFT
    });
    this.prevJump = false;
    this.prevFlash = false;
    this.state = { left: false, right: false, jump: false, jumpPressed: false, flashPressed: false, yomi: false };
  }

  /** Se llama una vez por frame antes de actualizar al jugador. */
  update() {
    const k = this.keys;
    const jump = k.up.isDown || k.w.isDown || k.space.isDown || TouchState.jump;
    const flash = k.x.isDown || k.j.isDown || TouchState.flash;
    const s = this.state;
    s.left = k.left.isDown || k.a.isDown || TouchState.left;
    s.right = k.right.isDown || k.d.isDown || TouchState.right;
    s.jump = jump;
    s.jumpPressed = jump && !this.prevJump;
    s.flashPressed = flash && !this.prevFlash;
    s.yomi = k.c.isDown || k.k.isDown || k.shift.isDown || TouchState.yomi;
    this.prevJump = jump;
    this.prevFlash = flash;
    return s;
  }

  /** Evita teclas "pegadas" al volver de la pausa. */
  reset() {
    this.scene.input.keyboard.resetKeys();
    TouchState.reset();
    this.prevJump = this.prevFlash = true;
  }
}
