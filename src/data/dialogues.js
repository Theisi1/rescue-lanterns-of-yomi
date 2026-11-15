/**
 * Textos narrativos (IntroScene). Separados del código para editarlos fácilmente.
 * speaker: 'kohaku' | 'tetsu' | 'akari' | null (narrador)
 */
export const DIALOGUES = {
  intro: [
    { speaker: null, text: 'En las montañas de Japón está Kurokiri, un pueblo olvidado donde cada verano se celebra el Obon.' },
    { speaker: null, text: 'Durante tres noches los faroles guían a los muertos a casa. Al final del festival, se apagan para que vuelvan a Yomi.' },
    { speaker: null, text: 'Este año, un farol no se apagó. Se llama Akari, y acaba de cumplir cien años.' },
    { speaker: 'kohaku', text: 'Así que tú eres el farol que no quiso apagarse... Mira lo que hiciste, pequeño.' },
    { speaker: 'kohaku', text: 'La puerta está abierta y los vivos se están yendo con los muertos. Tu llama es lo único que los ve.' },
    { speaker: 'kohaku', text: 'Úsala... pero cada vez que brilles, te quedará menos.' }
  ],
  after1: [
    { speaker: 'kohaku', text: 'Saliste del bambú. Los muñecos de papel aún lloran en el pueblo.' },
    { speaker: 'kohaku', text: 'Allí la tierra tiene hambre... y hay caminos que solo los muertos pueden pisar. Mantén tu Visión de Yomi.' }
  ],
  after2: [
    { speaker: 'kohaku', text: 'El sendero de los Mil Torii sube hasta el santuario.' },
    { speaker: 'kohaku', text: 'Los torii no terminan... a menos que mires con los ojos de los muertos.' }
  ],
  after3: [
    { speaker: 'kohaku', text: 'La Puerta de Yomi. Ella te espera: Kurohime, la novia que nunca regresó.' },
    { speaker: 'kohaku', text: 'Acércate y tu destello la herirá, pequeño. Pero su espejo es su corazón: cuando brille, el golpe será doble.' },
    { speaker: 'kohaku', text: '¿Y después, pequeño farol? Después... ya lo sabrás.' }
  ],
  ending: [
    { speaker: null, text: 'Kurohime cae, pero la puerta sigue abierta. La luz de Akari la mantiene así.' },
    { speaker: 'tetsu', text: 'Akari... te hice demasiado bien. Perdóname.' },
    { speaker: null, text: 'Akari mira a los habitantes, a salvo. Cierra su único ojo.' },
    { speaker: null, text: 'Y apaga su propia llama.' }
  ]
};
