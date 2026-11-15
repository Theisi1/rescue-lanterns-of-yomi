import Phaser from 'phaser';
import BaseLevelScene from './BaseLevelScene.js';
import Kurohime from '../objects/Kurohime.js';
import Yurei from '../objects/Yurei.js';
import Katashiro from '../objects/Katashiro.js';
import PowerUp from '../objects/PowerUp.js';
import Checkpoint from '../objects/Checkpoint.js';
import { AudioManager } from '../managers/AudioManager.js';
import { GameState, STATES } from '../managers/GameStateManager.js';
import { StorageManager } from '../managers/StorageManager.js';
import { EventBus, EVENTS } from '../managers/EventBus.js';
import { GAME_WIDTH, GAME_HEIGHT, TILE, SCORE, FLAME } from '../config.js';
import { fadeOutThen } from '../ui/transitions.js';

const GROUND_Y = 15 * TILE;       // parte superior del suelo
const RIVER_TOP = GROUND_Y - 30;  // altura máxima del río negro en la fase 3
const PILLAR_X = [300, 660];
const PILLAR_TOP = GROUND_Y - 128;
const CENTER_PLATFORM = { x: 480, y: 300 };
// Distancia máxima (desde la llama de Akari) a la que el destello hiere a Kurohime.
// Desde el suelo hay que saltar para alcanzarla; desde las plataformas llega directo.
const FLASH_RANGE = 280;
// En la arena la llama se regenera despacio (por segundo) si Akari no usa la Visión ni sufre el viento.
const FLAME_REGEN = 3;
// Fase 2: el centro del suelo se hunde y aparecen dos plataformas de madera a los lados.
const PIT = { left: 372, right: 588 };
const SIDE_PLATFORMS = [[170, 372], [790, 372]];
// Fase 3: balsas de madera sobre el río. Con las plataformas laterales y la central forman
// una ruta sólida (lado → balsa → centro) sin necesidad de la Visión de Yomi.
const RAFTS = [[330, 410], [630, 410]];
// Tinte de la arena en cada fase (color, alpha).
const PHASE_TINT = { 2: [0x3050c0, 0.12], 3: [0xb01030, 0.16] };
const SPIRIT_PLATFORMS = [
  [130, 420, 96], [830, 420, 96], [480, 410, 96],
  [210, 330, 64], [750, 330, 64]
];

/**
 * La Puerta de Yomi: arena del jefe final.
 * Kurohime decide qué ataque usar; esta escena los ejecuta (pétalos, viento, río)
 * y transforma la arena en cada fase:
 *  1. El santuario: suelo completo, dos pilares y la plataforma central.
 *  2. El suelo se agrieta: el centro se hunde (foso) y aparecen plataformas laterales.
 *  3. El río de Yomi: el río negro cubre el suelo y los pilares se hunden; quedan las
 *     plataformas de madera (laterales, balsas y central) y las espirituales.
 */
export default class BossScene extends BaseLevelScene {
  constructor() {
    super('BossScene');
  }

  create() {
    this.createGroups();
    this.buildArena();

    this.setupCommon({
      theme: 'cave',
      darkness: 0.82,
      music: 'boss',
      particle: 'petal',
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      start: { x: 90, y: GROUND_Y },
      yomiDrain: 6,
      boss: true
    });

    this.physics.add.collider(this.bullets, this.solids, (petal) => petal.destroy());
    this.physics.add.overlap(this.player, this.bullets, (player, petal) => {
      petal.destroy();
      this.damagePlayer(8, petal, 0.8);
    });
    this.physics.add.overlap(this.player, this.boss, () => this.damagePlayer(14, this.boss, 1.4));

    this.windActive = false;
    this.windDir = 0;
    this.phase = 1;
    this.riverRisen = false;
    this.oilTimer = 4000;
    this.totalRescues = 1; // Tetsu

    GameState.startLevel();
    this.levelLabel = 'La Puerta de Yomi';
    this.levelBanner = { title: 'La Puerta de Yomi', subtitle: 'Kurohime, la Novia de Yomi' };
  }

  buildArena() {
    // Suelo (en la fase 2 se rehace en dos tramos con un foso en medio).
    this.groundParts = [];
    this.buildGround([[0, GAME_WIDTH]]);

    // Pilares: cubren del viento helado y bloquean los pétalos.
    this.pillars = PILLAR_X.map((x) => {
      const pillar = this.add.tileSprite(x, PILLAR_TOP + 64, 48, 128, 'pillar').setDepth(9);
      this.solids.add(pillar);
      return pillar;
    });

    // Plataforma central de madera: lugar seguro y donde aparecerá Tetsu.
    const center = this.add.tileSprite(CENTER_PLATFORM.x, CENTER_PLATFORM.y + 6, 128, 12, 'plat_wood').setDepth(10);
    this.platforms.add(center);
    center.body.checkCollision.down = center.body.checkCollision.left = center.body.checkCollision.right = false;

    // Plataformas espirituales (solo existen con la Visión de Yomi).
    SPIRIT_PLATFORMS.forEach(([x, y, w]) => {
      const p = this.add.tileSprite(x, y + 6, w, 12, 'plat_spirit').setDepth(9).setBlendMode('ADD');
      this.spirits.add(p);
      p.body.checkCollision.down = p.body.checkCollision.left = p.body.checkCollision.right = false;
    });

    // Faroles flotando sobre el río (decoración).
    for (let i = 0; i < 6; i++) {
      const l = this.add.image(80 + i * 160, 200 + (i % 2) * 40, 'lantern_off').setAlpha(0.4).setDepth(1);
      this.tweens.add({ targets: l, y: l.y - 10, yoyo: true, repeat: -1, duration: 1800 + i * 200, ease: 'Sine.InOut' });
    }

    this.checkpoints.push(new Checkpoint(this, 40, GROUND_Y));
    this.checkpoints[0].light();

    // Río negro (sube en la fase 3).
    this.river = this.add.tileSprite(GAME_WIDTH / 2, GAME_HEIGHT + 10, GAME_WIDTH, 220, 'river').setOrigin(0.5, 0).setDepth(25).setAlpha(0.95);

    // Tinte de fase: frío en la fase 2, rojo sangre en la 3.
    this.phaseTint = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0).setOrigin(0).setDepth(56).setBlendMode('ADD');

    this.bullets = this.physics.add.group({ allowGravity: false });
    this.boss = new Kurohime(this, 600, 140);
  }

  /** Crea el suelo como tramos [x0, x1] de bloques sólidos. */
  buildGround(segments) {
    this.groundParts.forEach((g) => g.destroy());
    this.groundParts = [];
    segments.forEach(([x0, x1]) => {
      const w = x1 - x0;
      const top = this.add.tileSprite(x0 + w / 2, GROUND_Y + TILE / 2, w, TILE, 'tile_cave_top').setDepth(10);
      const fill = this.add.tileSprite(x0 + w / 2, GROUND_Y + TILE * 1.5, w, TILE, 'tile_cave').setDepth(10);
      this.solids.add(top);
      this.solids.add(fill);
      this.groundParts.push(top, fill);
    });
  }

  // ------------------------------------------------------------------ cambios de fase
  /** Cartel y tinte comunes a cada cambio de fase. */
  announcePhase(n, title, subtitle) {
    this.phase = n;
    EventBus.emit(EVENTS.BANNER, { title, subtitle });
    const [color, alpha] = PHASE_TINT[n];
    this.phaseTint.setFillStyle(color, 0);
    this.tweens.add({ targets: this.phaseTint, fillAlpha: alpha, duration: 1500 });
  }

  /** Fase 2: el centro del suelo se agrieta y se hunde; aparecen plataformas laterales. */
  enterPhase2() {
    this.announcePhase(2, 'Fase 2', 'El suelo se agrieta');
    this.toast('¡El suelo se rompe! Aléjate del centro');
    this.cameras.main.shake(1500, 0.004);

    // Aviso: la zona que va a caer parpadea en rojo.
    const warn = this.add.rectangle((PIT.left + PIT.right) / 2, GROUND_Y + TILE, PIT.right - PIT.left, TILE * 2, 0xff2040, 0)
      .setDepth(11);
    this.tweens.add({ targets: warn, fillAlpha: 0.45, yoyo: true, repeat: 4, duration: 160 });

    this.time.delayedCall(1600, () => {
      warn.destroy();
      if (this.ending) return;
      this.buildGround([[0, PIT.left], [PIT.right, GAME_WIDTH]]);
      this.river.setDepth(9);
      this.tweens.add({ targets: this.river, y: GROUND_Y + 14, duration: 1200, ease: 'Sine.Out' });
      this.pitGlow = this.add.image((PIT.left + PIT.right) / 2, GROUND_Y + 30, 'glow')
        .setScale(3.2, 1.2).setTint(0xff2040).setBlendMode('ADD').setAlpha(0).setDepth(11);
      this.tweens.add({ targets: this.pitGlow, alpha: 0.55, duration: 800 });
      this.tweens.add({ targets: this.pitGlow, scaleX: 3.5, yoyo: true, repeat: -1, duration: 1200, delay: 800, ease: 'Sine.InOut' });
      AudioManager.sfx('gaki');
      this.cameras.main.shake(300, 0.012);
      for (let x = PIT.left; x < PIT.right; x += 24) this.dust.emitParticleAt(x, GROUND_Y + 4, 4);

      // Plataformas laterales para alcanzar a Kurohime sin depender de los pilares.
      this.sidePlatforms = SIDE_PLATFORMS.map(([x, y]) => {
        const p = this.add.tileSprite(x, y + 6, 96, 12, 'plat_wood').setDepth(10).setAlpha(0);
        this.platforms.add(p);
        p.body.checkCollision.down = p.body.checkCollision.left = p.body.checkCollision.right = false;
        this.tweens.add({ targets: p, alpha: 1, duration: 600 });
        return p;
      });
    });
  }

  /** Fase 3: el río negro sube, los pilares se hunden y aparecen balsas. */
  enterPhase3() {
    this.announcePhase(3, 'Fase 3', 'El río de Yomi');
    this.river.setDepth(25);
    this.pitGlow?.destroy();
    this.raiseRiver();
    this.rafts = RAFTS.map(([x, y]) => {
      const raft = this.add.tileSprite(x, y + 6, 96, 12, 'plat_wood').setDepth(26).setAlpha(0).setTint(0xd8b080);
      this.platforms.add(raft);
      raft.body.checkCollision.down = raft.body.checkCollision.left = raft.body.checkCollision.right = false;
      this.tweens.add({ targets: raft, alpha: 1, duration: 1200, delay: 1500 });
      return raft;
    });
  }

  update(time, delta) {
    this.updateCommon(time, delta);
    if (this.ending && !this.boss?.active) return;
    if (this.boss?.active) this.boss.update(time, delta);

    this.updateWind(delta);
    if (!this.ending && !this.player.isDead && !this.windActive && !this.yomi.active && this.flame.value < 100) {
      this.flame.add((FLAME_REGEN * delta) / 1000);
    }
    this.river.tilePositionX += delta * 0.02;

    // Caer al río negro cuesta una mecha.
    if (this.riverRisen && !this.player.isDead && this.player.y > RIVER_TOP + 18) this.loseLife();

    // Los pétalos que salen de la pantalla se eliminan.
    this.bullets.getChildren().slice().forEach((b) => {
      if (b.x < -40 || b.x > GAME_WIDTH + 40 || b.y > GAME_HEIGHT + 40 || b.y < -60) b.destroy();
    });

    // Aceite periódico durante todo el combate para poder seguir usando la llama.
    if (this.boss?.active && !this.boss.fsm.is('intro')) {
      this.oilTimer -= delta;
      if (this.oilTimer <= 0 && this.pickups.countActive() < 3) {
        this.oilTimer = 4500;
        const spots = {
          1: [[180, GROUND_Y - 10], [780, GROUND_Y - 10], [480, 290]],
          2: [[150, GROUND_Y - 10], [810, GROUND_Y - 10], [170, 362], [790, 362], [480, 290]],
          3: [[170, 362], [790, 362], ...RAFTS, [480, 290], [210, 330], [750, 330]]
        }[this.phase];
        const [x, y] = Phaser.Math.RND.pick(spots);
        this.pickups.add(new PowerUp(this, x, y - 22, 'oil'));
      }
    }
  }

  emitHud() {
    super.emitHud();
    if (this.boss?.active) EventBus.emit(EVENTS.BOSS_HP, this.boss.hp, this.boss.maxHp);
  }

  extraLights(lights) {
    if (this.phase === 2) lights.push({ x: (PIT.left + PIT.right) / 2, y: GROUND_Y + 10, r: 120, a: 0.6 });
    if (this.boss?.active) {
      lights.push({ x: this.boss.x, y: this.boss.y, r: 150, a: 0.7 });
      if (this.boss.exposed) lights.push({ x: this.boss.x, y: this.boss.y + 6, r: 90 });
    }
    this.bullets.getChildren().forEach((b) => lights.push({ x: b.x, y: b.y, r: 22, a: 0.5 }));
    if (this.tetsu && !this.tetsu.rescued) lights.push({ x: this.tetsu.x, y: this.tetsu.y - 16, r: 110 });
  }

  // ------------------------------------------------------------------ ataques
  /** Abanico de pétalos de cerezo negros dirigido a Akari. */
  petalFan(x, y, count, spreadDeg, speed) {
    if (this.ending) return;
    AudioManager.sfx('petal');
    const base = Phaser.Math.Angle.Between(x, y, this.player.x, this.player.y - 20);
    const spread = Phaser.Math.DegToRad(spreadDeg);
    for (let i = 0; i < count; i++) {
      const a = base + spread * (count === 1 ? 0 : i / (count - 1) - 0.5);
      const petal = this.bullets.create(x, y, 'petal_black').setDepth(18);
      petal.body.setCircle(4, 2, 0);
      petal.setVelocity(Math.cos(a) * speed, Math.sin(a) * speed);
      petal.setAngularVelocity(240);
    }
  }

  /** Lluvia de pétalos (fase 3): caen desde arriba en columnas, con un hueco para esquivar. */
  petalRain(count, speed) {
    if (this.ending) return;
    AudioManager.sfx('petal');
    const gap = Phaser.Math.Between(0, count - 1);
    for (let i = 0; i < count; i++) {
      if (i === gap) continue;
      const x = 40 + (i + 0.5) * ((GAME_WIDTH - 80) / count) + Phaser.Math.Between(-12, 12);
      this.time.delayedCall(i * 60, () => {
        if (this.ending) return;
        const petal = this.bullets.create(x, -20, 'petal_black').setDepth(18);
        petal.body.setCircle(4, 2, 0);
        petal.setVelocity(Phaser.Math.Between(-20, 20), speed);
        petal.setAngularVelocity(300);
      });
    }
  }

  /** Viento helado: apaga la llama de Akari si no se cubre tras un pilar. */
  startWind(dir, duration) {
    if (this.ending) return;
    this.toast('¡Viento helado! Cúbrete detrás de un pilar');
    this.time.delayedCall(700, () => {
      if (this.ending) return;
      this.windActive = true;
      this.windDir = dir;
      AudioManager.sfx('wind');
      this.windEmitter?.destroy();
      this.windEmitter = this.add.particles(0, 0, 'wind_streak', {
        x: dir > 0 ? -60 : GAME_WIDTH + 60,
        y: { min: 60, max: GAME_HEIGHT - 40 },
        speedX: dir * 900,
        lifespan: 1400,
        alpha: { start: 0.7, end: 0.1 },
        frequency: 25,
        rotate: dir > 0 ? 0 : 180
      }).setDepth(56);
      this.time.delayedCall(duration * 0.5, () => this.windActive && AudioManager.sfx('wind'));
      this.time.delayedCall(duration, () => {
        this.windActive = false;
        this.windEmitter?.stop();
      });
    });
  }

  updateWind(delta) {
    if (!this.windActive || this.player.isDead) return;
    const p = this.player;
    const sheltered = this.pillars.some((pillar) =>
      pillar.body.enable &&
      Math.abs(p.x - pillar.x) < 80 &&
      (p.x - pillar.x) * this.windDir > 0 &&
      p.y > PILLAR_TOP + 10);
    if (sheltered) return;
    this.flame.drain(14, delta);
    p.x += (this.windDir * 85 * delta) / 1000;
  }

  summonYurei() {
    const alive = this.enemies.getChildren().filter((e) => e instanceof Yurei && !e.dead).length;
    if (alive >= 2 || this.ending) return;
    const x = Phaser.Math.Between(160, 800);
    // En la fase 3 el suelo está bajo el río: aparecen a la altura de las plataformas.
    const y = Phaser.Math.RND.pick(this.phase === 3 ? [300, 360] : [GROUND_Y - 40, 280]);
    const yurei = new Yurei(this, x, y, { range: 120, speed: 55 });
    this.enemies.add(yurei);
    AudioManager.sfx('whisper');
  }

  /** Fase 3: el río negro sube y los pilares se hunden. */
  raiseRiver() {
    this.toast('El río negro sube... usa la Visión de Yomi');
    this.tweens.add({
      targets: this.river,
      y: RIVER_TOP,
      duration: 3500,
      ease: 'Sine.InOut',
      onComplete: () => {
        this.riverRisen = true;
        this.respawnPoint = { x: CENTER_PLATFORM.x, y: CENTER_PLATFORM.y };
      }
    });
    this.pillars.forEach((obj) => {
      obj.body.enable = false; // el cuerpo estático no sigue al tween: se desactiva ya
      this.tweens.add({ targets: obj, y: obj.y + 160, duration: 3500, ease: 'Quad.In' });
    });
  }

  onFlash() {
    if (!this.boss?.active || this.boss.isDefeated) return;
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y - 22, this.boss.x, this.boss.y);
    if (dist > FLASH_RANGE) {
      if (this.time.now - (this.lastFarToastAt || 0) > 3000) {
        this.lastFarToastAt = this.time.now;
        this.toast('Demasiado lejos: acércate a Kurohime (salta o sube a una plataforma)');
      }
      return;
    }
    const result = this.boss.hit();
    if (!result) return;
    this.addScore(SCORE.bossHit * result.damage, this.boss.x, this.boss.y - 70);
    this.sparks.emitParticleAt(this.boss.x, this.boss.y + 6, result.mirror ? 30 : 14);
    // Parte de la luz vuelve a Akari: así el destello no la deja sin llama.
    const reward = result.mirror ? FLAME.bossMirrorReward : FLAME.bossHitReward;
    this.flame.add(reward);
    this.showFlameGain(reward, this.player.x, this.player.y - 10);
    if (result.mirror) this.toast('¡Golpe al espejo! Daño doble');
  }

  // ------------------------------------------------------------------ final
  onBossDefeated() {
    AudioManager.playMusic('menu'); // la tensión se va: vuelve la calma
    this.addScore(SCORE.bossDefeat, this.boss.x, this.boss.y);
    this.boss.destroy();
    this.bullets.clear(true, true);
    this.windActive = false;
    this.windEmitter?.stop();
    this.enemies.getChildren().slice().forEach((e) => e.dissolve());
    EventBus.emit(EVENTS.BOSS_HP, 0, 0);
    this.toast('Kurohime cae... ¡Rescata a Tetsu!');

    this.tweens.add({ targets: this.river, y: GAME_HEIGHT + 10, duration: 2500 });
    this.riverRisen = false;

    this.tetsu = new Katashiro(this, CENTER_PLATFORM.x, CENTER_PLATFORM.y, { isTetsu: true });
    this.katashiros.add(this.tetsu);
  }

  onRescue(k) {
    if (!k.isTetsu) return;
    this.ending = true;
    this.yomi.forceOff();
    this.player.setVelocity(0, 0);
    this.player.body.moves = false;
    GameState.setStatus(STATES.VICTORY);
    StorageManager.submitScore(GameState.score);
    this.time.delayedCall(2200, () => {
      fadeOutThen(this.cameras.main, 1200, () => {
        this.scene.stop('UIScene');
        this.scene.start('IntroScene', { dialog: 'ending', next: { scene: 'VictoryScene' } });
      }, 255, 240, 220);
    });
  }
}
