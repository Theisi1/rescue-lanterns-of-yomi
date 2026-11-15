"""
Editor de niveles por código: genera src/assets/levels/levelN.json.

Cada nivel se describe colocando piezas por coordenadas (columna, fila) en una
cuadrícula de 17 filas x 32 px. El resultado es un mapa de texto legible
(ver la leyenda en src/managers/LevelManager.js).

Uso:  npm run levels   (o  python tools/build_levels.py)
"""
import json
from pathlib import Path

ROWS = 17
OUT = Path(__file__).resolve().parent.parent / "src" / "assets" / "levels"


class Level:
    def __init__(self, width):
        self.w = width
        self.grid = [[" "] * width for _ in range(ROWS)]

    def put(self, col, row, ch):
        self.grid[row][col] = ch

    def fill(self, c0, c1, r0, r1, ch="#"):
        for r in range(r0, r1 + 1):
            for c in range(c0, c1 + 1):
                self.grid[r][c] = ch

    def ground(self, c0, c1):
        self.fill(c0, c1, 15, 16)

    def plat(self, c0, c1, row):
        self.fill(c0, c1, row, row, "-")

    def spirit(self, c0, c1, row):
        self.fill(c0, c1, row, row, "~")

    def ceiling(self, c0, c1):
        self.fill(c0, c1, 0, 3)

    def many(self, ch, cells):
        for c, r in cells:
            self.put(c, r, ch)

    def rows(self):
        return ["".join(r) for r in self.grid]


def level1():
    L = Level(120)
    for a, b in [(0, 24), (28, 45), (53, 70), (75, 95), (101, 119)]:
        L.ground(a, b)
    L.plat(47, 51, 12)
    L.plat(60, 63, 12)
    L.plat(65, 68, 9)
    L.fill(80, 82, 13, 14)
    L.plat(97, 99, 12)

    L.put(2, 14, "P")
    L.many("k", [(5, 14), (30, 14), (40, 14), (57, 14), (92, 14)])
    L.many("K", [(44, 14), (66, 8), (110, 14)])
    L.many("Y", [(37, 13), (64, 13), (87, 13), (106, 13)])
    L.many("C", [(55, 14), (90, 14)])
    L.many("O", [(59, 14), (98, 11)])
    L.many("o", [(9, 13), (11, 13), (13, 13), (20, 13), (22, 13), (49, 11), (50, 11),
                 (61, 11), (62, 11), (77, 13), (78, 13), (81, 12), (103, 13), (104, 13)])
    L.put(116, 14, "E")
    return {
        "id": 1,
        "name": "Bosque de Bambú",
        "subtitle": "El bambú cruje... y alguien susurra tu nombre",
        "theme": "bamboo",
        "darkness": 0.9,
        "particle": "ash",
        "fireflies": True,
        "hints": [
            "¡Akari! Usa ← → (o A / D) para moverte y ↑ / W / Espacio para saltar. Mantén el salto para llegar más alto.",
            "Los Yurei flotan en la oscuridad. Pulsa X (o J) para lanzar un DESTELLO: los paraliza... pero gasta llama.",
            "Un Yurei paralizado se disuelve si le saltas encima. Toca los muñecos de papel (katashiro) para rescatar a los habitantes.",
            "El aceite recarga tu llama. Los faroles de piedra guardan tu camino si tu llama se apaga.",
            "Rescata a todos y cruza el torii. Si la llama llega a cero, perderás una de tus 3 mechas.",
        ],
        "decor": [{"type": "bamboo_front", "col": c, "row": 14, "alpha": 0.7} for c in (14, 33, 58, 85, 108)],
        "map": L.rows(),
    }


def level2():
    L = Level(140)
    for a, b in [(0, 20), (31, 80), (89, 120), (127, 139)]:
        L.ground(a, b)
    L.spirit(22, 24, 13)
    L.spirit(26, 28, 13)
    L.fill(57, 61, 12, 14)
    L.plat(72, 74, 12)
    L.spirit(75, 77, 9)
    L.plat(83, 85, 12)
    L.spirit(122, 125, 13)

    L.put(2, 14, "P")
    L.many("k", [(5, 14), (33, 14), (63, 14), (91, 14)])
    L.many("K", [(40, 14), (59, 11), (76, 8), (114, 14)])
    L.many("G", [(37, 14), (45, 14), (101, 14), (105, 14)])
    L.many("W", [(66, 14), (97, 14)])
    L.many("Y", [(50, 13), (109, 13)])
    L.many("C", [(53, 14), (93, 14)])
    L.many("O", [(68, 14), (24, 12)])
    L.put(71, 14, "I")
    L.put(130, 14, "S")
    L.put(111, 14, "J")
    L.many("o", [(10, 13), (12, 13), (23, 11), (27, 11), (42, 13), (48, 13), (73, 11), (84, 11),
                 (99, 13), (116, 13), (123, 11), (124, 11)])
    L.put(135, 14, "E")
    return {
        "id": 2,
        "name": "Pueblo de Kurokiri",
        "subtitle": "El festival sigue puesto. Nadie volvió a recogerlo",
        "theme": "village",
        "darkness": 0.92,
        "particle": "ash",
        "hints": [
            "Hay caminos que solo existen para los muertos. MANTÉN C (o K / Shift) para la VISIÓN DE YOMI: revela plataformas espirituales, pero consume llama.",
            "Cuidado con el suelo del pueblo: algo bajo la tierra tiene hambre. Si tiembla, no te quedes quieto.",
            "Si oyes viento, salta: las Kamaitachi cruzan a toda velocidad y roban llama. El incienso aleja a los espíritus.",
            "Las plataformas espirituales también llevan a lugares altos. Mira bien: alguien espera allá arriba.",
        ],
        "decor": (
            [{"type": "lantern_red", "col": c, "row": 9, "alpha": 0.9} for c in (8, 15, 35, 47, 64, 70, 95, 103, 112, 131)]
            + [{"type": "stall", "col": c, "row": 14, "alpha": 0.85} for c in (12, 47, 100)]
        ),
        "map": L.rows(),
    }


def level3():
    L = Level(160)
    for a, b in [(0, 55), (63, 140), (147, 159)]:
        L.ground(a, b)
    L.ceiling(14, 30)
    L.fill(32, 34, 14, 14)
    L.fill(35, 37, 13, 14)
    L.fill(38, 40, 12, 14)
    L.fill(41, 43, 13, 14)
    L.fill(44, 45, 14, 14)
    L.plat(57, 58, 12)
    L.plat(60, 61, 12)
    L.plat(102, 105, 12)
    L.plat(107, 110, 9)
    L.ceiling(114, 132)
    L.spirit(142, 145, 13)

    L.put(2, 14, "P")
    L.many("k", [(5, 14), (64, 14), (137, 14)])
    L.many("R", [(18, 4), (26, 4), (117, 4), (123, 4), (129, 4)])
    L.many("K", [(22, 14), (39, 11), (75, 14), (108, 8), (126, 14)])
    L.many("H", [(46, 10), (60, 8), (104, 9), (113, 10)])
    L.many("Y", [(82, 13)])
    L.many("C", [(48, 14), (98, 14)])
    L.many("O", [(52, 14), (68, 14), (135, 14)])
    L.put(119, 14, "L")
    L.put(100, 14, "F")
    L.put(66, 14, "B")
    L.put(90, 14, "T")
    L.many("o", [(8, 13), (10, 13), (16, 13), (24, 13), (36, 12), (42, 12), (57, 11), (61, 11),
                 (72, 13), (79, 13), (103, 11), (109, 8), (121, 13), (128, 13), (143, 11), (144, 11)])
    L.put(155, 14, "E")
    return {
        "id": 3,
        "name": "Sendero de los Mil Torii",
        "subtitle": "Mil puertas rojas... y solo una lleva a alguna parte",
        "theme": "shrine",
        "darkness": 0.94,
        "particle": "petal",
        "hints": [
            "Las cabezas de los Rokurokubi caen de los techos. Si ves una asomarse, ¡no te quedes debajo! Los Hitodama persiguen tu luz.",
            "Los torii no terminan... a menos que mires con los ojos de los muertos. Cruza el último con la Visión de Yomi activa.",
            "Más allá está la Puerta de Yomi. Llena tu llama antes de cruzar.",
        ],
        "decor": (
            [{"type": "torii", "col": c, "row": 14, "alpha": 0.8} for c in (8, 70, 76, 82, 88, 150)]
            + [{"type": "torii_true", "col": 90, "row": 14, "yomi": True}]
        ),
        "map": L.rows(),
    }


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for i, build in enumerate([level1, level2, level3], start=1):
        data = build()
        text = json.dumps(data, ensure_ascii=False, indent=2)
        (OUT / f"level{i}.json").write_text(text + "\n", encoding="utf-8")
        print(f"level{i}.json  ({len(data['map'][0])} columnas)")


if __name__ == "__main__":
    main()
