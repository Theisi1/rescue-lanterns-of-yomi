import { TILE } from '../config.js';
import Yurei from '../objects/Yurei.js';
import Hitodama from '../objects/Hitodama.js';
import Gaki from '../objects/Gaki.js';
import Rokurokubi from '../objects/Rokurokubi.js';
import Katashiro from '../objects/Katashiro.js';
import PowerUp from '../objects/PowerUp.js';
import Checkpoint from '../objects/Checkpoint.js';
import Kohaku from '../objects/Kohaku.js';
import TriggerZone from '../physics/TriggerZone.js';

/**
 * Construye un nivel a partir de su JSON (src/assets/levels/levelN.json).
 *
 * El mapa es una lista de cadenas: cada carácter es una celda de 32x32.
 *   #  suelo/pared sólida          -  plataforma de madera (se atraviesa desde abajo)
 *   ~  plataforma espiritual (solo con la Visión de Yomi)
 *   P  inicio de Akari     K  katashiro (rescate)     C  checkpoint (tōrō)    E  salida (torii)
 *   o  omamori   O  aceite   L  mecha extra   I  incienso   S  parche de washi   F  pluma de tengu
 *   Y  Yūrei     H  Hitodama   G  Gaki (trigger)   W  Kamaitachi (trigger)   R  Rokurokubi (techo)
 *   k  Kohaku (pista)   J  susto (trigger)   B  inicio del bucle de torii   T  torii que repite el camino
 *
 * Diseñar niveles como texto permite editarlos sin herramientas extra y
 * separa los datos del código (separación de responsabilidades).
 */
const PICKUPS = { o: 'omamori', O: 'oil', L: 'wick', I: 'incense', S: 'washi', F: 'feather' };

export default class LevelManager {
  constructor(scene) {
    this.scene = scene;
  }

  build(data) {
    const scene = this.scene;
    const width = Math.max(...data.map.map((r) => r.length));
    this.rows = data.map.map((r) => r.padEnd(width, ' '));
    this.cols = width;
    this.theme = data.theme;

    const info = {
      width: width * TILE,
      height: this.rows.length * TILE,
      playerStart: { x: 2 * TILE, y: 14 * TILE },
      loopStart: null,
      totalKatashiro: 0
    };

    this.buildTerrain();
    this.buildDecor(data.decor || []);

    let hintIndex = 0;
    this.rows.forEach((row, r) => {
      [...row].forEach((ch, c) => {
        const x = c * TILE + TILE / 2;
        const bottom = (r + 1) * TILE;
        const centerY = r * TILE + TILE / 2;
        switch (ch) {
          case 'P': info.playerStart = { x, y: bottom }; break;
          case 'B': info.loopStart = { x, y: bottom }; break;
          case 'K':
            scene.katashiros.add(new Katashiro(scene, x, bottom));
            info.totalKatashiro++;
            break;
          case 'C': scene.checkpoints.push(new Checkpoint(scene, x, bottom)); break;
          case 'E': this.createExit(x, bottom); break;
          case 'k': scene.kohakus.push(new Kohaku(scene, x, bottom, data.hints?.[hintIndex++] ?? '')); break;
          case 'Y': scene.enemies.add(new Yurei(scene, x, centerY)); break;
          case 'H': scene.enemies.add(new Hitodama(scene, x, centerY)); break;
          case 'G': this.createGaki(x, bottom); break;
          case 'R': scene.enemies.add(new Rokurokubi(scene, x, r * TILE, this.floorBelow(c, r))); break;
          case 'W':
            this.addTrigger(x, info.height / 2, TILE, info.height, { cooldown: 7000, onEnter: () => scene.spawnKamaitachi() });
            break;
          case 'J':
            this.addTrigger(x, bottom - 48, TILE * 2, 96, { once: true, onEnter: () => scene.jumpScare(x + 160, bottom) });
            break;
          case 'T':
            this.addTrigger(x, info.height / 2, TILE, info.height, { cooldown: 1200, onEnter: (player, zone) => scene.toriiLoop(zone) });
            break;
          default:
            if (PICKUPS[ch]) scene.pickups.add(new PowerUp(scene, x, centerY, PICKUPS[ch]));
        }
      });
    });
    return info;
  }

  isSolid(c, r) {
    return this.rows[r]?.[c] === '#';
  }

  /** Une celdas consecutivas del mismo tipo en un solo cuerpo: menos cuerpos = más FPS. */
  buildTerrain() {
    const scene = this.scene;
    this.rows.forEach((row, r) => {
      let c = 0;
      while (c < this.cols) {
        const ch = row[c];
        if (ch !== '#' && ch !== '-' && ch !== '~') { c++; continue; }
        // Para el suelo distinguimos la capa superior (con hierba/borde) del relleno.
        const isTop = ch === '#' && !this.isSolid(c, r - 1);
        let end = c;
        while (end + 1 < this.cols && row[end + 1] === ch && (ch !== '#' || isTop === !this.isSolid(end + 1, r - 1))) end++;
        const w = (end - c + 1) * TILE;
        const cx = c * TILE + w / 2;

        if (ch === '#') {
          const key = isTop ? `tile_${this.theme}_top` : `tile_${this.theme}`;
          const ts = scene.add.tileSprite(cx, r * TILE + TILE / 2, w, TILE, key).setDepth(10);
          scene.solids.add(ts);
        } else {
          const spirit = ch === '~';
          const ts = scene.add.tileSprite(cx, r * TILE + 6, w, 12, spirit ? 'plat_spirit' : 'plat_wood').setDepth(spirit ? 9 : 10);
          (spirit ? scene.spirits : scene.platforms).add(ts);
          // Plataforma de un solo sentido: se atraviesa saltando desde abajo.
          ts.body.checkCollision.down = false;
          ts.body.checkCollision.left = false;
          ts.body.checkCollision.right = false;
          if (spirit) ts.setBlendMode('ADD');
        }
        c = end + 1;
      }
    });
  }

  buildDecor(decor) {
    const scene = this.scene;
    decor.forEach((d) => {
      const x = d.col * TILE + TILE / 2;
      const y = (d.row + 1) * TILE;
      const img = scene.add.image(x, y, d.type).setOrigin(0.5, 1).setDepth(d.front ? 12 : 2).setAlpha(d.alpha ?? 0.9);
      if (d.yomi) scene.yomiRevealables.push(img);
    });
  }

  floorBelow(c, r) {
    for (let y = r + 1; y < this.rows.length; y++) if (this.isSolid(c, y)) return y * TILE;
    return this.rows.length * TILE;
  }

  createGaki(x, groundY) {
    const scene = this.scene;
    const hand = new Gaki(scene, x, groundY);
    scene.enemies.add(hand);
    // La mano sale un poco por delante de donde se activa la zona.
    this.addTrigger(x - 40, groundY - 48, TILE * 3, 96, { cooldown: 500, onEnter: () => hand.trigger() });
  }

  createExit(x, bottom) {
    const scene = this.scene;
    const gate = scene.physics.add.staticImage(x, bottom, 'torii_exit').setOrigin(0.5, 1).setDepth(8);
    gate.body.updateFromGameObject();
    gate.body.setSize(40, 100, true); // solo el paso bajo el torii cuenta como salida
    scene.exitGate = gate;
  }

  addTrigger(x, y, w, h, options) {
    const zone = new TriggerZone(this.scene, x, y, w, h, options);
    this.scene.triggers.push(zone);
    return zone;
  }
}
