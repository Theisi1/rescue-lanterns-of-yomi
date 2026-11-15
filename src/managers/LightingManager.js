import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';

const LIGHT_TEXTURE_RADIUS = 128; // el degradado 'light' mide 256x256

/**
 * Oscuridad con círculos de luz.
 *
 * Una RenderTexture del tamaño de la pantalla se llena de negro cada frame y se le
 * "borran" (erase) los degradados de luz. Es mucho más barato que el pipeline de luces
 * de Phaser y mantiene el juego por encima de 45 FPS en móviles (requisito 4.8).
 */
export default class LightingManager {
  constructor(scene, { alpha = 0.86, color = 0x05020a } = {}) {
    this.scene = scene;
    this.alpha = alpha;
    this.color = color;
    this.flashLevel = 0;
    this.pool = [];

    this.rt = scene.add
      .renderTexture(0, 0, GAME_WIDTH, GAME_HEIGHT)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(50);

    // Viñeta fija para enmarcar la escena.
    this.vignette = scene.add.image(0, 0, 'vignette').setOrigin(0).setScrollFactor(0).setDepth(52).setAlpha(0.9);
  }

  /** El destello ilumina toda la pantalla un instante. */
  flash() {
    this.flashLevel = 1;
  }

  /**
   * @param {Array<{x:number,y:number,r:number,a?:number}>} lights posiciones en coordenadas de mundo
   */
  render(lights, delta) {
    this.flashLevel = Math.max(0, this.flashLevel - delta / 650);
    const darkness = this.alpha * (1 - this.flashLevel);
    const rt = this.rt;
    rt.clear();
    if (darkness <= 0.01) return;
    rt.fill(this.color, darkness);

    const cam = this.scene.cameras.main;
    const batch = [];
    for (let i = 0; i < lights.length; i++) {
      const l = lights[i];
      const sx = l.x - cam.scrollX;
      const sy = l.y - cam.scrollY;
      if (sx < -l.r || sx > GAME_WIDTH + l.r || sy < -l.r || sy > GAME_HEIGHT + l.r) continue;
      const img = this.getImage(batch.length);
      img.setPosition(sx, sy);
      img.setScale(l.r / LIGHT_TEXTURE_RADIUS);
      img.setAlpha(l.a ?? 1);
      batch.push(img);
    }
    if (batch.length) rt.erase(batch);
  }

  getImage(index) {
    if (!this.pool[index]) {
      this.pool[index] = this.scene.make.image({ key: 'light', add: false }).setOrigin(0.5);
    }
    return this.pool[index];
  }
}
