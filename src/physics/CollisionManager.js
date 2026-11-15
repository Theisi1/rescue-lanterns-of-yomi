/**
 * Registra todas las colisiones y overlaps de una escena de nivel (requisito 4.4).
 *
 *  - collider: Akari choca y se apoya (suelo, plataformas, plataformas espirituales).
 *  - overlap:  Akari atraviesa pero se detecta el contacto (enemigos, objetos,
 *              rescates, checkpoints, triggers, salida).
 *
 * La escena implementa las reacciones (onEnemyContact, collectPickup...), así este
 * módulo solo describe "quién interactúa con quién".
 */
export default class CollisionManager {
  static setup(scene) {
    const add = scene.physics.add;
    const p = scene.player;

    add.collider(p, scene.solids);
    add.collider(p, scene.platforms);
    // Se guarda la referencia: la Visión de Yomi lo activa/desactiva.
    scene.spiritCollider = add.collider(p, scene.spirits);

    add.overlap(p, scene.enemies, (player, enemy) => scene.onEnemyContact(player, enemy));
    add.overlap(p, scene.pickups, (player, item) => scene.collectPickup(item));
    add.overlap(p, scene.katashiros, (player, k) => scene.rescueKatashiro(k));
    add.overlap(p, scene.checkpoints, (player, cp) => scene.activateCheckpoint(cp));
    add.overlap(p, scene.kohakus, (player, kohaku) => scene.showHint(kohaku));
    add.overlap(p, scene.triggers, (player, zone) => zone.fire(player));
    if (scene.exitGate) add.overlap(p, scene.exitGate, () => scene.reachExit());
  }
}
