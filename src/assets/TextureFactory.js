import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE } from '../config.js';
import * as S from './sprites.js';

/**
 * Genera todas las texturas del juego en tiempo de carga (PreloadScene).
 *  - Sprites: desde los mapas de píxeles de sprites.js.
 *  - Tiles, fondos y efectos: dibujados con Canvas 2D.
 * No se descarga ninguna imagen: la carga es inmediata y el arte es 100 % original.
 */
export default class TextureFactory {
  constructor(scene) {
    this.scene = scene;
    this.textures = scene.textures;
  }

  generateAll() {
    this.sprites();
    this.tiles();
    this.props();
    this.effects();
    this.backgrounds();
    this.ui();
  }

  // ---------------------------------------------------------------- helpers
  canvas(key, w, h, draw) {
    if (this.textures.exists(key)) this.textures.remove(key);
    const tex = this.textures.createCanvas(key, w, h);
    const ctx = tex.getContext();
    draw(ctx, w, h);
    tex.refresh();
    return tex;
  }

  /** Convierte un mapa de caracteres en textura (cada carácter = scale x scale píxeles). */
  pixels(key, rows, palette, scale = 2) {
    const w = Math.max(...rows.map((r) => r.length));
    this.canvas(key, w * scale, rows.length * scale, (ctx) => {
      rows.forEach((row, y) => {
        [...row].forEach((ch, x) => {
          const color = palette[ch];
          if (!color) return;
          ctx.fillStyle = color;
          ctx.fillRect(x * scale, y * scale, scale, scale);
        });
      });
    });
  }

  radial(key, size, stops) {
    this.canvas(key, size, size, (ctx) => {
      const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      stops.forEach(([o, c]) => g.addColorStop(o, c));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
    });
  }

  // ---------------------------------------------------------------- sprites
  sprites() {
    Object.entries(S.AKARI).forEach(([key, rows]) => {
      this.pixels(key, rows, key === 'lantern_off' ? S.LANTERN_OFF_PALETTE : S.AKARI_PALETTE);
    });
    Object.entries(S.YUREI).forEach(([key, rows]) => this.pixels(key, rows, S.YUREI_PALETTE));
    Object.entries(S.KAMAITACHI).forEach(([key, rows]) => this.pixels(key, rows, S.KAMAITACHI_PALETTE));
    this.pixels('gaki', S.GAKI, S.GAKI_PALETTE);
    this.pixels('hitodama', S.HITODAMA, S.HITODAMA_PALETTE);
    this.pixels('rokuro', S.ROKURO, S.ROKURO_PALETTE);
    this.pixels('katashiro', S.KATASHIRO, S.KATASHIRO_PALETTE);
    this.pixels('villager', S.PERSON, S.VILLAGER_PALETTE);
    this.pixels('tetsu', S.PERSON, S.TETSU_PALETTE);
    this.pixels('kohaku', S.KOHAKU, S.KOHAKU_PALETTE);
    this.pixels('kurohime', S.KUROHIME, S.KUROHIME_PALETTE, 4);
    this.pixels('kurohime_angry', S.KUROHIME_ANGRY, S.KUROHIME_ANGRY_PALETTE, 4);
    this.pixels('kurohime_monster', S.KUROHIME_MONSTER, S.KUROHIME_MONSTER_PALETTE, 4);
    this.pixels('toro_off', S.TORO, S.TORO_OFF_PALETTE);
    this.pixels('toro_on', S.TORO, S.TORO_ON_PALETTE);
    Object.entries(S.PICKUPS).forEach(([key, { rows, palette }]) => this.pixels(key, rows, palette));

    // Espejo del obi de Kurohime.
    this.canvas('mirror', 20, 20, (ctx) => {
      ctx.fillStyle = '#b8892a';
      ctx.beginPath(); ctx.arc(10, 10, 10, 0, Math.PI * 2); ctx.fill();
      const g = ctx.createRadialGradient(7, 7, 1, 10, 10, 8);
      g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#8fa0c8');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(10, 10, 7, 0, Math.PI * 2); ctx.fill();
    });
  }

  // ---------------------------------------------------------------- tiles
  tiles() {
    const themes = {
      bamboo: { fill: '#2b1d16', speck: '#3b2a20', top: '#3e5a2a', topLight: '#5c7f3a' },
      village: { fill: '#34303a', speck: '#26232b', top: '#5a3a24', topLight: '#7a5234' },
      shrine: { fill: '#3e3a44', speck: '#2c2932', top: '#5e5a66', topLight: '#4d6b3a' },
      cave: { fill: '#1d1822', speck: '#2a2330', top: '#2e2836', topLight: '#6a1828' }
    };
    const rnd = new Phaser.Math.RandomDataGenerator(['tiles']);
    Object.entries(themes).forEach(([name, c]) => {
      const drawFill = (ctx) => {
        ctx.fillStyle = c.fill;
        ctx.fillRect(0, 0, TILE, TILE);
        ctx.fillStyle = c.speck;
        if (name === 'village' || name === 'shrine') {
          // Bloques de piedra.
          ctx.fillRect(0, 15, TILE, 2);
          ctx.fillRect(10, 0, 2, 15);
          ctx.fillRect(24, 17, 2, 15);
        } else {
          for (let i = 0; i < 10; i++) ctx.fillRect(rnd.between(0, 30), rnd.between(0, 30), 2, 2);
        }
      };
      this.canvas(`tile_${name}`, TILE, TILE, drawFill);
      this.canvas(`tile_${name}_top`, TILE, TILE, (ctx) => {
        drawFill(ctx);
        ctx.fillStyle = c.top;
        ctx.fillRect(0, 0, TILE, 7);
        ctx.fillStyle = c.topLight;
        ctx.fillRect(0, 0, TILE, 2);
        if (name === 'bamboo' || name === 'shrine') {
          for (let x = 1; x < TILE; x += 4) ctx.fillRect(x, -1 + (x % 3), 1, 4);
        }
        if (name === 'village') {
          ctx.fillStyle = '#3a2416';
          ctx.fillRect(15, 0, 1, 7);
        }
      });
    });

    this.canvas('plat_wood', TILE, 12, (ctx) => {
      ctx.fillStyle = '#2a160c'; ctx.fillRect(0, 0, TILE, 12);
      ctx.fillStyle = '#6b4226'; ctx.fillRect(0, 1, TILE, 7);
      ctx.fillStyle = '#8a5a34'; ctx.fillRect(0, 1, TILE, 2);
      ctx.fillStyle = '#2a160c'; ctx.fillRect(15, 1, 1, 7);
      ctx.fillStyle = '#4a2c18'; ctx.fillRect(3, 8, 3, 4); ctx.fillRect(26, 8, 3, 4);
    });

    this.canvas('plat_spirit', TILE, 12, (ctx) => {
      ctx.fillStyle = 'rgba(120,60,200,0.55)'; ctx.fillRect(0, 2, TILE, 8);
      ctx.fillStyle = '#d9b8ff'; ctx.fillRect(0, 1, TILE, 2);
      ctx.fillStyle = 'rgba(217,184,255,0.6)'; ctx.fillRect(0, 9, TILE, 1);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(6, 4, 2, 2); ctx.fillRect(21, 6, 2, 2);
    });

    this.canvas('pillar', 48, 128, (ctx) => {
      ctx.fillStyle = '#2a2430'; ctx.fillRect(0, 0, 48, 128);
      ctx.fillStyle = '#3c3444'; ctx.fillRect(4, 0, 12, 128);
      ctx.fillStyle = '#18141c'; ctx.fillRect(40, 0, 8, 128);
      ctx.fillStyle = '#4a4054'; ctx.fillRect(0, 0, 48, 6);
      ctx.fillStyle = '#6a1828'; ctx.fillRect(0, 6, 48, 3);
      for (let y = 20; y < 128; y += 24) { ctx.fillStyle = '#18141c'; ctx.fillRect(0, y, 48, 2); }
    });

    this.canvas('river', 64, 64, (ctx) => {
      ctx.fillStyle = '#06030a'; ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#3a0a1c'; ctx.fillRect(0, 0, 64, 3);
      ctx.fillStyle = '#5a1028';
      for (let i = 0; i < 6; i++) ctx.fillRect(rnd.between(0, 56), rnd.between(6, 60), rnd.between(6, 14), 1);
    });
  }

  // ---------------------------------------------------------------- props
  props() {
    // Torii: el grande es la salida del nivel, el pequeño es decoración.
    const torii = (key, w, h, color = '#b3202c') => this.canvas(key, w, h, (ctx) => {
      const u = w / 48;
      ctx.fillStyle = '#120808';
      ctx.fillRect(0, 0, w, 6 * u);              // kasagi (viga superior)
      ctx.fillStyle = color;
      ctx.fillRect(2 * u, 6 * u, w - 4 * u, 4 * u);
      ctx.fillRect(6 * u, 16 * u, w - 12 * u, 4 * u); // nuki
      ctx.fillRect(10 * u, 6 * u, 5 * u, h - 6 * u);  // pilares
      ctx.fillRect(w - 15 * u, 6 * u, 5 * u, h - 6 * u);
      ctx.fillRect(22 * u, 10 * u, 4 * u, 6 * u);   // gakuzuka
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(13 * u, 6 * u, 2 * u, h - 6 * u);
      ctx.fillRect(w - 12 * u, 6 * u, 2 * u, h - 6 * u);
      ctx.fillStyle = '#120808';
      ctx.fillRect(9 * u, h - 4 * u, 7 * u, 4 * u);
      ctx.fillRect(w - 16 * u, h - 4 * u, 7 * u, 4 * u);
    });
    torii('torii_exit', 96, 112);
    torii('torii', 72, 96, '#8a1a24');
    torii('torii_true', 72, 96, '#ff3050');

    // Farol rojo colgante (decoración del pueblo).
    this.canvas('lantern_red', 16, 40, (ctx) => {
      ctx.fillStyle = '#1a0f08'; ctx.fillRect(7, 0, 2, 12);
      ctx.fillStyle = '#5a0e16'; ctx.fillRect(2, 12, 12, 22);
      ctx.fillStyle = '#3a080e'; ctx.fillRect(2, 18, 12, 1); ctx.fillRect(2, 24, 12, 1); ctx.fillRect(2, 30, 12, 1);
      ctx.fillStyle = '#1a0f08'; ctx.fillRect(4, 10, 8, 3); ctx.fillRect(4, 33, 8, 3);
    });

    // Puesto de festival abandonado.
    this.canvas('stall', 96, 80, (ctx) => {
      ctx.fillStyle = '#2a1a12'; ctx.fillRect(6, 20, 6, 60); ctx.fillRect(84, 20, 6, 60);
      ctx.fillStyle = '#3a2418'; ctx.fillRect(0, 48, 96, 14);
      for (let x = 0; x < 96; x += 16) {
        ctx.fillStyle = x % 32 ? '#e8e0d0' : '#8a1a24';
        ctx.fillRect(x, 8, 16, 14);
      }
      ctx.fillStyle = '#1a0f08'; ctx.fillRect(0, 4, 96, 4);
    });

    // Tallos de bambú para el primer plano.
    this.canvas('bamboo_front', 24, 200, (ctx) => {
      ctx.fillStyle = '#1e2e1a'; ctx.fillRect(6, 0, 12, 200);
      ctx.fillStyle = '#2c4426'; ctx.fillRect(8, 0, 4, 200);
      ctx.fillStyle = '#121c10';
      for (let y = 20; y < 200; y += 38) ctx.fillRect(5, y, 14, 3);
    });

    // Shōji para el susto del pueblo.
    this.canvas('shoji', 64, 96, (ctx) => {
      ctx.fillStyle = '#2a1a10'; ctx.fillRect(0, 0, 64, 96);
      ctx.fillStyle = '#d8ccb0'; ctx.fillRect(4, 4, 56, 88);
      ctx.fillStyle = '#2a1a10';
      for (let x = 4; x < 60; x += 14) ctx.fillRect(x, 4, 2, 88);
      for (let y = 4; y < 92; y += 22) ctx.fillRect(4, y, 56, 2);
    });
  }

  // ---------------------------------------------------------------- efectos
  effects() {
    this.radial('light', 256, [[0, 'rgba(255,255,255,1)'], [0.45, 'rgba(255,255,255,0.85)'], [1, 'rgba(255,255,255,0)']]);
    this.radial('fog', 256, [[0, 'rgba(170,20,40,0.55)'], [0.6, 'rgba(120,10,30,0.2)'], [1, 'rgba(80,0,20,0)']]);
    this.radial('aura', 96, [[0, 'rgba(220,210,255,0)'], [0.55, 'rgba(200,190,255,0.35)'], [0.8, 'rgba(160,150,230,0.5)'], [1, 'rgba(120,110,200,0)']]);
    this.radial('glow', 64, [[0, 'rgba(255,215,120,0.9)'], [1, 'rgba(255,160,40,0)']]);

    this.canvas('vignette', GAME_WIDTH, GAME_HEIGHT, (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, w * 0.62);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.75)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });

    this.canvas('ash', 3, 3, (ctx) => { ctx.fillStyle = '#9a8f8a'; ctx.fillRect(0, 0, 3, 3); });
    this.canvas('petal', 7, 5, (ctx) => {
      ctx.fillStyle = '#e8a0b4';
      ctx.beginPath(); ctx.ellipse(3.5, 2.5, 3.5, 2, 0, 0, Math.PI * 2); ctx.fill();
    });
    this.canvas('petal_black', 12, 8, (ctx) => {
      ctx.fillStyle = '#ff3050';
      ctx.beginPath(); ctx.ellipse(6, 4, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#16060c';
      ctx.beginPath(); ctx.ellipse(6, 4, 4.5, 2.6, 0, 0, Math.PI * 2); ctx.fill();
    });
    this.canvas('spark', 6, 6, (ctx) => {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(2, 0, 2, 6); ctx.fillRect(0, 2, 6, 2);
    });
    this.canvas('dust', 4, 4, (ctx) => { ctx.fillStyle = '#6a5040'; ctx.fillRect(0, 0, 4, 4); });
    this.canvas('wind_streak', 60, 2, (ctx) => {
      const g = ctx.createLinearGradient(0, 0, 60, 0);
      g.addColorStop(0, 'rgba(200,230,255,0)'); g.addColorStop(1, 'rgba(200,230,255,0.9)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 60, 2);
    });
  }

  // ---------------------------------------------------------------- fondos
  backgrounds() {
    const rnd = new Phaser.Math.RandomDataGenerator(['yomi']);
    const W = GAME_WIDTH;
    const H = GAME_HEIGHT;

    const sky = (key, top, bottom, moon = '#c8283c') => this.canvas(key, W, H, (ctx) => {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, top); g.addColorStop(1, bottom);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      if (moon) {
        const mg = ctx.createRadialGradient(720, 110, 10, 720, 110, 120);
        mg.addColorStop(0, 'rgba(200,40,60,0.35)'); mg.addColorStop(1, 'rgba(200,40,60,0)');
        ctx.fillStyle = mg; ctx.fillRect(560, 0, 320, 260);
        ctx.fillStyle = moon;
        ctx.beginPath(); ctx.arc(720, 110, 42, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      for (let i = 0; i < 60; i++) ctx.fillRect(rnd.between(0, W), rnd.between(0, H * 0.5), 1, 1);
    });
    sky('sky_bamboo', '#07040e', '#2a0c1a');
    sky('sky_village', '#0a0410', '#3a0a18');
    sky('sky_shrine', '#06030c', '#2c0820');
    sky('sky_cave', '#030205', '#14060c', null);
    sky('sky_dawn', '#2a3a6a', '#f2a46a', null);

    // Dibuja una forma y su copia desplazada para que la capa sea "tileable".
    const wrap = (ctx, x, width, fn) => {
      fn(x);
      if (x + width > W) fn(x - W);
      if (x < 0) fn(x + W);
    };

    const mountains = (key, color, base, peak) => this.canvas(key, W, H, (ctx) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, H);
      const steps = 12;
      const heights = Array.from({ length: steps }, () => rnd.between(peak, base));
      for (let i = 0; i <= steps; i++) ctx.lineTo((i / steps) * W, heights[i % steps]);
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();
    });
    mountains('far_bamboo', '#120a18', 330, 200);
    mountains('far_village', '#150a16', 340, 220);
    mountains('far_shrine', '#10081a', 300, 160);
    mountains('far_cave', '#0a0610', 120, 20);

    // Bosque de bambú.
    this.canvas('mid_bamboo', W, H, (ctx) => {
      for (let i = 0; i < 26; i++) {
        const x = rnd.between(0, W);
        const w = rnd.between(6, 12);
        wrap(ctx, x, w, (px) => {
          ctx.fillStyle = '#0e1a10';
          ctx.fillRect(px, 0, w, H);
          ctx.fillStyle = '#081008';
          for (let y = rnd.between(10, 60); y < H; y += 70) ctx.fillRect(px - 1, y, w + 2, 3);
        });
      }
    });

    // Pueblo: tejados y faroles.
    this.canvas('mid_village', W, H, (ctx) => {
      for (let i = 0; i < 7; i++) {
        const x = i * 140 + rnd.between(0, 40);
        const w = rnd.between(90, 120);
        const top = rnd.between(280, 340);
        wrap(ctx, x - 10, w + 20, (px) => {
          ctx.fillStyle = '#100a12';
          ctx.fillRect(px, top, w, H - top);
          ctx.fillStyle = '#1a0e16';
          ctx.beginPath();
          ctx.moveTo(px - 16, top + 6); ctx.lineTo(px + w / 2, top - 34); ctx.lineTo(px + w + 16, top + 6);
          ctx.closePath(); ctx.fill();
          ctx.fillStyle = 'rgba(160,30,40,0.35)';
          ctx.fillRect(px + 14, top + 24, 12, 16);
        });
      }
    });

    // Sendero de los Mil Torii.
    this.canvas('mid_shrine', W, H, (ctx) => {
      for (let i = 0; i < 8; i++) {
        const x = i * 120 + 20;
        const s = 0.8 + (i % 3) * 0.15;
        const top = 250 + (i % 2) * 20;
        wrap(ctx, x, 70 * s, (px) => {
          ctx.fillStyle = '#2a0a12';
          ctx.fillRect(px, top, 70 * s, 8 * s);
          ctx.fillRect(px + 10 * s, top, 7 * s, H - top);
          ctx.fillRect(px + 53 * s, top, 7 * s, H - top);
          ctx.fillRect(px + 6 * s, top + 22 * s, 58 * s, 5 * s);
        });
      }
    });

    // Cueva de la Puerta de Yomi: estalactitas.
    this.canvas('mid_cave', W, H, (ctx) => {
      ctx.fillStyle = '#0c0812';
      for (let i = 0; i < 18; i++) {
        const x = rnd.between(0, W);
        const w = rnd.between(20, 50);
        const h = rnd.between(60, 180);
        wrap(ctx, x, w, (px) => {
          ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px + w / 2, h); ctx.lineTo(px + w, 0); ctx.closePath(); ctx.fill();
        });
      }
      ctx.fillStyle = 'rgba(255,120,60,0.5)';
      for (let i = 0; i < 14; i++) ctx.fillRect(rnd.between(0, W), rnd.between(160, 360), 3, 4); // faroles flotando a lo lejos
    });

    // Amanecer (escena de victoria).
    this.canvas('far_dawn', W, H, (ctx) => {
      ctx.fillStyle = '#4a3050';
      ctx.beginPath(); ctx.moveTo(0, H);
      [[0, 360], [160, 290], [300, 340], [470, 260], [640, 330], [800, 280], [960, 350]].forEach(([x, y]) => ctx.lineTo(x, y));
      ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#2a1a2a';
      for (let i = 0; i < 9; i++) {
        const x = 40 + i * 105;
        ctx.fillRect(x, 400, 70, 140);
        ctx.beginPath(); ctx.moveTo(x - 12, 404); ctx.lineTo(x + 35, 372); ctx.lineTo(x + 82, 404); ctx.closePath(); ctx.fill();
      }
    });
  }

  // ---------------------------------------------------------------- UI
  ui() {
    this.canvas('btn_circle', 96, 96, (ctx) => {
      ctx.fillStyle = 'rgba(20,10,20,0.55)';
      ctx.beginPath(); ctx.arc(48, 48, 46, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,215,106,0.85)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(48, 48, 44, 0, Math.PI * 2); ctx.stroke();
    });
  }
}
