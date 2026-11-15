import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';

/**
 * Fondo en capas (parallax). Cada capa es un TileSprite fijo a la cámara cuyo
 * desplazamiento interno se mueve a distinta velocidad: lejos = más lento.
 */
export default class ParallaxBackground {
  constructor(scene, theme) {
    this.scene = scene;
    this.sky = scene.add.image(0, 0, `sky_${theme}`).setOrigin(0).setScrollFactor(0).setDepth(-30);
    this.layers = [
      { sprite: this.makeLayer(`far_${theme}`, -20), factor: 0.12 },
      { sprite: this.makeLayer(`mid_${theme}`, -10), factor: 0.35 }
    ];
  }

  makeLayer(key, depth) {
    return this.scene.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, key).setOrigin(0).setScrollFactor(0).setDepth(depth);
  }

  update() {
    const cam = this.scene.cameras.main;
    this.layers.forEach(({ sprite, factor }) => {
      sprite.tilePositionX = cam.scrollX * factor;
    });
  }
}
