# RESCUE: Lanterns of Yomi

Videojuego de **plataformas 2D** hecho con **Phaser 3 + JavaScript** (Vite), para el Proyecto Final del Primer Bimestre de *Aplicaciones Web* (EPN, 2026-A).

> Akari es un farol de papel que cumplió cien años y cobró vida (*tsukumogami*). Por miedo a apagarse no extinguió su llama al final del Obon, y la puerta de Yomi quedó abierta. Con su llama como única arma debe rescatar a los habitantes de Kurokiri, convertidos en muñecos de papel, y enfrentar a **Kurohime, la Novia de Yomi**.

**Arquetipo:** Plataforma 2D (saltos, plataformas, scroll lateral, enemigos y checkpoints).

---

## Cómo ejecutarlo

Requisitos: [Node.js](https://nodejs.org) 18 o superior.

```bash
npm install      # instala Phaser y Vite
npm run dev      # servidor de desarrollo → http://localhost:5173
```

Versión de producción (la que va en el ZIP):

```bash
npm run build    # genera la carpeta dist/
npm run preview  # sirve dist/ en http://localhost:4173
```

> `dist/` debe servirse con un servidor HTTP (`npm run preview`, la extensión *Live Server* de VS Code, etc.); abrir `index.html` con doble clic no funciona por las restricciones de módulos ES del navegador.

Para regenerar los niveles después de editarlos: `npm run levels` (requiere Python 3).

---

## Controles

| Acción | Teclado | Móvil (táctil) |
|---|---|---|
| Moverse | ← → / A D | Botones ◀ ▶ |
| Saltar / doble salto | ↑ / W / Espacio (mantener = salto más alto) | **Saltar** |
| Destello (ataque) | X / J | **Luz** |
| Visión de Yomi (mantener) | C / K / Shift | **Yomi** (mantener) |
| Pausa | P / Esc | ⏸ |
| Silenciar | M | 🔊 / 🔇 |
| Mostrar FPS | F | — |

Los menús se manejan con ↑ ↓ + Enter, o con clic/toque. Los controles también se ven desde **Menú → Controles**. En pantallas táctiles los botones aparecen automáticamente.

---

## Cómo se juega

- **La llama es todo:** vida, luz y arma. El círculo de luz crece o se encoge con ella.
- **Destello:** ilumina la pantalla, paraliza a los Yūrei, apaga a los Hitodama y hace retroceder manos y cabezas. Gasta 15 de llama.
- **Disolver espíritus** (pisar un Yūrei paralizado o apagar un Hitodama) devuelve 10 de llama.
- **Visión de Yomi:** mientras se mantiene, aparecen las **plataformas espirituales** y caminos ocultos. Gasta llama poco a poco.
- **Rescate:** toca cada *katashiro* (muñeco de papel) para liberar al habitante. El torii de salida solo se abre con todos rescatados.
- **Checkpoints:** los faroles de piedra (*tōrō*) guardan el punto de reaparición y recargan llama.
- **Vidas:** 3 mechas. Si la llama llega a 0 o caes a un foso, pierdes una.

| Nivel | Zona | Novedad |
|---|---|---|
| 1 | Bosque de Bambú | Tutorial: movimiento, salto, destello, Yūrei |
| 2 | Pueblo de Kurokiri | Visión de Yomi, manos Gaki (triggers), Kamaitachi, susto |
| 3 | Sendero de los Mil Torii | Rokurokubi, Hitodama, bucle de torii que solo se rompe con la Visión de Yomi |
| Final | La Puerta de Yomi | Jefe Kurohime (3 fases) y rescate de Tetsu |

**Jefe (3 fases, la arena cambia en cada una):** el destello de Akari le hace daño si está cerca de ella (desde el suelo hay que saltar; desde las plataformas llega directo), y si el espejo del obi está brillando el golpe es doble. Cada golpe devuelve llama, aparece aceite durante todo el combate y la llama se regenera despacio si no usas la Visión de Yomi.

| Fase | Arena | Ataques |
|---|---|---|
| 1 · El santuario | Suelo completo, dos pilares y plataforma central | Abanicos de pétalos |
| 2 · El suelo se agrieta | El centro del suelo se hunde en un foso; aparecen dos plataformas laterales | Viento helado (cúbrete tras un pilar), abanicos más rápidos, invoca Yūrei |
| 3 · El río de Yomi | El río negro cubre el suelo y los pilares se hunden; quedan las plataformas laterales, dos balsas y la plataforma central (ruta sin Visión de Yomi) más las plataformas espirituales | Abanicos amplios, lluvia de pétalos, Yūrei; Kurohime se mueve más rápido y muestra menos el espejo |

En cada fase Kurohime **se transforma**: en la 2 se enfurece (ceño, lágrimas de sangre, aura roja) y en la 3 se vuelve monstruosa (ojos brillantes, boca con dientes, pelo suelto, kimono negro con vetas rojas). La **música acelera** con ella: 132 → 150 → 176 BPM, con más taiko y disonancias; al vencerla vuelve la calma.

**Puntaje:** rescate 100 · omamori 10 · Yūrei disuelto 50 · Hitodama 50 · golpe al jefe 200 · derrotar al jefe 1000 · bono de llama al terminar cada nivel (llama × 2).

**Power-ups:** aceite (llama), mecha nueva (+1 vida), incienso (10 s sin daño de espíritus), parche de washi (absorbe un golpe), pluma de tengu (doble salto 15 s).

---

## Estructura del proyecto

```
src/
├── main.js              # configuración de Phaser y lista de escenas
├── config.js            # constantes de balance (física, llama, puntajes, claves de storage)
├── scenes/              # Boot, Preload, Menu, Intro, Game, Boss, UI (HUD), Pause, GameOver, Victory
│   └── BaseLevelScene.js  # lógica compartida por GameScene y BossScene
├── objects/             # Akari, Enemy (base), Yurei, Gaki, Kamaitachi, Hitodama, Rokurokubi,
│                        # Kurohime, Katashiro, PowerUp, Checkpoint, Kohaku, fondo parallax, atmósfera
├── ui/                  # MenuList (menús accesibles), FlameBar, BossBar, TouchControls
├── managers/            # Audio, Storage, GameState, Level, Flame, YomiVision, Lighting,
│                        # Input, StateMachine, EventBus
├── physics/             # CollisionManager (colliders/overlaps), TriggerZone
├── audio/               # Synth (instrumentos Web Audio) y MusicTracks (pistas generativas)
├── assets/              # sprites.js (pixel art), TextureFactory, levels/*.json
└── data/                # dialogues.js (textos narrativos)
tools/build_levels.py    # editor de niveles por código → src/assets/levels/*.json
```

Arquitectura (sección 12 del enunciado):
**Scene Manager** (escenas) → **Game Objects** (`objects/`) → **Physics** (`physics/`, Arcade) → **UI/HUD** (`UIScene` + `ui/`, comunicados por `EventBus`) → **AudioManager** → **StorageManager**.

---

## Cumplimiento de requisitos

| Requisito | Implementación |
|---|---|
| 4.1 Escenas, loader, estados, menú, pausa, game over, reinicio | 10 escenas; `PreloadScene` con barra de carga; `GameStateManager` (estados globales) y `StateMachine` (Akari y fases del jefe); reinicio desde Pausa y Game Over |
| 4.2 Estructura profesional | Carpetas `scenes/ objects/ ui/ managers/ assets/ physics/ audio/` + `main.js` |
| 4.3 Mecánicas | Movimiento, colisiones, puntaje, HUD, enemigos, victoria (rescates + salida / jefe), derrota (3 mechas), persistencia |
| 4.4 Física | Arcade Physics con gravedad, colliders, overlaps, triggers (`TriggerZone`), rebote al pisar Yūrei, plataformas de un solo sentido |
| 4.5 Audio | Música de fondo por escena, más de 15 efectos, botón de mute (HUD, menú, pausa y tecla M) |
| 4.6 Persistencia (localStorage) | `rescue_highscore`, `rescue_level` (botón *Continuar*), `rescue_audio` |
| 4.7 Responsive y táctil | `Scale.FIT` + centrado, aviso para girar el móvil, botones táctiles equivalentes con multitouch |
| 4.8 Rendimiento | Iluminación con una sola RenderTexture, terreno fusionado en pocos cuerpos estáticos, audio y texturas generados (sin descargas), contador de FPS con la tecla F |
| 4.9 Accesibilidad | HUD de alto contraste sobre panel oscuro, instrucciones en pantalla (Kohaku), controles documentados, mute, menús navegables con teclado |
| Bonus | Jefe final, IA (los Yūrei persiguen si la llama está baja y huyen del incienso; los Hitodama siguen la luz), efectos de luz/viñeta/niebla y filtro de la Visión de Yomi |

---

## Créditos

- **Diseño, programación e historia:** *Grupo 2*.
- **Arte:** pixel art original, definido como texto en `src/assets/sprites.js` y generado en tiempo de carga.
- **Música y efectos:** sintetizados en tiempo real con Web Audio API (`src/audio/`), originales.
- **Fuentes:** [DotGothic16](https://fonts.google.com/specimen/DotGothic16) y [Shippori Mincho](https://fonts.google.com/specimen/Shippori+Mincho) (Google Fonts, SIL Open Font License).
- **Motor:** [Phaser 3](https://phaser.io) (MIT). **Herramienta de build:** [Vite](https://vite.dev) (MIT).
- Yōkai, Yomi y el Obon provienen del folclore japonés tradicional (dominio público).


