import { FONTS } from '../config.js';
import { AudioManager } from '../managers/AudioManager.js';

/**
 * Lista de botones vertical reutilizable (menú principal, pausa, game over...).
 * Accesible: se navega con ratón/táctil o con teclado (↑ ↓ / W S + Enter / Espacio).
 *
 * items: [{ label: string | () => string, onSelect: () => void }]
 */
export default class MenuList {
  constructor(scene, x, y, items, { spacing = 54, width = 300, fontSize = 22, depth = 100 } = {}) {
    this.scene = scene;
    this.index = 0;
    this.enabled = true;

    this.items = items.map((item, i) => {
      const iy = y + i * spacing;
      const bg = scene.add
        .rectangle(x, iy, width, 42, 0x0d0812, 0.75)
        .setStrokeStyle(2, 0xffd76a, 0.25)
        .setDepth(depth)
        .setInteractive({ useHandCursor: true });
      const text = scene.add
        .text(x, iy, '', { fontFamily: FONTS.ui, fontSize: `${fontSize}px`, color: '#f5efe6' })
        .setOrigin(0.5)
        .setDepth(depth + 1);
      const marker = scene.add.image(x - width / 2 + 22, iy, 'pu_wick').setDepth(depth + 1).setVisible(false);
      bg.on('pointerover', () => this.select(i));
      bg.on('pointerdown', () => {
        this.select(i);
        this.activate();
      });
      return { ...item, bg, text, marker };
    });
    this.refresh();
    this.select(0, true);

    const kb = scene.input.keyboard;
    const move = (d) => this.enabled && this.select((this.index + d + this.items.length) % this.items.length);
    this.handlers = {
      'keydown-UP': () => move(-1),
      'keydown-W': () => move(-1),
      'keydown-DOWN': () => move(1),
      'keydown-S': () => move(1),
      'keydown-ENTER': () => this.enabled && this.activate(),
      'keydown-SPACE': () => this.enabled && this.activate()
    };
    Object.entries(this.handlers).forEach(([evt, fn]) => kb.on(evt, fn));
  }

  /** Actualiza los textos (p. ej. "Sonido: ON/OFF"). */
  refresh() {
    this.items.forEach((item) => {
      item.text.setText(typeof item.label === 'function' ? item.label() : item.label);
    });
  }

  select(i, silent = false) {
    if (i === this.index && !silent) return;
    this.index = i;
    this.items.forEach((item, j) => {
      const active = j === i;
      item.bg.setStrokeStyle(2, 0xffd76a, active ? 1 : 0.25);
      item.bg.setFillStyle(active ? 0x2a1220 : 0x0d0812, 0.8);
      item.text.setColor(active ? '#ffd76a' : '#f5efe6');
      item.marker.setVisible(active);
    });
    if (!silent) AudioManager.sfx('select');
  }

  activate() {
    const item = this.items[this.index];
    AudioManager.unlock();
    item.onSelect?.();
    this.refresh();
  }

  setVisible(visible) {
    this.enabled = visible;
    this.items.forEach((item) => {
      item.bg.setVisible(visible);
      item.text.setVisible(visible);
      item.marker.setVisible(visible && item === this.items[this.index]);
      if (visible) item.bg.setInteractive();
      else item.bg.disableInteractive();
    });
  }

  destroy() {
    const kb = this.scene.input.keyboard;
    Object.entries(this.handlers).forEach(([evt, fn]) => kb.off(evt, fn));
    this.items.forEach(({ bg, text, marker }) => { bg.destroy(); text.destroy(); marker.destroy(); });
  }
}
