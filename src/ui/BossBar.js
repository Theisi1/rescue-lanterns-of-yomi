import { FONTS, GAME_WIDTH } from '../config.js';

/** Barra de vida de Kurohime (arriba, bajo el HUD, para no tapar el suelo de la arena). */
export default class BossBar {
  constructor(scene, y) {
    const width = 420;
    const x = GAME_WIDTH / 2 - width / 2;
    this.width = width;
    this.container = scene.add.container(0, 0).setVisible(false);
    const title = scene.add.text(GAME_WIDTH / 2, y - 18, 'KUROHIME, LA NOVIA DE YOMI', {
      fontFamily: FONTS.title, fontSize: '16px', color: '#ff5a6a', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5);
    const frame = scene.add.rectangle(x - 2, y, width + 4, 14, 0x000000, 0.85).setOrigin(0, 0.5).setStrokeStyle(2, 0xff5a6a);
    this.fill = scene.add.rectangle(x, y, width, 10, 0xc0182c).setOrigin(0, 0.5);
    this.container.add([title, frame, this.fill]);
  }

  set(hp, max) {
    if (!max) {
      this.container.setVisible(false);
      return;
    }
    this.container.setVisible(true);
    this.fill.width = this.width * Math.max(0, hp / max);
  }
}
