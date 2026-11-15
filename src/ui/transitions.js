/**
 * Fundido a color y luego ejecuta `onComplete` (una sola vez).
 *
 * Phaser ignora `fadeOut` si otro fundido (p. ej. el `fadeIn` inicial de la escena)
 * sigue en curso, y entonces el evento 'camerafadeoutcomplete' nunca llega y el juego
 * queda congelado. Por eso:
 *  1. se fuerza el fundido (`force = true`), y
 *  2. hay un temporizador de respaldo: si por cualquier motivo el fundido no termina,
 *     la transición ocurre igual poco después.
 */
export function fadeOutThen(camera, duration, onComplete, r = 0, g = 0, b = 0) {
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    onComplete();
  };
  camera.fadeEffect.start(true, duration, r, g, b, true, (cam, progress) => {
    if (progress >= 1) finish();
  });
  camera.scene.time.delayedCall(duration + 300, finish);
}
