# Autoevaluación — RESCUE: Lanterns of Yomi


| Criterio | Peso | Nota propia | Justificación |
|---|---|---|---|
| Funcionalidad principal | 20% | 19 / 20 | El juego se completa de inicio a fin: menú → intro → 3 niveles → jefe → final → victoria. Game Over y reinicio funcionan. |
| Mecánicas de juego | 15% | 14 / 15 | Plataformas 2D completas (salto variable, doble salto, checkpoints, scroll lateral). La llama como recurso único (vida + luz + ataque + Visión de Yomi) da decisiones al jugador. |
| Física y colisiones | 10% | 10 / 10 | Arcade Physics con gravedad, colliders, overlaps, triggers (`TriggerZone`), rebote al pisar Yūrei, plataformas de un solo sentido y plataformas espirituales que se activan/desactivan. |
| Arquitectura y modularidad | 15% | 14 / 15 | Separación en `scenes/ objects/ ui/ managers/ physics/ audio/ assets/`; `BaseLevelScene` reutilizada por niveles y jefe; HUD desacoplado con `EventBus`; niveles en JSON generados por script. |
| Rendimiento y optimización | 10% | 9 / 10 | 60 FPS en escritorio (contador con F). Una sola RenderTexture para la luz, terreno fusionado en pocos cuerpos, assets generados en código (sin descargas). |
| UX/UI | 10% | 9 / 10 | Menús navegables con teclado y clic, HUD de alto contraste, pausa con reinicio, pistas de Kohaku en cada nivel, panel de controles. |
| Audio e inmersión | 5% | 5 / 5 | Música generativa por escena (se distorsiona con la Visión de Yomi), más de 15 efectos, mute persistente (HUD, menú, pausa, tecla M). |
| Responsividad y táctil | 5% | 4 / 5 | `Scale.FIT`, aviso para girar el móvil y botones táctiles multitouch equivalentes al teclado. |
| Código limpio y documentación | 5% | 5 / 5 | Comentarios explicativos en español, nombres descriptivos, README completo. |
| README, video y presentación | 5% | — | Depende del video y las capturas entregadas. |
| **Bonus** | +10% | Jefe final, IA (Yūrei y Hitodama), efectos de luz/viñeta/niebla y filtro de Yomi. |

## Fortalezas
- Historia original con mecánica central coherente: la llama es vida, luz y arma a la vez.
- La Visión de Yomi convierte la luz en un puzzle de plataformas (caminos ocultos, bucle de torii).
- Jefe con 3 fases y máquina de estados propia.
- Todo el arte y el audio son originales y se generan en código: el juego no descarga assets.

## Limitaciones
- El pixel art es sencillo, con pocas animaciones por personaje.
- Solo hay 3 niveles más el jefe; la rejugabilidad depende del récord.
- La oscuridad puede dificultar la lectura del escenario en pantallas con poco brillo.
- El bundle es grande (~1,3 MB, ~350 KB gzip), sobre todo por Phaser.

## Mejoras futuras
- Minimapa con los katashiro pendientes.
- Sendero de los Mil Torii generado proceduralmente en cada partida.
- PWA instalable y leaderboard online.
- Opción de brillo/contraste y selector de dificultad.
