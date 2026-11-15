import Phaser from 'phaser';
import { PLAYER, POWERUPS } from '../config.js';
import StateMachine from '../managers/StateMachine.js';
import { AudioManager } from '../managers/AudioManager.js';
import { EventBus, EVENTS } from '../managers/EventBus.js';

/**
 * Akari: farol de papel tsukumogami (protagonista).
 *
 * Estados: idle → run → jump → fall → hurt → dead (StateMachine).
 * Incluye "coyote time", "jump buffer" y salto de altura variable para que el
 * control se sienta preciso, algo clave en un juego de plataformas.
 */
export default class Akari extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'akari_idle');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 1).setDepth(20);
    this.body.setSize(16, 34).setOffset(6, 6);
    this.setCollideWorldBounds(true);
    this.setMaxVelocity(PLAYER.speed * 2, 900);

    this.facing = 1;
    this.lastGroundedAt = 0;
    this.jumpBufferedAt = -Infinity;
    this.isJumping = false;
    this.airJumps = 0;
    this.invulnerableUntil = 0;
    this.powerups = { incense: 0, feather: 0, washi: false };
    this.lastPowerupEmit = 0;

    // Aura de incienso y parche de washi (indicadores visuales de power-ups).
    this.aura = scene.add.image(x, y, 'aura').setDepth(19).setBlendMode('ADD').setVisible(false);
    this.shieldIcon = scene.add.image(x, y, 'pu_washi').setDepth(21).setScale(0.8).setVisible(false);

    this.fsm = new StateMachine(this, Akari.STATES, 'idle');
  }

  /** Definición de estados. Dentro de cada función `this` es Akari. */
  static STATES = {
    idle: {
      enter() { this.anims.stop(); this.setTexture('akari_idle'); }
    },
    run: {
      enter() { this.play('akari-run', true); }
    },
    jump: {
      enter() { this.anims.stop(); this.setTexture('akari_jump'); }
    },
    fall: {
      enter() { this.anims.stop(); this.setTexture('akari_fall'); }
    },
    hurt: {
      enter() { this.anims.stop(); this.setTexture('akari_hurt'); },
      update() {
        if (this.fsm.elapsed > 380 && this.isOnGround()) this.fsm.set('idle');
        else if (this.fsm.elapsed > 700) this.fsm.set('fall');
      }
    },
    dead: {
      enter() {
        this.anims.stop();
        this.setTexture('akari_hurt');
        this.setVelocity(0, 0);
        this.body.enable = false;
        this.aura.setVisible(false);
      }
    }
  };

  get isDead() {
    return this.fsm.is('dead');
  }

  get isInvulnerable() {
    return this.scene.time.now < this.invulnerableUntil;
  }

  get hasIncense() {
    return this.scene.time.now < this.powerups.incense;
  }

  isOnGround() {
    return this.body.blocked.down || this.body.touching.down;
  }

  /** Lógica por frame: recibe el estado de InputManager. */
  tick(time, delta, input) {
    this.fsm.update(time, delta);
    this.updatePowerupVisuals(time);
    if (this.isDead) return;

    // Parpadeo durante la invulnerabilidad.
    this.setAlpha(this.isInvulnerable ? (Math.floor(time / 80) % 2 ? 0.35 : 1) : 1);
    if (this.fsm.is('hurt')) return;

    const onGround = this.isOnGround();
    if (onGround) {
      this.lastGroundedAt = time;
      this.isJumping = false;
      this.airJumps = time < this.powerups.feather ? 1 : 0;
    }

    // Movimiento horizontal con aceleración suave.
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const target = dir * PLAYER.speed;
    const lerp = onGround ? 0.28 : 0.14;
    this.setVelocityX(Phaser.Math.Linear(this.body.velocity.x, target, lerp));
    if (Math.abs(this.body.velocity.x) < 4 && dir === 0) this.setVelocityX(0);
    // Sin esto, empujar contra una pared hace que Arcade resuelva el salto como si
    // chocara con un techo y Akari se queda "pegado" al muro.
    if ((dir > 0 && this.body.blocked.right) || (dir < 0 && this.body.blocked.left)) this.setVelocityX(0);
    if (dir !== 0) {
      this.facing = dir;
      this.setFlipX(dir < 0);
    }

    // Salto con buffer + coyote time + doble salto (pluma de tengu).
    if (input.jumpPressed) this.jumpBufferedAt = time;
    const buffered = time - this.jumpBufferedAt <= PLAYER.jumpBuffer;
    const coyote = time - this.lastGroundedAt <= PLAYER.coyoteTime;
    if (buffered) {
      if (onGround || coyote) {
        this.jump(PLAYER.jumpVelocity, 'jump');
      } else if (this.airJumps > 0) {
        this.airJumps--;
        this.jump(PLAYER.jumpVelocity * 0.9, 'doublejump');
        this.scene.events.emit('akari-doublejump', this);
      }
    }
    // Salto variable: soltar el botón antes recorta la altura.
    if (this.isJumping && !input.jump && this.body.velocity.y < -120) {
      this.setVelocityY(this.body.velocity.y * PLAYER.jumpCutFactor);
      this.isJumping = false;
    }

    // Estado visual.
    if (onGround) this.fsm.set(Math.abs(this.body.velocity.x) > 20 ? 'run' : 'idle');
    else this.fsm.set(this.body.velocity.y < 0 ? 'jump' : 'fall');
  }

  jump(velocity, sound) {
    this.setVelocityY(velocity);
    this.isJumping = true;
    this.jumpBufferedAt = -Infinity;
    this.lastGroundedAt = -Infinity; // consume el coyote time
    AudioManager.sfx(sound);
  }

  /** Pequeño rebote tras pisar a un enemigo. */
  bounce() {
    this.setVelocityY(PLAYER.jumpVelocity * 0.7);
    this.isJumping = true;
  }

  /**
   * Intenta aplicar daño. Devuelve true si el golpe se aplicó.
   * El incienso y el parche de washi pueden anularlo.
   */
  hurt(source, { knockback = 1 } = {}) {
    if (this.isDead || this.isInvulnerable) return false;
    const time = this.scene.time.now;
    if (this.powerups.washi) {
      this.powerups.washi = false;
      this.invulnerableUntil = time + 800;
      AudioManager.sfx('shield');
      this.emitPowerups(true);
      return false;
    }
    this.invulnerableUntil = time + PLAYER.invulnerableTime;
    const dir = source && source.x > this.x ? -1 : 1;
    this.setVelocity(dir * PLAYER.knockbackX * knockback, PLAYER.knockbackY);
    this.isJumping = false;
    this.fsm.set('hurt');
    AudioManager.sfx('hurt');
    return true;
  }

  /** Reaparece en un checkpoint. */
  respawn(x, y) {
    this.body.enable = true;
    this.body.reset(x, y);
    this.setVelocity(0, 0);
    this.invulnerableUntil = this.scene.time.now + PLAYER.invulnerableTime;
    this.fsm.set('idle');
  }

  die() {
    this.fsm.set('dead');
  }

  // ----------------------------------------------------------- power-ups
  addPowerup(type) {
    const now = this.scene.time.now;
    if (type === 'washi') this.powerups.washi = true;
    else this.powerups[type] = now + POWERUPS[type].duration;
    if (type === 'feather' && !this.isOnGround()) this.airJumps = 1;
    this.emitPowerups(true);
  }

  updatePowerupVisuals(time) {
    const incense = time < this.powerups.incense;
    this.aura.setVisible(incense && !this.isDead);
    if (incense) {
      this.aura.setPosition(this.x, this.y - 20);
      this.aura.setScale(1 + Math.sin(time / 150) * 0.06);
      this.aura.setAlpha(0.45 + Math.sin(time / 200) * 0.1);
    }
    this.shieldIcon.setVisible(this.powerups.washi && !this.isDead);
    if (this.powerups.washi) this.shieldIcon.setPosition(this.x + 12 * this.facing, this.y - 40);
    if (time - this.lastPowerupEmit > 250) this.emitPowerups();
  }

  emitPowerups(force = false) {
    const now = this.scene.time.now;
    this.lastPowerupEmit = now;
    const list = [];
    if (now < this.powerups.incense) list.push(`${POWERUPS.incense.label} ${Math.ceil((this.powerups.incense - now) / 1000)}s`);
    if (now < this.powerups.feather) list.push(`${POWERUPS.feather.label} ${Math.ceil((this.powerups.feather - now) / 1000)}s`);
    if (this.powerups.washi) list.push(POWERUPS.washi.label);
    const text = list.join(' · ');
    if (force || text !== this.lastPowerupText) {
      this.lastPowerupText = text;
      EventBus.emit(EVENTS.POWERUP, text);
    }
  }

  destroy(fromScene) {
    this.aura?.destroy();
    this.shieldIcon?.destroy();
    super.destroy(fromScene);
  }
}
