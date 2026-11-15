import Phaser from 'phaser';
import StateMachine from '../managers/StateMachine.js';
import { AudioManager } from '../managers/AudioManager.js';
import { EventBus, EVENTS } from '../managers/EventBus.js';

const MAX_HP = 20;
const PHASE2_HP = 13;
const PHASE3_HP = 6;

/**
 * Dificultad por fase: cuánto tiempo se muestra el espejo, cuánto se oculta
 * y qué tan rápido flota Kurohime. Cada fase es más dura que la anterior.
 */
const PHASE_TUNING = {
  phase1: { exposed: 2000, hidden: 3000, follow: 0.012 },
  phase2: { exposed: 1700, hidden: 3400, follow: 0.016 },
  phase3: { exposed: 1300, hidden: 3800, follow: 0.024 }
};

/**
 * Aspecto y música de cada fase: Kurohime se transforma (más furiosa, más grande,
 * con un aura roja más intensa) y la música acelera.
 */
const PHASE_LOOKS = {
  phase2: { texture: 'kurohime_angry', scale: 1.12, aura: 0.45, music: 'boss2' },
  phase3: { texture: 'kurohime_monster', scale: 1.25, aura: 0.75, music: 'boss3' }
};

/**
 * Kurohime, la Novia de Yomi (jefe final).
 *
 * El destello de Akari siempre le hace daño, pero su punto débil es el espejo del obi:
 * se expone a intervalos y entonces el golpe es doble. Las fases se modelan con StateMachine:
 *  - phase1: abanicos de pétalos negros.
 *  - phase2: el suelo se agrieta; viento helado (cubrirse tras los pilares), abanicos
 *            más rápidos e invocación de Yūrei.
 *  - phase3: el río negro sube; solo quedan plataformas espirituales. Abanicos amplios,
 *            lluvia de pétalos, Yūrei y un espejo que se muestra menos tiempo.
 *
 * La escena (BossScene) implementa los ataques; Kurohime decide cuándo usarlos.
 */
export default class Kurohime extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'kurohime');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);
    this.body.setSize(60, 110).setOffset(18, 14);
    this.setDepth(16);

    this.hp = MAX_HP;
    this.maxHp = MAX_HP;
    this.exposed = false;
    this.invulnerableUntil = 0;
    this.baseY = y;
    this.targetX = x;
    this.attackTimer = 0;
    this.exposeTimer = 2500;
    this.summonTimer = 6000;

    // Aura roja detrás de ella: aparece en la fase 2 y late con fuerza en la 3.
    this.aura = scene.add.image(x, y, 'glow').setDepth(15).setScale(4.5).setBlendMode('ADD').setTint(0xff1030).setAlpha(0);
    this.auraLevel = 0;

    this.mirror = scene.add.image(x, y, 'mirror').setDepth(17).setAlpha(0.35);
    this.mirrorGlow = scene.add.image(x, y, 'light').setDepth(17).setScale(0.35).setBlendMode('ADD').setTint(0xff9ad5).setAlpha(0);

    this.fsm = new StateMachine(this, Kurohime.STATES, 'intro');
    EventBus.emit(EVENTS.BOSS_HP, this.hp, this.maxHp);
  }

  static STATES = {
    intro: {
      enter() {
        this.setAlpha(0);
        this.scene.tweens.add({ targets: this, alpha: 1, duration: 1600 });
      },
      update() {
        if (this.fsm.elapsed > 1800) this.fsm.set('phase1');
      }
    },

    phase1: {
      enter() { this.attackTimer = 1200; },
      update(time, delta) {
        this.attackTimer -= delta;
        if (this.attackTimer <= 0) {
          this.scene.petalFan(this.x, this.y + 10, 5, 50, 200);
          this.attackTimer = 2000;
        }
      }
    },

    phase2: {
      enter() {
        this.roar();
        this.transform('phase2');
        this.scene.enterPhase2();
        this.attackTimer = 2800;
        this.windCycle = 0;
      },
      update(time, delta) {
        this.attackTimer -= delta;
        this.summonTimer -= delta;
        if (this.attackTimer <= 0) {
          // Alterna: ráfaga de viento helado y abanico de pétalos.
          if (this.windCycle % 2 === 0) {
            const dir = this.scene.player.x < 480 ? -1 : 1; // sopla hacia donde está Akari
            this.targetX = dir < 0 ? 830 : 130;
            this.scene.startWind(dir, 2400);
            this.attackTimer = 4200;
          } else {
            this.scene.petalFan(this.x, this.y + 10, 6, 55, 210);
            this.attackTimer = 1800;
          }
          this.windCycle++;
        }
        if (this.summonTimer <= 0) {
          this.scene.summonYurei();
          this.summonTimer = 7000;
        }
      }
    },

    phase3: {
      enter() {
        this.roar();
        this.transform('phase3');
        this.scene.enterPhase3();
        this.attackTimer = 3800; // tiempo para subir a las plataformas mientras sube el río
        this.attackCycle = 0;
        this.summonTimer = 9000;
      },
      update(time, delta) {
        this.attackTimer -= delta;
        this.summonTimer -= delta;
        if (this.attackTimer <= 0) {
          // Alterna: abanico amplio dirigido y lluvia de pétalos desde arriba.
          if (this.attackCycle % 2 === 0) {
            this.scene.petalFan(this.x, this.y + 10, 8, 80, 200);
            this.attackTimer = 1700;
          } else {
            this.scene.petalRain(12, 190);
            this.attackTimer = 2300;
          }
          this.attackCycle++;
        }
        if (this.summonTimer <= 0) {
          this.scene.summonYurei();
          this.summonTimer = 10000;
        }
      }
    },

    defeated: {
      enter() {
        this.exposed = false;
        this.body.enable = false;
        this.mirrorGlow.setAlpha(0);
        this.auraLevel = 0;
        this.scene.tweens.add({ targets: this.aura, alpha: 0, duration: 800 });
        AudioManager.sfx('bossRoar');
        this.scene.cameras.main.shake(900, 0.01);
        this.scene.tweens.add({
          targets: [this, this.mirror],
          alpha: 0,
          scaleY: 1.6,
          scaleX: 0.3,
          y: '-=60',
          duration: 1800,
          ease: 'Quad.In',
          onComplete: () => this.scene.onBossDefeated()
        });
      }
    }
  };

  get isDefeated() {
    return this.fsm.is('defeated');
  }

  /** Cambio de aspecto al entrar en una fase: destello blanco, crece y cambia de cara. */
  transform(phaseName) {
    const look = PHASE_LOOKS[phaseName];
    AudioManager.switchMusic(look.music);
    this.auraLevel = look.aura;
    this.setTintFill(0xffffff);
    this.scene.tweens.add({ targets: this, scale: look.scale, duration: 700, ease: 'Back.Out' });
    this.scene.time.delayedCall(250, () => {
      if (!this.active) return;
      this.setTexture(look.texture);
      this.clearTint();
    });
  }

  roar() {
    AudioManager.sfx('bossRoar');
    this.scene.cameras.main.shake(500, 0.008);
    this.invulnerableUntil = this.scene.time.now + 1500;
    this.exposed = false;
  }

  update(time, delta) {
    this.fsm.update(time, delta);
    if (this.isDefeated) return;

    // Flota de un lado a otro sobre la arena.
    if (!this.scene.windActive && Math.abs(this.x - this.targetX) < 10) {
      this.targetX = Phaser.Math.Between(200, 760);
    }
    const tuning = PHASE_TUNING[this.fsm.currentName] || PHASE_TUNING.phase1;
    this.x = Phaser.Math.Linear(this.x, this.targetX, tuning.follow);
    this.y = this.baseY + Math.sin(time / 600) * 14;
    this.setFlipX(this.scene.player.x < this.x);

    // El aura late más rápido cuanto más avanzada la fase.
    const beat = this.fsm.is('phase3') ? 90 : 200;
    this.aura.setPosition(this.x, this.y).setAlpha(this.auraLevel * (0.75 + Math.sin(time / beat) * 0.25));

    this.mirror.setPosition(this.x, this.y + 6);
    this.mirrorGlow.setPosition(this.x, this.y + 6);

    if (this.fsm.is('intro')) return;

    // Ciclo del punto débil: el espejo se expone unos segundos.
    this.exposeTimer -= delta;
    if (this.exposeTimer <= 0) {
      this.exposed = !this.exposed;
      this.exposeTimer = this.exposed ? tuning.exposed : tuning.hidden;
      if (this.exposed) AudioManager.sfx('select');
    }
    const glow = this.exposed ? 0.75 + Math.sin(time / 60) * 0.25 : 0;
    this.mirrorGlow.setAlpha(glow);
    this.mirror.setAlpha(this.exposed ? 1 : 0.3);
  }

  /**
   * El destello de Akari siempre la daña; si el espejo está expuesto, el golpe es doble.
   * Devuelve { damage, mirror } o null si no recibió daño.
   */
  hit() {
    if (this.isDefeated || this.scene.time.now < this.invulnerableUntil) return null;
    const mirror = this.exposed;
    const damage = mirror ? 2 : 1;
    this.hp = Math.max(0, this.hp - damage);
    if (mirror) {
      this.exposed = false;
      this.exposeTimer = 2600;
    }
    this.invulnerableUntil = this.scene.time.now + 500;
    AudioManager.sfx('bossHit');
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(120, () => this.clearTint());
    EventBus.emit(EVENTS.BOSS_HP, this.hp, this.maxHp);

    if (this.hp <= 0) this.fsm.set('defeated');
    else if (this.hp <= PHASE3_HP) this.fsm.set('phase3');
    else if (this.hp <= PHASE2_HP) this.fsm.set('phase2');
    return { damage, mirror };
  }

  destroy(fromScene) {
    this.mirror?.destroy();
    this.mirrorGlow?.destroy();
    this.aura?.destroy();
    super.destroy(fromScene);
  }
}
