import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, FONTS } from '../config.js';
import TextureFactory from '../assets/TextureFactory.js';
import level1Url from '../assets/levels/level1.json?url';
import level2Url from '../assets/levels/level2.json?url';
import level3Url from '../assets/levels/level3.json?url';

/**
 * Loader de assets (requisito 4.1) con barra de progreso.
 * Carga los niveles (JSON) con el Loader de Phaser y genera las texturas procedurales.
 */
export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    this.add.text(cx, cy - 50, 'Encendiendo los faroles...', {
      fontFamily: FONTS.ui, fontSize: '20px', color: '#ffe9a8'
    }).setOrigin(0.5);
    this.add.rectangle(cx, cy, 404, 22).setStrokeStyle(2, 0xffd76a);
    const bar = this.add.rectangle(cx - 200, cy, 0, 16, 0xffc94d).setOrigin(0, 0.5);
    const pct = this.add.text(cx, cy + 34, '0 %', { fontFamily: FONTS.ui, fontSize: '14px', color: '#f5efe6' }).setOrigin(0.5);

    this.load.on('progress', (v) => {
      bar.width = 400 * v;
      pct.setText(`${Math.round(v * 100)} %`);
    });

    this.load.json('level1', level1Url);
    this.load.json('level2', level2Url);
    this.load.json('level3', level3Url);
  }

  create() {
    new TextureFactory(this).generateAll();
    this.createAnimations();
    this.scene.start('MenuScene');
  }

  createAnimations() {
    const anims = this.anims;
    anims.create({ key: 'akari-run', frames: [{ key: 'akari_run1' }, { key: 'akari_idle' }, { key: 'akari_run2' }, { key: 'akari_idle' }], frameRate: 12, repeat: -1 });
    anims.create({ key: 'yurei-float', frames: [{ key: 'yurei_0' }, { key: 'yurei_1' }], frameRate: 3, repeat: -1 });
    anims.create({ key: 'kamaitachi-fly', frames: [{ key: 'kamaitachi_0' }, { key: 'kamaitachi_1' }], frameRate: 14, repeat: -1 });
  }
}
