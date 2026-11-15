/**
 * Pixel art del juego definido como texto.
 * Cada carácter es un píxel (se escala x2 o x4 al generar la textura) y su color
 * sale de la paleta indicada. '.' = transparente.
 *
 * Así los sprites son originales, ligeros (pocos KB) y fáciles de modificar.
 */

// ------------------------------------------------------------------ Akari
const AKARI_TOP = [
  '....kkkkkk....',
  '....kwwwwk....',
  '...kkkkkkkk...',
  '..kRRRRRRRRk..',
  '.kppppppppppk.',
  '.krrrrrrrrrrk.'
];
const AKARI_BOTTOM = [
  'kppppppppppppk',
  'krrrrrrrrrrrrk',
  'kppppllllppppk',
  '.kppppppppppk.',
  '..kRRRRRRRRk..',
  '...kkkkkkkk...'
];
const EYES = {
  center: ['kpppeeeeeepppk', 'kppeeebbeeeppk', 'krreebbbbeerrk', 'kppeeebbeeeppk', 'kpppeeeeeepppk'],
  up: ['kpppeebbeepppk', 'kppeebbbbeeppk', 'krreeebbeeerrk', 'kppeeeeeeeeppk', 'kpppeeeeeepppk'],
  down: ['kpppeeeeeepppk', 'kppeeeeeeeeppk', 'krreeebbeeerrk', 'kppeebbbbeeppk', 'kpppeebbeepppk'],
  closed: ['kppppppppppppk', 'kppppppppppppk', 'krrbbbbbbbbrrk', 'kppppppppppppk', 'kppppppppppppk'],
  none: ['kppppppppppppk', 'kppppppppppppk', 'krrrrrrrrrrrrk', 'kppppppppppppk', 'kppppppppppppk']
};
const LEGS = {
  stand: ['....kw..wk....', '....kw..wk....', '...kkw..wkk...'],
  run1: ['...kw....wk...', '..kw......wk..', '.kk........kk.'],
  run2: ['.....kwwk.....', '.....kwwk.....', '....kkkkkk....'],
  tuck: ['....kw..wk....', '...kw....wk...', '..............']
};
const akari = (eyes, legs) => [...AKARI_TOP, ...EYES[eyes], ...AKARI_BOTTOM, ...LEGS[legs]];

export const AKARI_PALETTE = {
  k: '#2a160c', w: '#6b3f1f', p: '#f6c35b', r: '#c47a2c', R: '#b3202c',
  l: '#fff1b0', e: '#ffffff', b: '#120a08'
};
export const LANTERN_OFF_PALETTE = {
  k: '#1a120e', w: '#3a2516', p: '#4a3a32', r: '#2e231e', R: '#5a1418', l: '#4a3a32', e: '#4a3a32', b: '#4a3a32'
};

export const AKARI = {
  akari_idle: akari('center', 'stand'),
  akari_run1: akari('center', 'run1'),
  akari_run2: akari('center', 'run2'),
  akari_jump: akari('up', 'tuck'),
  akari_fall: akari('down', 'stand'),
  akari_hurt: akari('closed', 'run1'),
  lantern_off: akari('none', 'stand')
};

// ------------------------------------------------------------------ Yūrei
const YUREI_BODY = [
  '....hhhhhh....',
  '...hhhhhhhh...',
  '..hhhffffhhh..',
  '..hhfeffefhh..',
  '..hhffffffhh..',
  '..hhhffffhhh..',
  '.hhhwwwwwwhhh.',
  '.hhwwswwswwhh.',
  'fhhwwwsswwwhhf',
  'f.hwwwsswwwh.f',
  '..hwwwwwwwwh..',
  '..hwwswwswwh..',
  '...wwwwwwww...',
  '...wwswwsww...'
];
export const YUREI = {
  yurei_0: [...YUREI_BODY, '....wwwwww....', '....wswwsw....', '.....wwww.....', '.....swws.....', '......ww......', '......s.......'],
  yurei_1: [...YUREI_BODY, '....wwwwww....', '.....wswwsw...', '......wwww....', '.......swws...', '........ww....', '.........s....']
};
export const YUREI_PALETTE = { h: '#0b0b10', f: '#e8eef0', w: '#dfe6ea', s: '#9aa8b4', e: '#ff3040' };

// ------------------------------------------------------------------ Gaki
const ARM = ['....gggd....', '....gdgg....'];
export const GAKI = [
  '..n.n.n.n...',
  '..g.g.g.g...',
  '..g.g.g.g...',
  '..g.g.g.g.n.',
  '..ggggggg.g.',
  '..gggggggg..',
  '..gdgggdgg..',
  '...gggggg...',
  '...gdggdg...',
  ...Array.from({ length: 17 }, (_, i) => ARM[i % 2])
];
export const GAKI_PALETTE = { g: '#6f7d5c', d: '#47523a', n: '#d8cfae' };

// ------------------------------------------------------------------ Kamaitachi
const KAMA_TOP = [
  '..ss................',
  '.ss...ff............',
  's....fkfff.....w.w..',
  '....ffffffffff..w.ww',
  '...kfffffffffffffww.',
  '....fddfffffffffdw.w'
];
export const KAMAITACHI = {
  kamaitachi_0: [...KAMA_TOP, '.....ff.....ff.fffww', '....f.......f.....w.', '....................', '....................'],
  kamaitachi_1: [...KAMA_TOP, '......ff...ff..fff.w', '.......f...f.....ww.', '....................', '....................']
};
export const KAMAITACHI_PALETTE = { f: '#c9b48a', d: '#7d6a48', k: '#1a120a', s: '#e0e6ee', w: '#9fd3ff' };

// ------------------------------------------------------------------ Hitodama
export const HITODAMA = [
  '....d.....',
  '...dd.....',
  '...db.d...',
  '..dbb.d...',
  '..dbbbd...',
  '.dbbcbbd..',
  '.dbcccbd..',
  'dbbccccbd.',
  'dbcccccbd.',
  'dbcccccbd.',
  'dbbcccbbd.',
  '.dbbbbbd..',
  '..ddddd...',
  '..........'
];
export const HITODAMA_PALETTE = { c: '#e8ffff', b: '#6fd0ff', d: '#2a6cff' };

// ------------------------------------------------------------------ Rokurokubi
export const ROKURO = [
  '...hhhhhhhh...',
  '..hhhhhhhhhh..',
  '.hhhhhhhhhhhh.',
  '.hhffffffffhh.',
  'hhffffffffffhh',
  'hhfbbffffbbfhh',
  'hhfebffffbefhh',
  'hhffffffffffhh',
  'hhffffrrffffhh',
  'hhfffrrrrfffhh',
  'hh.ffffffff.hh',
  'hh..ffffff..hh',
  'hh....ff....hh',
  'h.....ff.....h'
];
export const ROKURO_PALETTE = { h: '#08060c', f: '#e9dcc4', b: '#0a0505', e: '#ffffff', r: '#a3122a' };

// ------------------------------------------------------------------ Personas
export const KATASHIRO = [
  '...pppp...',
  '..pppppp..',
  '..pppppp..',
  '...pppp...',
  '....pp....',
  'pppppppppp',
  'spppppppps',
  '...prrp...',
  '...pppp...',
  '...pppp...',
  '...pspp...',
  '..pppppp..',
  '..pppppp..',
  '..pp..pp..',
  '..pp..pp..',
  '..ss..ss..'
];
export const KATASHIRO_PALETTE = { p: '#f4f1ea', s: '#b9b2a3', r: '#c0182c' };

export const PERSON = [
  '...hhhh...',
  '..hhhhhh..',
  '..hffffh..',
  '..ffffff..',
  '...ffff...',
  '.kkkkkkkk.',
  'fkkkkkkkkf',
  'fkkkkkkkkf',
  '..bbbbbb..',
  '..kkkkkk..',
  '..kkkkkk..',
  '..kkkkkk..',
  '..kkkkkk..',
  '..kk..kk..',
  '..ff..ff..',
  '..hh..hh..'
];
export const VILLAGER_PALETTE = { h: '#1a1410', f: '#e9c39b', k: '#3d5a80', b: '#c9a227' };
export const TETSU_PALETTE = { h: '#d8d8d8', f: '#d9b08c', k: '#6b4a2b', b: '#2a1a10' };

// ------------------------------------------------------------------ Kohaku
export const KOHAKU = [
  '..........a.a.',
  '.........aaaaa',
  '.........akaaw',
  'gg.......aaaww',
  'ggd.....aawwk.',
  '.gdd...aaaw...',
  '..ddaaaaaaw...',
  '...daaaaaaw...',
  '...aaaaaaaw...',
  '...aaaaaaaa...',
  '...a.a..a.a...',
  '...k.k..k.k...'
];
export const KOHAKU_PALETTE = { a: '#f0a030', d: '#b86a14', w: '#fff3d6', k: '#1a0f05', g: '#ffe6a0' };

// ------------------------------------------------------------------ Kurohime (x4)
export const KUROHIME = [
  '........VVVVVVVV........',
  '.......VvvvvvvvvV.......',
  '......VvvvvvvvvvvV......',
  '.....VvvvvvvvvvvvvV.....',
  '.....vvvhffffffhvvv.....',
  '....vvvhfeffffefhvvv....',
  '....vvvhffffffffhvvv....',
  '....vvvhfffRRfffhvvv....',
  '...vvvvhhffffffhhvvvv...',
  '...vvvvhhhwwwwhhhvvvv...',
  '..vvvvhhhwwrrwwhhhvvvv..',
  '..vvvhhrrwrrrrwrrhhvvv..',
  '.vvvhhrrrrwrrwrrrrhhvvv.',
  '.vvhhrrrrrrwwrrrrrrhhvv.',
  'vvhhrrrrrrrrrrrrrrrrhhvv',
  'vvhhRRooooooooooooRRhhvv',
  'vhhrRROOOOOOOOOOOORRrhhv',
  'vhhrRROOOOOOOOOOOORRrhhv',
  'vhhrRRooooooooooooRRrhhv',
  'vhrrrrrrrrrrrrrrrrrrrrhv',
  'ffrrrRrrrrrrrrrrrRrrrrff',
  'f.rrrRrrrrrrrrrrrRrrrr.f',
  '..rrrRrrrrrrrrrrrRrrrr..',
  '..rrRrrrrrrrrrrrrrRrrr..',
  '..rrRrrrr.rrrrrrrrRrrr..',
  '..rRrrrrr.rrrr.rrrrRrr..',
  '..rRrrr...rrrr..rrrRrr..',
  '..rRrr.....rr....rrRr...',
  '..Rrr......rr.....rRr...',
  '..Rr.......R.......Rr...',
  '..R.................R...',
  '........................'
];
export const KUROHIME_PALETTE = {
  V: '#2a1830', v: '#0a0610', f: '#e6e0f0', e: '#ff2050', h: '#050308',
  r: '#9c1426', R: '#5a0a18', w: '#e8e2ea', o: '#b8892a', O: '#3a2a10'
};

// Kurohime en las fases 2 y 3: se basa en el sprite original y solo cambia la cara,
// el pelo y los colores. Cada fase se ve más furiosa y más tenebrosa.
const withRows = (rows, changes) => rows.map((r, i) => changes[i] ?? r);

// Fase 2 — furiosa: ceño fruncido, lágrimas de sangre y boca abierta.
export const KUROHIME_ANGRY = withRows(KUROHIME, {
  4: '.....vvvhhffffhhvvv.....',
  5: '....vvvhfehffhefhvvv....',
  6: '....vvvhfeffffefhvvv....',
  7: '....vvvhffRhhRffhvvv....'
});
export const KUROHIME_ANGRY_PALETTE = {
  ...KUROHIME_PALETTE,
  V: '#3a1020', f: '#cfc6dc', e: '#ff1030', r: '#7c0e1e', R: '#3e0610', o: '#8a6420'
};

// Fase 3 — monstruosa: ojos que brillan, boca enorme con dientes y el pelo suelto.
const WILD_HAIR = {};
for (let i = 18; i <= 30; i++) {
  const row = KUROHIME[i].split('');
  const side = i % 2 === 0 ? [0, 23] : [1, 22];
  side.forEach((c) => { if (row[c] === '.') row[c] = 'v'; });
  WILD_HAIR[i] = row.join('');
}
export const KUROHIME_MONSTER = withRows(KUROHIME, {
  0: '..V.....VVVVVVVV.....V..',
  1: '...V...VvvvvvvvvV...V...',
  2: 'V...V.VvvvvvvvvvvV.V...V',
  3: '.V...VvvvvvvvvvvvvV...V.',
  4: '.....vvvheffffehvvv.....',
  5: '....vvvhfEEffEEfhvvv....',
  6: '....vvvhfeffffefhvvv....',
  7: '....vvvhfhwhhwhfhvvv....',
  8: '...vvvvhhfhwwhfhhvvvv...',
  ...WILD_HAIR
});
export const KUROHIME_MONSTER_PALETTE = {
  ...KUROHIME_PALETTE,
  V: '#5a0a18', v: '#050208', f: '#9e94ae', e: '#ff0020', E: '#ffe0e8', h: '#000000',
  r: '#140108', R: '#e0183a', w: '#d8d0dc', o: '#e0183a', O: '#300410'
};

// ------------------------------------------------------------------ Escenario
export const TORO = [
  '.....ss.....',
  '...ssssss...',
  '.ssssssssss.',
  'dddddddddddd',
  '..ssssssss..',
  '..slllllls..',
  '..slllllls..',
  '..slllllls..',
  '..ssssssss..',
  '.dddddddddd.',
  '....ssss....',
  '....sdss....',
  '....ssss....',
  '....ssds....',
  '....ssss....',
  '...ssssss...',
  '..ssssssss..',
  '.dddddddddd.',
  'ssssssssssss',
  'dddddddddddd'
];
export const TORO_OFF_PALETTE = { s: '#6d6a72', d: '#45424a', l: '#1c1a20' };
export const TORO_ON_PALETTE = { s: '#8a8590', d: '#55505a', l: '#ffd76a' };

// ------------------------------------------------------------------ Objetos (8x8)
export const PICKUPS = {
  omamori: {
    rows: ['...yy...', '..y..y..', '.rrrrrr.', '.rryyrr.', '.rryyrr.', '.rrrrrr.', '.rrrrrr.', '..rrrr..'],
    palette: { y: '#f2c94c', r: '#c0182c' }
  },
  oil: {
    rows: ['..kkkk..', '...oo...', '..oooo..', '.oaoooo.', 'oaaooooo', 'oaoooooo', '.oooooo.', '..oooo..'],
    palette: { k: '#2a160c', o: '#7a4a24', a: '#ffb84d' }
  },
  pu_wick: {
    rows: ['...ff...', '..fyyf..', '..fyyf..', '...ff...', '...ww...', '...ww...', '..wwww..', '.kkkkkk.'],
    palette: { f: '#ff9a2a', y: '#fff2a0', w: '#e8dcc0', k: '#3a2a1a' }
  },
  pu_incense: {
    rows: ['.s...s..', '..s.s...', '...s....', '...r....', '...b....', '...b....', '..bbb...', '.kkkkk..'],
    palette: { s: '#c9c3d8', r: '#ff5a2a', b: '#8b5a2b', k: '#3a3430' }
  },
  pu_washi: {
    rows: ['pppppppp', 'pssssssp', 'psprrpsp', 'psrpprsp', 'psrpprsp', 'psprrpsp', 'pssssssp', 'pppppppp'],
    palette: { p: '#f4efe0', s: '#d8cfb8', r: '#c0182c' }
  },
  pu_feather: {
    rows: ['......kr', '.....kkr', '....kkr.', '...kkr..', '..kkr...', '.kkr....', '.kr.....', 'w.......'],
    palette: { k: '#1c1c28', r: '#c0182c', w: '#e8e0d0' }
  }
};
