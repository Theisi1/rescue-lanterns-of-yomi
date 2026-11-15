import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';

/**
 * Efectos de ambiente: niebla roja que se desplaza, pétalos/cenizas cayendo
 * y luciérnagas. Todo se dibuja fijo a la cámara para que el costo sea constante
 * sin importar el tamaño del nivel.
 */
export default class Atmosphere {
  constructor(scene, { particle = 'ash', fogAlpha = 0.22, fireflies = false } = {}) {
    this.scene = scene;

    // Bancos de niebla: pocas imágenes grandes con mezcla aditiva.
    this.fog = [];
    for (let i = 0; i < 4; i++) {
      const img = scene.add
        .image(Phaser.Math.Between(0, GAME_WIDTH), Phaser.Math.Between(300, 520), 'fog')
        .setScrollFactor(0)
        .setDepth(51) // sobre la oscuridad: la niebla roja se ve en todo el nivel
        .setBlendMode('ADD')
        .setAlpha(fogAlpha)
        .setScale(Phaser.Math.FloatBetween(2.2, 3.2), Phaser.Math.FloatBetween(0.8, 1.2));
      img.speed = Phaser.Math.FloatBetween(6, 16) * (i % 2 ? 1 : -1);
      this.fog.push(img);
    }

    // Pétalos o ceniza: emisor fijo a la cámara.
    this.falling = scene.add.particles(0, 0, particle, {
      x: { min: -40, max: GAME_WIDTH + 40 },
      y: -12,
      lifespan: 9000,
      speedY: { min: 25, max: 55 },
      speedX: { min: -25, max: 15 },
      rotate: { start: 0, end: 360 },
      alpha: { start: 0.9, end: 0.2 },
      scale: { min: 0.7, max: 1.2 },
      frequency: 260,
      quantity: 1
    }).setScrollFactor(0).setDepth(53);

    if (fireflies) {
      this.fireflies = scene.add.particles(0, 0, 'spark', {
        x: { min: 0, max: GAME_WIDTH },
        y: { min: 180, max: GAME_HEIGHT - 60 },
        lifespan: 3500,
        speed: { min: 5, max: 20 },
        alpha: { start: 1, end: 0 },
        scale: { min: 0.5, max: 0.9 },
        tint: 0xd9ff8a,
        blendMode: 'ADD',
        frequency: 420
      }).setScrollFactor(0).setDepth(54);
    }
  }

  update(time, delta) {
    const dt = delta / 1000;
    this.fog.forEach((f) => {
      f.x += f.speed * dt;
      if (f.x < -300) f.x = GAME_WIDTH + 300;
      if (f.x > GAME_WIDTH + 300) f.x = -300;
    });
  }
}
