import Phaser from 'phaser';
import { FLAME, SCORE, FONTS } from '../config.js';
import Akari from '../objects/Akari.js';
import ParallaxBackground from '../objects/ParallaxBackground.js';
import Atmosphere from '../objects/Atmosphere.js';
import FlameManager from '../managers/FlameManager.js';
import YomiVisionManager from '../managers/YomiVisionManager.js';
import LightingManager from '../managers/LightingManager.js';
import InputManager from '../managers/InputManager.js';
import CollisionManager from '../physics/CollisionManager.js';
import { AudioManager } from '../managers/AudioManager.js';
import { GameState, STATES } from '../managers/GameStateManager.js';
import { StorageManager } from '../managers/StorageManager.js';
import { EventBus, EVENTS } from '../managers/EventBus.js';
import { fadeOutThen } from '../ui/transitions.js';

/**
 * Lógica común a GameScene (niveles 1-3) y BossScene (Puerta de Yomi):
 * jugador, llama, Visión de Yomi, iluminación, daño, muerte/reaparición,
 * puntaje, pausa y comunicación con el HUD.
 *
 * Las subclases solo construyen su escenario y añaden su lógica específica.
 */
export default class BaseLevelScene extends Phaser.Scene {
  /** Grupos de física que LevelManager / BossScene llenan. */
  createGroups() {
    const add = this.physics.add;
    this.solids = add.staticGroup();
    this.platforms = add.staticGroup();
    this.spirits = add.staticGroup();
    this.enemies = add.group({ allowGravity: false, immovable: true, runChildUpdate: true });
    this.pickups = add.group({ allowGravity: false });
    this.katashiros = add.group({ allowGravity: false });
    this.checkpoints = [];
    this.kohakus = [];
    this.triggers = [];
    this.yomiRevealables = [];
    this.exitGate = null;
    this.rescued = 0;
    this.totalRescues = 0;
    this.ending = false;
    this.lights = [];
  }

  /**
   * @param {object} opts { theme, darkness, music, particle, fireflies, width, height, start, yomiDrain }
   */
  setupCommon(opts) {
    const { width, height, start } = opts;
    this.physics.world.setBounds(0, 0, width, height);
    this.physics.world.setBoundsCollision(true, true, false, false); // sin techo ni suelo: se puede caer
    // Separar primero en X evita que Akari se quede pegado al saltar junto a una pared.
    this.physics.world.forceX = true;

    this.background = new ParallaxBackground(this, opts.theme);
    this.atmosphere = new Atmosphere(this, { particle: opts.particle, fireflies: opts.fireflies });

    this.player = new Akari(this, start.x, start.y);
    this.respawnPoint = { ...start };
    this.flame = new FlameManager(this);
    this.inputs = new InputManager(this);
    CollisionManager.setup(this);

    this.yomi = new YomiVisionManager(this, this.flame, {
      spirits: this.spirits,
      collider: this.spiritCollider,
      drainPerSec: opts.yomiDrain
    });
    this.yomiRevealables.forEach((o) => this.yomi.addRevealable(o));
    this.lighting = new LightingManager(this, { alpha: opts.darkness });

    const cam = this.cameras.main;
    cam.setBounds(0, 0, width, height);
    cam.startFollow(this.player, true, 0.12, 0.12, 0, 40);
    cam.setDeadzone(60, 80);
    cam.fadeIn(500);

    // Partículas reutilizables (polvo y chispas).
    this.dust = this.add.particles(0, 0, 'dust', {
      speed: { min: 30, max: 90 }, angle: { min: 200, max: 340 }, lifespan: 500,
      scale: { start: 1, end: 0 }, gravityY: 300, emitting: false
    }).setDepth(11);
    this.sparks = this.add.particles(0, 0, 'spark', {
      speed: { min: 60, max: 200 }, lifespan: 600, scale: { start: 1, end: 0 },
      tint: [0xffd76a, 0xffffff, 0xff9a2a], blendMode: 'ADD', emitting: false
    }).setDepth(30);

    this.nextFlashAt = 0;
    this.intensityTimer = 0;
    this.lastToastAt = 0;
    this.setupKeys();
    this.setupUI(opts.boss);

    GameState.setStatus(STATES.PLAYING);
    AudioManager.playMusic(opts.music);
  }

  setupKeys() {
    const kb = this.input.keyboard;
    kb.on('keydown-P', () => this.pauseGame());
    kb.on('keydown-ESC', () => this.pauseGame());
    kb.on('keydown-M', () => AudioManager.toggleMute());
    kb.on('keydown-F', () => this.registry.set('showFps', !this.registry.get('showFps')));
  }

  setupUI(isBoss) {
    const onPause = () => this.pauseGame();
    const onUiReady = () => this.emitHud();
    const onResume = () => {
      this.inputs.reset();
      GameState.setStatus(STATES.PLAYING);
    };
    const onDoubleJump = (p) => this.dust.emitParticleAt(p.x, p.y, 6);
    EventBus.on(EVENTS.PAUSE_REQUEST, onPause);
    EventBus.on(EVENTS.UI_READY, onUiReady);
    this.events.on('resume', onResume);
    this.events.on('akari-doublejump', onDoubleJump);

    // Los emisores sobreviven a los reinicios de escena: hay que quitar los listeners.
    this.events.once('shutdown', () => {
      EventBus.off(EVENTS.PAUSE_REQUEST, onPause);
      EventBus.off(EVENTS.UI_READY, onUiReady);
      this.events.off('resume', onResume);
      this.events.off('akari-doublejump', onDoubleJump);
      AudioManager.setYomi(false);
      AudioManager.setIntensity(0);
    });

    this.scene.launch('UIScene', { boss: !!isBoss });
    this.scene.bringToTop('UIScene');
  }

  /** Envía el estado completo al HUD (al crearse la UIScene). */
  emitHud() {
    EventBus.emit(EVENTS.SCORE, GameState.score);
    EventBus.emit(EVENTS.LIVES, GameState.lives);
    EventBus.emit(EVENTS.RESCUED, this.rescued, this.totalRescues);
    EventBus.emit(EVENTS.LEVEL, this.levelLabel);
    this.flame.emit();
    this.player.emitPowerups(true);
    if (this.levelBanner) EventBus.emit(EVENTS.BANNER, this.levelBanner);
    this.levelBanner = null;
  }

  // ------------------------------------------------------------------ bucle
  updateCommon(time, delta) {
    const input = this.inputs.update();
    if (!this.ending) {
      this.player.tick(time, delta, input);
      if (!this.player.isDead) {
        if (input.flashPressed) this.tryFlash();
        this.yomi.update(input.yomi, delta);
      }
      this.flame.update(delta);
      if (!this.player.isDead) {
        if (this.flame.isEmpty) this.loseLife();
        else if (this.player.y > this.physics.world.bounds.height + 80) this.loseLife();
      }
      this.updateIntensity(delta);
    }
    this.background.update();
    this.atmosphere.update(time, delta);
    this.lighting.render(this.collectLights(time), delta);
  }

  /** Lista de luces del frame (coordenadas de mundo). */
  collectLights(time) {
    const lights = this.lights;
    lights.length = 0;
    const p = this.player;
    if (!p.isDead || p.alpha > 0.1) {
      const flicker = 1 + Math.sin(time / 70) * 0.03 + Math.sin(time / 23) * 0.015;
      lights.push({ x: p.x, y: p.y - 22, r: this.flame.lightRadius * flicker });
    }
    this.checkpoints.forEach((cp) => {
      if (cp.lit) lights.push({ x: cp.x, y: cp.y - 26, r: 120 });
      else lights.push({ x: cp.x, y: cp.y - 20, r: 40, a: 0.5 });
    });
    this.katashiros.getChildren().forEach((k) => {
      if (!k.rescued) lights.push({ x: k.x, y: k.y - 16, r: 46, a: 0.55 });
    });
    this.enemies.getChildren().forEach((e) => {
      if (e.texture.key === 'hitodama' && !e.dead) lights.push({ x: e.x, y: e.y, r: 56, a: 0.8 });
    });
    this.pickups.getChildren().forEach((item) => {
      if (item.body?.enable) lights.push({ x: item.x, y: item.y, r: 26, a: 0.6 });
    });
    this.kohakus.forEach((k) => lights.push({ x: k.x, y: k.y - 12, r: 48, a: 0.6 }));
    if (this.exitGate) lights.push({ x: this.exitGate.x, y: this.exitGate.y - 60, r: 110, a: 0.7 });
    this.extraLights?.(lights, time);
    return lights;
  }

  /** La música se intensifica según la cercanía de los espíritus. */
  updateIntensity(delta) {
    this.intensityTimer -= delta;
    if (this.intensityTimer > 0) return;
    this.intensityTimer = 300;
    let nearest = Infinity;
    this.enemies.getChildren().forEach((e) => {
      if (!e.dead) nearest = Math.min(nearest, Phaser.Math.Distance.Between(e.x, e.y, this.player.x, this.player.y));
    });
    AudioManager.setIntensity(Phaser.Math.Clamp(1 - (nearest - 80) / 400, 0, 1));
  }

  // ------------------------------------------------------------------ acciones
  /** Destello: ilumina la pantalla, paraliza espíritus y gasta llama. */
  tryFlash() {
    const now = this.time.now;
    if (now < this.nextFlashAt) return;
    if (!this.flame.spend(FLAME.flashCost)) {
      AudioManager.sfx('deny');
      this.toast('No queda llama suficiente para un destello');
      return;
    }
    this.nextFlashAt = now + FLAME.flashCooldown;
    this.lighting.flash();
    this.cameras.main.flash(120, 255, 230, 170);
    AudioManager.sfx('flash');
    this.sparks.emitParticleAt(this.player.x, this.player.y - 22, 18);

    const view = this.cameras.main.worldView;
    this.enemies.getChildren().slice().forEach((e) => {
      if (!e.dead && view.contains(e.x, e.y)) e.onFlash();
    });
    this.onFlash?.();
  }

  onEnemyContact(player, enemy) {
    if (enemy.dead || player.isDead) return;
    // Pisar a un Yūrei paralizado lo disuelve (rebote).
    if (enemy.canBeStomped && player.body.velocity.y > 0 && player.body.bottom < enemy.body.center.y + 6) {
      enemy.dissolve();
      player.bounce();
      AudioManager.sfx('stomp');
      this.sparks.emitParticleAt(enemy.x, enemy.y, 10);
      this.addScore(enemy.scoreValue || SCORE.stomp, enemy.x, enemy.y - 20);
      this.onEnemyKilled(enemy);
      return;
    }
    if (enemy.harmful && !enemy.isStunned) this.damagePlayer(enemy.damage, enemy, enemy.knockback);
  }

  /** Al disolver un espíritu, su luz vuelve a Akari: recupera algo de llama. */
  onEnemyKilled(enemy) {
    this.flame.add(FLAME.killReward);
    this.showFlameGain(FLAME.killReward, enemy.x, enemy.y);
  }

  /** Texto flotante "+N llama" en naranja (distinto del amarillo del puntaje). */
  showFlameGain(amount, x, y) {
    const t = this.add.text(x, y - 40, `+${amount} llama`, {
      fontFamily: FONTS.ui, fontSize: '14px', color: '#ff9a2a', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(60);
    this.tweens.add({ targets: t, y: y - 70, alpha: 0, duration: 900, onComplete: () => t.destroy() });
  }

  damagePlayer(amount, source, knockback = 1) {
    if (this.player.hasIncense && source) return; // los espíritus no se acercan al incienso
    if (!this.player.hurt(source, { knockback })) return;
    this.cameras.main.shake(160, 0.006);
    if (this.flame.damage(amount)) this.loseLife();
  }

  collectPickup(item) {
    if (!item.body?.enable) return;
    switch (item.type) {
      case 'omamori':
        this.addScore(SCORE.omamori, item.x, item.y - 10);
        AudioManager.sfx('pickup');
        break;
      case 'oil':
        this.flame.add(FLAME.oilValue);
        AudioManager.sfx('oil');
        this.toast('Aceite: la llama se aviva');
        break;
      case 'wick':
        GameState.gainLife();
        AudioManager.sfx('powerup');
        this.toast('¡Mecha nueva! +1 vida');
        break;
      default:
        this.player.addPowerup(item.type);
        AudioManager.sfx('powerup');
        this.toast({ incense: 'Incienso sagrado: los espíritus no se acercan', washi: 'Parche de washi: absorbe un golpe', feather: 'Pluma de tengu: doble salto' }[item.type]);
    }
    item.collect();
  }

  rescueKatashiro(k) {
    if (!k.rescue()) return;
    this.rescued++;
    EventBus.emit(EVENTS.RESCUED, this.rescued, this.totalRescues);
    this.addScore(SCORE.rescue, k.x, k.y - 40);
    AudioManager.sfx('rescue');
    this.sparks.emitParticleAt(k.x, k.y - 16, 14);
    this.onRescue?.(k);
  }

  activateCheckpoint(cp) {
    if (!cp.light()) return;
    this.respawnPoint = { x: cp.x, y: cp.y - 2 };
    this.flame.add(FLAME.checkpointBonus);
    AudioManager.sfx('checkpoint');
    this.sparks.emitParticleAt(cp.x, cp.y - 26, 12);
    this.toast('Farol de piedra encendido: punto de reaparición');
  }

  showHint(kohaku) {
    const text = kohaku.speak(this.time.now);
    if (text) EventBus.emit(EVENTS.HINT, text);
  }

  addScore(points, x, y) {
    GameState.addScore(points);
    if (x === undefined) return;
    const t = this.add.text(x, y, `+${points}`, {
      fontFamily: FONTS.ui, fontSize: '16px', color: '#ffd76a', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(60);
    this.tweens.add({ targets: t, y: y - 30, alpha: 0, duration: 800, onComplete: () => t.destroy() });
  }

  toast(text) {
    EventBus.emit(EVENTS.TOAST, text);
  }

  // ------------------------------------------------------------------ vida y muerte
  /** La llama se apagó (o Akari cayó): pierde una mecha. */
  loseLife() {
    const p = this.player;
    if (p.isDead || this.ending) return;
    p.die();
    this.yomi.forceOff();
    AudioManager.sfx('loseLife');
    this.cameras.main.shake(250, 0.01);
    this.tweens.add({ targets: p, alpha: 0, duration: 700 });
    this.dust.emitParticleAt(p.x, p.y - 10, 12);

    const lives = GameState.loseLife();
    if (lives <= 0) {
      this.time.delayedCall(1300, () => this.gameOver());
      return;
    }
    this.time.delayedCall(1100, () => {
      fadeOutThen(this.cameras.main, 250, () => {
        p.setAlpha(1);
        p.respawn(this.respawnPoint.x, this.respawnPoint.y);
        this.flame.set(FLAME.respawnValue);
        this.onRespawn?.();
        this.cameras.main.fadeIn(300);
      });
    });
  }

  gameOver() {
    GameState.setStatus(STATES.GAME_OVER);
    StorageManager.submitScore(GameState.score);
    this.scene.stop('UIScene');
    this.scene.start('GameOverScene');
  }

  pauseGame() {
    if (this.ending || GameState.status !== STATES.PLAYING) return;
    GameState.setStatus(STATES.PAUSED);
    this.yomi.forceOff();
    this.scene.pause();
    this.scene.pause('UIScene');
    this.scene.launch('PauseScene', { from: this.scene.key });
    this.scene.bringToTop('PauseScene'); // por encima del HUD
  }
}
