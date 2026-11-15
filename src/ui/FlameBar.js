import { FONTS, FLAME } from '../config.js';

/**
 * Barra de llama del HUD. Cambia de color cuando la llama está baja
 * y parpadea suavemente para parecer fuego.
 */
export default class FlameBar {
  constructor(scene, x, y, width = 180, height = 14) {
    this.scene = scene;
    this.width = width;
    this.value = FLAME.max;
    scene.add.text(x, y - 1, 'LLAMA', { fontFamily: FONTS.ui, fontSize: '13px', color: '#ffd76a' }).setOrigin(0, 0.5);
    const bx = x + 52;
    this.frame = scene.add.rectangle(bx, y, width + 4, height + 4, 0x000000, 0.8).setOrigin(0, 0.5).setStrokeStyle(2, 0xffd76a, 0.9);
    this.fill = scene.add.rectangle(bx + 2, y, width, height, 0xffc94d).setOrigin(0, 0.5);
    this.shine = scene.add.rectangle(bx + 2, y - height / 2 + 2, width, 3, 0xffffff, 0.35).setOrigin(0, 0.5);
    this.label = scene.add.text(bx + width + 10, y - 1, '100', { fontFamily: FONTS.ui, fontSize: '13px', color: '#ffffff' }).setOrigin(0, 0.5);
  }

  set(value, max) {
    this.value = value;
    const ratio = Math.max(0, value / max);
    this.fill.width = this.width * ratio;
    this.shine.width = this.width * ratio;
    this.label.setText(Math.ceil(value).toString());
    const color = ratio < 0.25 ? 0xff3b3b : ratio < 0.5 ? 0xff9a2a : 0xffc94d;
    this.fill.setFillStyle(color);
  }

  update(time) {
    const low = this.value < FLAME.lowThreshold;
    this.fill.setAlpha(low ? 0.6 + Math.abs(Math.sin(time / 120)) * 0.4 : 0.9 + Math.sin(time / 90) * 0.1);
  }
}
