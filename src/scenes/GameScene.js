import BaseLevelScene from './BaseLevelScene.js';
import LevelManager from '../managers/LevelManager.js';
import Kamaitachi from '../objects/Kamaitachi.js';
import { AudioManager } from '../managers/AudioManager.js';
import { GameState } from '../managers/GameStateManager.js';
import { SCORE, LEVEL_COUNT } from '../config.js';
import { fadeOutThen } from '../ui/transitions.js';

/**
 * Niveles 1-3: Bosque de Bambú, Pueblo de Kurokiri y Sendero de los Mil Torii.
 * El contenido de cada nivel viene de su JSON; esta escena añade la lógica de
 * salida, las ráfagas de Kamaitachi, los sustos y el bucle de torii.
 */
export default class GameScene extends BaseLevelScene {
  constructor() {
    super('GameScene');
  }

  create() {
    const level = GameState.level;
    const data = this.cache.json.get(`level${level}`);
    this.levelData = data;

    this.createGroups();
    const info = new LevelManager(this).build(data);
    this.loopStart = info.loopStart;
    this.totalRescues = info.totalKatashiro;
    this.loopCount = 0;

    this.setupCommon({
      theme: data.theme,
      darkness: data.darkness,
      music: 'level',
      particle: data.particle || 'ash',
      fireflies: !!data.fireflies,
      width: info.width,
      height: info.height,
      start: info.playerStart
    });

    GameState.startLevel();
    this.levelLabel = `Nivel ${level} · ${data.name}`;
    this.levelBanner = { title: data.name, subtitle: data.subtitle };
    this.lastDenyAt = 0;
  }

  update(time, delta) {
    this.updateCommon(time, delta);
  }

  /** Akari llega al torii de salida. */
  reachExit() {
    if (this.ending || this.player.isDead) return;
    const missing = this.totalRescues - this.rescued;
    if (missing > 0) {
      if (this.time.now - this.lastDenyAt > 2500) {
        this.lastDenyAt = this.time.now;
        AudioManager.sfx('deny');
        this.toast(`Aún faltan ${missing} habitante${missing > 1 ? 's' : ''} por rescatar`);
      }
      return;
    }
    this.completeLevel();
  }

  completeLevel() {
    this.ending = true;
    this.yomi.forceOff();
    this.player.setVelocity(0, 0);
    this.player.body.moves = false;
    this.player.fsm.set('idle');

    const bonus = Math.round(this.flame.value) * SCORE.flameBonusFactor;
    this.addScore(bonus, this.player.x, this.player.y - 60);
    this.toast(`¡Nivel completado! Bono de llama +${bonus}`);
    AudioManager.sfx('rescue');

    const finished = GameState.level;
    GameState.completeLevel();
    const next = finished >= LEVEL_COUNT ? 'BossScene' : 'GameScene';

    this.time.delayedCall(1600, () => {
      fadeOutThen(this.cameras.main, 800, () => {
        this.scene.stop('UIScene');
        this.scene.start('IntroScene', { dialog: `after${finished}`, next: { scene: next } });
      });
    });
  }

  // ------------------------------------------------------------------ eventos de nivel
  /** Trigger 'W': una ráfaga de Kamaitachi cruza la pantalla. */
  spawnKamaitachi() {
    AudioManager.sfx('wind');
    this.toast('¡Viento! Algo se acerca...');
    const view = this.cameras.main.worldView;
    const count = GameState.level >= 2 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      this.time.delayedCall(550 + i * 450, () => {
        if (this.ending) return;
        const y = this.player.y - 18 - i * 30;
        this.enemies.add(new Kamaitachi(this, view.right + 60, y, -1));
      });
    }
  }

  /** Trigger 'J': un Yūrei aparece de golpe detrás de un shōji. */
  jumpScare(x, y) {
    const shoji = this.add.image(x, y, 'shoji').setOrigin(0.5, 1).setDepth(3);
    const ghost = this.add.image(x, y - 46, 'yurei_0').setDepth(4).setScale(2.4).setAlpha(0);
    AudioManager.sfx('scare');
    this.cameras.main.shake(300, 0.012);
    this.tweens.add({ targets: ghost, alpha: 0.9, duration: 90, yoyo: true, hold: 500, onComplete: () => ghost.destroy() });
    this.time.delayedCall(4000, () => this.tweens.add({ targets: shoji, alpha: 0, duration: 800, onComplete: () => shoji.destroy() }));
  }

  /**
   * Trigger 'T' (Sendero de los Mil Torii): sin la Visión de Yomi el camino se repite
   * y Akari vuelve al inicio del bucle. Con la Visión activa se ve el torii verdadero.
   */
  toriiLoop(zone) {
    if (!this.loopStart || this.player.isDead || this.player.body.velocity.x <= 0) return;
    if (this.yomi.active) {
      zone.enabled = false;
      AudioManager.sfx('rescue');
      this.toast('Los ojos de los muertos ven la salida verdadera');
      return;
    }
    this.loopCount++;
    AudioManager.sfx('teleport');
    const cam = this.cameras.main;
    fadeOutThen(cam, 220, () => {
      this.player.body.reset(this.loopStart.x, this.loopStart.y - 2);
      cam.fadeIn(400, 20, 0, 10);
      this.toast(this.loopCount >= 2
        ? 'Kohaku: "Mira con los ojos de los muertos... (mantén C / Yomi)"'
        : 'Los torii no terminan...');
    }, 20, 0, 10);
  }
}
