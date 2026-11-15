import Phaser from 'phaser';
import { FONTS, GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import FlameBar from '../ui/FlameBar.js';
import BossBar from '../ui/BossBar.js';
import TouchControls from '../ui/TouchControls.js';
import { EventBus, EVENTS } from '../managers/EventBus.js';
import { AudioManager } from '../managers/AudioManager.js';

/**
 * HUD superpuesto a la escena de juego (requisito 4.3).
 * Mechas · barra de llama · puntaje · rescatados · nivel · power-up · pausa · mute,
 * más pistas de Kohaku, avisos, barra del jefe y controles táctiles.
 *
 * Solo escucha eventos del EventBus: no conoce la lógica del juego.
 */
export default class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  create(data) {
    const text = (x, y, str, size = 16, color = '#f5efe6') =>
      this.add.text(x, y, str, { fontFamily: FONTS.ui, fontSize: `${size}px`, color, stroke: '#000', strokeThickness: 3 });

    // Panel superior semitransparente: asegura contraste sobre el juego oscuro.
    this.add.rectangle(0, 0, GAME_WIDTH, 50, 0x07040b, 0.72).setOrigin(0);
    this.add.rectangle(0, 50, GAME_WIDTH, 2, 0xffd76a, 0.35).setOrigin(0);

    this.lifeIcons = Array.from({ length: 5 }, (_, i) => this.add.image(20 + i * 20, 17, 'pu_wick').setScale(1));
    this.flameBar = new FlameBar(this, 14, 38, 150, 10);
    this.scoreText = text(320, 8, 'Puntos 0', 16, '#ffd76a');
    this.rescuedText = text(320, 28, 'Rescatados 0/0', 14);
    this.levelText = text(GAME_WIDTH / 2 + 60, 8, '', 15).setOrigin(0, 0);
    this.powerText = text(GAME_WIDTH / 2 + 60, 28, '', 13, '#cfc3ff').setOrigin(0, 0);

    // Botones de pausa y mute (ratón / táctil).
    this.pauseBtn = this.iconButton(GAME_WIDTH - 30, 25, '⏸', () => EventBus.emit(EVENTS.PAUSE_REQUEST));
    this.muteBtn = this.iconButton(GAME_WIDTH - 74, 25, AudioManager.muted ? '🔇' : '🔊', () => AudioManager.toggleMute());

    // Indicador de la Visión de Yomi.
    this.yomiText = text(GAME_WIDTH / 2, 66, '— VISIÓN DE YOMI —', 16, '#ff9ad5').setOrigin(0.5).setVisible(false);

    // Caja de pistas de Kohaku: arriba, bajo el HUD, para no tapar a Akari (que va por el suelo).
    this.hintBox = this.add.container(GAME_WIDTH / 2, 118).setAlpha(0);
    const hintBg = this.add.rectangle(0, 0, 620, 76, 0x07040b, 0.88).setStrokeStyle(2, 0xf0a030, 0.9);
    const fox = this.add.image(-278, 0, 'kohaku').setScale(1.5);
    this.hintText = this.add.text(-245, 0, '', {
      fontFamily: FONTS.ui, fontSize: '15px', color: '#fff3d6', wordWrap: { width: 540 }, lineSpacing: 4
    }).setOrigin(0, 0.5);
    this.hintBox.add([hintBg, fox, this.hintText]);

    // Avisos breves y cartel de inicio de nivel.
    this.toastText = text(GAME_WIDTH / 2, 176, '', 17, '#ffffff').setOrigin(0.5).setAlpha(0);
    this.bannerTitle = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, '', {
      fontFamily: FONTS.title, fontSize: '44px', color: '#ffe9a8', stroke: '#000', strokeThickness: 6
    }).setOrigin(0.5).setAlpha(0);
    this.bannerSub = text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, '', 18, '#ff9aa8').setOrigin(0.5).setAlpha(0);

    this.bossBar = new BossBar(this, 82);
    if (data.boss) this.yomiText.setY(108); // bajo la barra del jefe
    if (!data.boss) this.bossBar.set(0, 0);

    this.fpsText = text(GAME_WIDTH - 110, 56, '', 12, '#9effa0').setVisible(false);
    this.add.text(GAME_WIDTH - 8, GAME_HEIGHT - 6, 'P pausa · M sonido · F fps', {
      fontFamily: FONTS.ui, fontSize: '11px', color: '#bdb3c7'
    }).setOrigin(1, 1).setAlpha(0.8);

    if (this.sys.game.device.input.touch) new TouchControls(this);

    this.bindEvents();
    EventBus.emit(EVENTS.UI_READY);
  }

  iconButton(x, y, label, onClick) {
    const bg = this.add.circle(x, y, 18, 0x1a0e16, 0.9).setStrokeStyle(2, 0xffd76a, 0.8).setInteractive({ useHandCursor: true });
    const t = this.add.text(x, y, label, { fontSize: '18px', color: '#ffe9a8' }).setOrigin(0.5);
    bg.on('pointerdown', () => {
      AudioManager.unlock();
      onClick();
    });
    return t;
  }

  bindEvents() {
    const handlers = {
      [EVENTS.FLAME]: (v, max) => this.flameBar.set(v, max),
      [EVENTS.LIVES]: (lives) => this.lifeIcons.forEach((icon, i) => icon.setVisible(i < lives)),
      [EVENTS.SCORE]: (score) => this.scoreText.setText(`Puntos ${score}`),
      [EVENTS.RESCUED]: (n, total) => this.rescuedText.setText(`Rescatados ${n}/${total}`),
      [EVENTS.LEVEL]: (label) => this.levelText.setText(label),
      [EVENTS.POWERUP]: (label) => this.powerText.setText(label),
      [EVENTS.YOMI]: (active) => this.yomiText.setVisible(active),
      [EVENTS.MUTE]: (muted) => this.muteBtn.setText(muted ? '🔇' : '🔊'),
      [EVENTS.BOSS_HP]: (hp, max) => this.bossBar.set(hp, max),
      [EVENTS.HINT]: (msg) => this.showHint(msg),
      [EVENTS.TOAST]: (msg) => this.showToast(msg),
      [EVENTS.BANNER]: (b) => this.showBanner(b)
    };
    Object.entries(handlers).forEach(([evt, fn]) => EventBus.on(evt, fn));
    this.events.once('shutdown', () => Object.entries(handlers).forEach(([evt, fn]) => EventBus.off(evt, fn)));
  }

  showHint(msg) {
    this.hintText.setText(msg);
    this.tweens.killTweensOf(this.hintBox);
    this.hintBox.setAlpha(0);
    // Tiempo de lectura según la longitud del texto (mínimo 7 s).
    const hold = Math.max(7000, msg.length * 75);
    this.tweens.add({ targets: this.hintBox, alpha: 1, duration: 250, hold, yoyo: true });
  }

  showToast(msg) {
    this.toastText.setText(msg);
    this.tweens.killTweensOf(this.toastText);
    this.toastText.setAlpha(1).setY(176);
    this.tweens.add({ targets: this.toastText, alpha: 0, y: 166, delay: 2600, duration: 500 });
  }

  showBanner({ title, subtitle }) {
    this.bannerTitle.setText(title);
    this.bannerSub.setText(subtitle || '');
    [this.bannerTitle, this.bannerSub].forEach((t) => {
      t.setAlpha(0);
      this.tweens.add({ targets: t, alpha: 1, duration: 600, hold: 1600, yoyo: true });
    });
  }

  update(time) {
    this.flameBar.update(time);
    const showFps = !!this.registry.get('showFps');
    this.fpsText.setVisible(showFps);
    if (showFps) this.fpsText.setText(`FPS ${Math.round(this.game.loop.actualFps)}`);
  }
}
