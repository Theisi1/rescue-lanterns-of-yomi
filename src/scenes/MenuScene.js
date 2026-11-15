import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, FONTS, BOSS_LEVEL } from '../config.js';
import MenuList from '../ui/MenuList.js';
import Atmosphere from '../objects/Atmosphere.js';
import { AudioManager } from '../managers/AudioManager.js';
import { StorageManager } from '../managers/StorageManager.js';
import { GameState, STATES } from '../managers/GameStateManager.js';
import { fadeOutThen } from '../ui/transitions.js';

/** Texto de controles: se muestra en el menú (instrucciones visibles, requisito 4.9). */
export const CONTROLS_TEXT = [
  ['Moverse', '← → / A D', '◀ ▶'],
  ['Saltar / doble salto', '↑ / W / Espacio', 'Saltar'],
  ['Destello (ataque)', 'X / J', 'Luz'],
  ['Visión de Yomi (mantener)', 'C / K / Shift', 'Yomi'],
  ['Pausa', 'P / Esc', '⏸'],
  ['Silenciar', 'M', '🔊'],
  ['Mostrar FPS', 'F', '—']
];

/**
 * Menú principal: torii bajo la niebla y una fila de faroles apagados;
 * solo uno está encendido y parpadea (Akari).
 */
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    GameState.setStatus(STATES.MENU);
    AudioManager.playMusic('menu');

    this.add.image(0, 0, 'sky_shrine').setOrigin(0);
    this.add.image(0, 0, 'far_shrine').setOrigin(0).setAlpha(0.9);
    this.add.image(GAME_WIDTH / 2, 470, 'torii').setOrigin(0.5, 1).setScale(3.2).setAlpha(0.85);
    this.add.rectangle(0, 470, GAME_WIDTH, 70, 0x0a060c).setOrigin(0);
    this.atmosphere = new Atmosphere(this, { particle: 'petal', fogAlpha: 0.25 });
    this.add.image(0, 0, 'vignette').setOrigin(0).setDepth(52);

    // Fila de faroles: solo Akari brilla.
    const akariIndex = 4;
    for (let i = 0; i < 9; i++) {
      const x = 120 + i * 90;
      const key = i === akariIndex ? 'akari_idle' : 'lantern_off';
      const lantern = this.add.image(x, 470, key).setOrigin(0.5, 1).setScale(1.4).setDepth(54);
      if (i === akariIndex) {
        this.akariGlow = this.add.image(x, 440, 'glow').setScale(3).setBlendMode('ADD').setDepth(53);
        this.tweens.add({ targets: lantern, y: 466, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.InOut' });
      }
    }

    this.add.text(GAME_WIDTH / 2, 70, 'RESCUE', {
      fontFamily: FONTS.title, fontSize: '64px', color: '#ffe9a8', stroke: '#2a0610', strokeThickness: 8
    }).setOrigin(0.5).setDepth(60);
    this.add.text(GAME_WIDTH / 2, 124, 'Lanterns of Yomi', {
      fontFamily: FONTS.title, fontSize: '30px', color: '#ff5a6a', stroke: '#000', strokeThickness: 6
    }).setOrigin(0.5).setDepth(60);

    const savedLevel = StorageManager.getLevel();
    const items = [{ label: 'Jugar', onSelect: () => this.startGame(1) }];
    if (savedLevel > 1) {
      const name = savedLevel >= BOSS_LEVEL ? 'Puerta de Yomi' : `Nivel ${savedLevel}`;
      items.push({ label: `Continuar (${name})`, onSelect: () => this.startGame(savedLevel) });
    }
    items.push(
      { label: 'Controles', onSelect: () => this.toggleControls(true) },
      { label: () => `Sonido: ${AudioManager.muted ? 'OFF' : 'ON'}`, onSelect: () => AudioManager.toggleMute() }
    );
    this.menu = new MenuList(this, GAME_WIDTH / 2, 190, items, { depth: 60 });

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, `Récord: ${StorageManager.getHighScore()}`, {
      fontFamily: FONTS.ui, fontSize: '18px', color: '#ffd76a', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(60);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 8, '↑ ↓ y Enter para elegir · o toca/haz clic en una opción', {
      fontFamily: FONTS.ui, fontSize: '12px', color: '#d8cfe0'
    }).setOrigin(0.5, 1).setDepth(60);

    this.buildControlsPanel();
    this.input.keyboard.on('keydown-ESC', () => this.toggleControls(false));
  }

  buildControlsPanel() {
    const c = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(200).setVisible(false);
    const bg = this.add.rectangle(0, 0, 640, 380, 0x07040b, 0.96).setStrokeStyle(2, 0xffd76a).setInteractive();
    const title = this.add.text(0, -160, 'Controles', { fontFamily: FONTS.title, fontSize: '28px', color: '#ffe9a8' }).setOrigin(0.5);
    const style = { fontFamily: FONTS.ui, fontSize: '16px', color: '#f5efe6' };
    const head = { ...style, color: '#ffd76a' };
    const rows = [this.add.text(-290, -118, 'Acción', head), this.add.text(-40, -118, 'Teclado', head), this.add.text(170, -118, 'Táctil', head)];
    CONTROLS_TEXT.forEach(([action, key, touch], i) => {
      const y = -88 + i * 30;
      rows.push(this.add.text(-290, y, action, style), this.add.text(-40, y, key, style), this.add.text(170, y, touch, style));
    });
    const tip = this.add.text(0, 140, 'La llama es tu vida, tu luz y tu arma: ¿ver más o vivir más?\nRescata a todos los katashiro para abrir el torii de salida.', {
      ...style, fontSize: '14px', color: '#ff9aa8', align: 'center'
    }).setOrigin(0.5);
    const close = this.add.text(0, 175, '[ Esc / clic para cerrar ]', { ...style, fontSize: '13px', color: '#bdb3c7' }).setOrigin(0.5);
    c.add([bg, title, ...rows, tip, close]);
    bg.on('pointerdown', () => this.toggleControls(false));
    this.controlsPanel = c;
  }

  toggleControls(show) {
    if (show === this.controlsPanel.visible) return;
    this.controlsPanel.setVisible(show);
    // Retrasamos reactivar el menú para que el Enter/clic que cierra el panel no elija otra opción.
    this.time.delayedCall(show ? 0 : 120, () => this.menu.setVisible(!show));
  }

  startGame(level) {
    AudioManager.unlock();
    GameState.newGame(level);
    this.menu.enabled = false;
    fadeOutThen(this.cameras.main, 600, () => {
      if (level === 1) this.scene.start('IntroScene', { dialog: 'intro', next: { scene: 'GameScene' } });
      else this.scene.start(level >= BOSS_LEVEL ? 'BossScene' : 'GameScene');
    });
  }

  update(time, delta) {
    this.atmosphere.update(time, delta);
    this.akariGlow?.setAlpha(0.7 + Math.sin(time / 80) * 0.15 + Math.sin(time / 27) * 0.05);
  }
}
