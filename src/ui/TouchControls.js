import Phaser from 'phaser';
import { FONTS } from '../config.js';
import { TouchState } from '../managers/InputManager.js';
import { AudioManager } from '../managers/AudioManager.js';

/**
 * Controles táctiles en pantalla (requisito 4.7): equivalentes al teclado.
 *  izquierda: ◀ ▶      derecha: Saltar, Luz (destello), Yomi (mantener)
 * Cada botón escribe en TouchState mientras está presionado (multitouch).
 */
const BUTTONS = [
  { action: 'left', label: '◀', x: 74, y: 466, r: 44 },
  { action: 'right', label: '▶', x: 184, y: 466, r: 44 },
  { action: 'jump', label: 'Saltar', x: 880, y: 456, r: 50 },
  { action: 'flash', label: 'Luz', x: 770, y: 486, r: 38 },
  { action: 'yomi', label: 'Yomi', x: 790, y: 386, r: 38 }
];

export default class TouchControls {
  constructor(scene) {
    scene.input.addPointer(3);
    this.buttons = BUTTONS.map((b) => {
      const img = scene.add.image(b.x, b.y, 'btn_circle').setDisplaySize(b.r * 2, b.r * 2).setAlpha(0.6).setDepth(90);
      const text = scene.add.text(b.x, b.y, b.label, {
        fontFamily: FONTS.ui, fontSize: b.label.length > 1 ? '16px' : '26px', color: '#ffe9a8'
      }).setOrigin(0.5).setDepth(91);
      img.setInteractive(new Phaser.Geom.Circle(48, 48, 48), Phaser.Geom.Circle.Contains);
      const press = (down) => {
        TouchState[b.action] = down;
        img.setAlpha(down ? 0.95 : 0.6);
        if (down) AudioManager.unlock();
      };
      img.on('pointerdown', () => press(true));
      img.on('pointerup', () => press(false));
      img.on('pointerout', () => press(false));
      return { img, text };
    });
    scene.events.once('shutdown', () => TouchState.reset());
  }
}
