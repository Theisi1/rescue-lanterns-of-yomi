import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, FONTS } from '../config.js';
import { DIALOGUES } from '../data/dialogues.js';
import Atmosphere from '../objects/Atmosphere.js';
import { AudioManager } from '../managers/AudioManager.js';
import { GameState, STATES } from '../managers/GameStateManager.js';
import { fadeOutThen } from '../ui/transitions.js';

const SPEAKERS = {
  kohaku: { name: 'Kohaku', texture: 'kohaku', color: '#f0a030' },
  tetsu: { name: 'Tetsu', texture: 'tetsu', color: '#d8d8d8' },
  akari: { name: 'Akari', texture: 'akari_idle', color: '#ffd76a' }
};

/**
 * Escenas narrativas: intro, mensajes de Kohaku entre niveles y final.
 * Texto con efecto máquina de escribir; avanzar con Espacio/Enter/clic, saltar con Esc.
 *
 * data: { dialog: clave de DIALOGUES, next: { scene, data } }
 */
export default class IntroScene extends Phaser.Scene {
  constructor() {
    super('IntroScene');
  }

  create(data) {
    GameState.setStatus(STATES.STORY);
    this.lines = DIALOGUES[data.dialog] || [];
    this.next = data.next || { scene: 'MenuScene' };
    this.index = -1;
    // La instancia de la escena se reutiliza entre diálogos: hay que limpiar el estado anterior.
    this.typing = null;
    this.finishing = false;
    if (data.dialog === 'ending') AudioManager.playMusic('dawn');
    else if (data.dialog === 'intro') AudioManager.playMusic('menu');

    this.add.image(0, 0, data.dialog === 'ending' ? 'sky_cave' : 'sky_bamboo').setOrigin(0);
    this.add.image(0, 0, 'far_bamboo').setOrigin(0).setAlpha(0.5);
    this.atmosphere = new Atmosphere(this, { particle: 'ash', fogAlpha: 0.2 });
    this.add.image(0, 0, 'vignette').setOrigin(0).setDepth(52);

    // Retrato del personaje que habla.
    this.portraitGlow = this.add.image(GAME_WIDTH / 2, 200, 'glow').setScale(4).setBlendMode('ADD').setDepth(60).setAlpha(0.5);
    this.portrait = this.add.image(GAME_WIDTH / 2, 200, 'kohaku').setScale(4).setDepth(61);
    this.tweens.add({ targets: this.portrait, y: 192, yoyo: true, repeat: -1, duration: 1400, ease: 'Sine.InOut' });

    this.add.rectangle(GAME_WIDTH / 2, 410, 820, 150, 0x07040b, 0.9).setStrokeStyle(2, 0xffd76a, 0.8).setDepth(60);
    this.nameText = this.add.text(110, 346, '', { fontFamily: FONTS.title, fontSize: '20px', color: '#f0a030' }).setDepth(61);
    this.bodyText = this.add.text(110, 380, '', {
      fontFamily: FONTS.ui, fontSize: '19px', color: '#f5efe6', wordWrap: { width: 740 }, lineSpacing: 8
    }).setDepth(61);
    this.add.text(GAME_WIDTH - 90, 472, 'Espacio / clic ▸   ·   Esc: saltar', {
      fontFamily: FONTS.ui, fontSize: '12px', color: '#bdb3c7'
    }).setOrigin(1, 0.5).setDepth(61);

    // Se ignoran la autorepetición y las pulsaciones del primer instante: si el jugador
    // llega con Espacio presionado (saltando), no debe saltarse todo el diálogo.
    this.inputReadyAt = this.time.now + 900;
    const accept = (e) => this.time.now >= this.inputReadyAt && !e?.repeat;
    const kb = this.input.keyboard;
    kb.on('keydown-SPACE', (e) => accept(e) && this.advance());
    kb.on('keydown-ENTER', (e) => accept(e) && this.advance());
    kb.on('keydown-ESC', (e) => accept(e) && this.finish());
    this.input.on('pointerdown', () => accept() && this.advance());

    this.cameras.main.fadeIn(500);
    this.advance();
  }

  advance() {
    AudioManager.unlock();
    // Si el texto aún se está escribiendo, se muestra completo.
    if (this.typing) {
      this.typing.remove();
      this.typing = null;
      this.bodyText.setText(this.lines[this.index].text);
      return;
    }
    this.index++;
    if (this.index >= this.lines.length) {
      this.finish();
      return;
    }
    const line = this.lines[this.index];
    const speaker = SPEAKERS[line.speaker];
    this.portrait.setVisible(!!speaker);
    this.portraitGlow.setVisible(!!speaker);
    if (speaker) {
      this.portrait.setTexture(speaker.texture);
      this.nameText.setText(speaker.name).setColor(speaker.color);
    } else {
      this.nameText.setText('');
    }
    AudioManager.sfx('select');

    let i = 0;
    this.bodyText.setText('');
    this.typing = this.time.addEvent({
      delay: 28,
      repeat: line.text.length - 1,
      callback: () => {
        i++;
        this.bodyText.setText(line.text.slice(0, i));
        if (i >= line.text.length) this.typing = null;
      }
    });
  }

  finish() {
    if (this.finishing) return;
    this.finishing = true;
    fadeOutThen(this.cameras.main, 500, () => this.scene.start(this.next.scene, this.next.data));
  }

  update(time, delta) {
    this.atmosphere.update(time, delta);
  }
}
