/* =========================================================
   MONKY DREAMS — SPRITES PIXEL ART
   Todo el arte se dibuja con código: cada sprite es una
   lista de filas de texto y cada letra es un color de la
   paleta. "." significa transparente.
   ========================================================= */

window.MonkySprites = (function () {
  "use strict";

  /* -------------------------------------------------------
     PALETA (inspirada en MoncadaArt: crema, naranja y azul)
     ------------------------------------------------------- */
  const PALETA = {
    k: "#1b1a2a", // contorno azul-negro

    // Monky
    c: "#24486e", // gorra
    C: "#183352", // gorra sombra
    l: "#3f6d98", // gorra brillo
    b: "#8b4a26", // pelaje
    d: "#6a3418", // pelaje oscuro
    f: "#f0b27c", // cara durazno
    n: "#b8683c", // nariz
    w: "#fff7e8", // blanco ojos
    e: "#1b1a2a", // pupila
    m: "#e8792e", // lengua naranja
    h: "#f3e4c8", // sudadera crema
    H: "#d4bc96", // sudadera sombra
    p: "#3b3a52", // pantalón
    s: "#e8792e", // tenis naranja

    // Bicho (enemigo)
    g: "#5b3f8c",
    G: "#8a6bc4",
    y: "#fff7e8",

    // Pesadilla (enemigo)
    v: "#33264f",
    V: "#55417f",
    r: "#ff9a3c",

        // Corazón
    x: "#e8473c",
    X: "#ff9b8a",
    q: "#5a5470",

    // Lámpara (punto de control)
    j: "#315d78",
    J: "#8a8aa0",

    // Moneda MoncadaArt
    "1": "#f2c14e",
    "2": "#c98a1e",
    "3": "#fff1b0",

    // Despertador (meta)
    z: "#e8792e",
    Z: "#b9551c",
    o: "#f2c14e"
  };

  /* -------------------------------------------------------
     MONKY 16x16 (mira a la derecha)
     ------------------------------------------------------- */
  const CABEZA_ABIERTA = [
    "....kkkkkkk.....",
    "...kcllllcck....",
    "..kccccccccck...",
    "kkkCCCCCCCCCk...",
    "..kbbfffbfffbk..",
    ".kbbfwwffwwffk..",
    "kfkbfweffweffk..",
    "kfkbffffnnfffk..",
    ".kbbffkffffkfk..",
    "..kbfffkmmkffk..",
    "...kkffffffkk..."
  ];

  const CABEZA_CERRADA = [
    "....kkkkkkk.....",
    "...kcllllcck....",
    "..kccccccccck...",
    "kkkCCCCCCCCCk...",
    "..kbbfffbfffbk..",
    ".kbbffffffffk...",
    "kfkbfkkffkkffk..",
    "kfkbffffnnfffk..",
    ".kbbffffffffk...",
    "..kbfffkkkfffk..",
    "...kkffffffkk..."
  ];

  const CABEZA_DOLOR = [
    "....kkkkkkk.....",
    "...kcllllcck....",
    "..kccccccccck...",
    "kkkCCCCCCCCCk...",
    "..kbbfffbfffbk..",
    ".kbbkfkfkfkffk..",
    "kfkbfkffffkffk..",
    "kfkbkfkfnnkffk..",
    ".kbbfffffffffk..",
    "..kbffkmmmkffk..",
    "...kkffffffkk..."
  ];

  const TORSO = [
    "...khhhhhhhhk...",
    "..kbhhHhhhhhbk..",
    "bb.khhhhhhhhk..."
  ];

  const TORSO_BRAZOS_ARRIBA = [
    "..bkhhhhhhhhkb..",
    "..khhHhhhhhhhk..",
    "bb.khhhhhhhhk..."
  ];

  const TORSO_BRAZO_ADELANTE = [
    "...khhhhhhhhk...",
    "..khhHhhhhhhhbk.",
    "bb.khhhhhhhhk..."
  ];

  const TORSO_BRAZO_ATRAS = [
    "...khhhhhhhhk...",
    ".kbhhHhhhhhhhk..",
    "bb.khhhhhhhhk..."
  ];

  const PIERNAS = {
    quieto: [".bbkpppkpppk....", "...ksssk.ksssk.."],
    paso1: [".bbkppk..kppk...", "..kssk....ksssk."],
    paso2: [".bbkkpppppk.....", "....ksssssk....."],
    paso3: [".bb.kppkkppk....", "...ksssk.kssk..."],
    salto: [".bbkpppppk......", "..kssk.ksssk...."]
  };

  function mono(cabeza, torso, piernas) {
    return cabeza.concat(torso, piernas);
  }

  /* -------------------------------------------------------
     ENEMIGOS
     ------------------------------------------------------- */
  const BICHO_A = [
    "..k........k....",
    "...k......k.....",
    "...kkkkkkkk.....",
    "..kgGGgggggk....",
    ".kgGGggggggggk..",
    ".kgGgggyeggyegk.",
    ".kggggggggggggk.",
    ".kgggkkkkkkgggk.",
    "..kgggggggggk...",
    "...kkkkkkkkk....",
    "...k.k...k.k....",
    "..k.k.....k.k..."
  ];

  const BICHO_B = BICHO_A.slice(0, 10).concat([
    "....k.k.k.k.....",
    "....k.k.k.k....."
  ]);

  const PESADILLA_A = [
    ".....kkkkkk.....",
    "...kkvvvvvvkk...",
    "..kvVVvvvvvvvk..",
    ".kvVVvvvvvvvvvk.",
    ".kvVvvvvvvvvvvk.",
    "kvvvrrvvvvrrvvvk",
    "kvvvrkvvvvrkvvvk",
    "kvvvvvvvvvvvvvvk",
    "kvvvvkkkkkkvvvvk",
    "kvvvkwkwkwkvvvvk",
    "kvvvvvvvvvvvvvvk",
    "kvvvvvvvvvvvvvvk",
    "kvvVvvvvvvvVvvvk",
    ".kvvvkvvvvkvvvk.",
    "..kvk.kvvk.kvk..",
    "...k...kk...k..."
  ];

  const PESADILLA_B = PESADILLA_A.slice(0, 13).concat([
    ".kvvvvkvvkvvvvk.",
    ".kvk..kvvk..kvk.",
    "..k....kk....k.."
  ]);

  /* -------------------------------------------------------
     MONEDA MONCADAART 12x12 (gira en 4 cuadros)
     ------------------------------------------------------- */
  const MONEDA_FRENTE = [
    "...kkkkkk...",
    ".kk111111kk.",
    ".k13111112k.",
    "k1311111112k",
    "k1321112112k",
    "k1322122112k",
    "k1321212112k",
    "k1121112112k",
    "k1121112112k",
    ".k11111122k.",
    ".kk222222kk.",
    "...kkkkkk..."
  ];

  const MONEDA_GIRO = [
    "....kkkk....",
    "...k1111k...",
    "..k131112k..",
    "..k131112k..",
    "..k132122k..",
    "..k131212k..",
    "..k132122k..",
    "..k131212k..",
    "..k132122k..",
    "..k111122k..",
    "...k2222k...",
    "....kkkk...."
  ];

  const MONEDA_CANTO = [
    ".....kk.....",
    "....k32k....",
    "....k32k....",
    "....k32k....",
    "....k32k....",
    "....k32k....",
    "....k32k....",
    "....k32k....",
    "....k32k....",
    "....k32k....",
    "....k32k....",
    ".....kk....."
  ];

  /* -------------------------------------------------------
     INTERFAZ Y OBJETOS DEL NIVEL
     ------------------------------------------------------- */
  const CORAZON = [
    ".kk.kk.",
    "kxXkxxk",
    "kxxxxxk",
    ".kxxxk.",
    "..kxk..",
    "...k..."
  ];

  const CORAZON_VACIO = [
    ".kk.kk.",
    "kqqkqqk",
    "kqqqqqk",
    ".kqqqk.",
    "..kqk..",
    "...k..."
  ];

  const LAMPARA = [
    "......kkkkk.....",
    ".....kJJJJJk....",
    "....kJJJJJJJk...",
    "....kkkkkkkkk...",
    ".......kjk......",
    "......kjk.......",
    ".....kjk........",
    "....kjk.........",
    "....kjk.........",
    ".....kjk........",
    "......kjk.......",
    ".......kjk......",
    ".......kjk......",
    ".......kjk......",
    "....kkkkkkkk....",
    "...kjjjjjjjjk..."
  ];

  const DESPERTADOR = [
    "..kkk......kkk..",
    ".koook....koook.",
    ".kook.kkkk.kook.",
    "..kkkkzzzzkkkk..",
    "...kzzzzzzzzk...",
    "..kzzwwwwwwzzk..",
    ".kzzwwwwewwwzzk.",
    ".kzwwwwwewwwwzk.",
    ".kzwwwwweeeewzk.",
    ".kzwwwwwwwwwwzk.",
    ".kzzwwwwwwwwzzk.",
    "..kZzzwwwwzzZk..",
    "...kZZzzzzZZk...",
    "....kkkkkkkk....",
    "...kk......kk...",
    "..kk........kk.."
  ];

  /* -------------------------------------------------------
     CONSTRUCCIÓN
     ------------------------------------------------------- */
  function crearCanvas(ancho, alto) {
    const lienzo = document.createElement("canvas");
    lienzo.width = ancho;
    lienzo.height = alto;
    return lienzo;
  }

  function pintar(filas, cambios) {
    const paleta = Object.assign({}, PALETA, cambios || {});
    const alto = filas.length;
    const ancho = filas.reduce((max, fila) => Math.max(max, fila.length), 0);
    const lienzo = crearCanvas(ancho, alto);
    const ctx = lienzo.getContext("2d");

    filas.forEach((fila, y) => {
      if (fila.length !== ancho) {
        console.warn("Monky Dreams: fila de sprite con ancho distinto", fila);
      }
      for (let x = 0; x < fila.length; x++) {
        const color = paleta[fila[x]];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });

    return lienzo;
  }

  function espejo(lienzo) {
    const copia = crearCanvas(lienzo.width, lienzo.height);
    const ctx = copia.getContext("2d");
    ctx.translate(lienzo.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(lienzo, 0, 0);
    return copia;
  }

  /* Cada cuadro tiene versión derecha (der) e izquierda (izq) */
  function cuadro(filas, cambios) {
    const der = pintar(filas, cambios);
    return { der: der, izq: espejo(der) };
  }

  function construir() {
    return {
      mono: {
        quieto: [
          cuadro(mono(CABEZA_ABIERTA, TORSO, PIERNAS.quieto)),
          cuadro(mono(["................"].concat(CABEZA_ABIERTA), TORSO.slice(1), PIERNAS.quieto))
        ],
        parpadeo: cuadro(mono(CABEZA_CERRADA, TORSO, PIERNAS.quieto)),
        correr: [
          cuadro(mono(CABEZA_ABIERTA, TORSO_BRAZO_ADELANTE, PIERNAS.paso1)),
          cuadro(mono(CABEZA_ABIERTA, TORSO, PIERNAS.paso2)),
          cuadro(mono(CABEZA_ABIERTA, TORSO_BRAZO_ATRAS, PIERNAS.paso3)),
          cuadro(mono(CABEZA_ABIERTA, TORSO, PIERNAS.paso2))
        ],
        saltar: cuadro(mono(CABEZA_ABIERTA, TORSO_BRAZOS_ARRIBA, PIERNAS.salto)),
        caer: cuadro(mono(CABEZA_ABIERTA, TORSO_BRAZOS_ARRIBA, PIERNAS.paso1)),
        dolor: cuadro(mono(CABEZA_DOLOR, TORSO_BRAZOS_ARRIBA, PIERNAS.salto)),
        dormido: cuadro(mono(CABEZA_CERRADA, TORSO, PIERNAS.quieto))
      },
      bicho: [cuadro(BICHO_A), cuadro(BICHO_B)],
      pesadilla: [cuadro(PESADILLA_A), cuadro(PESADILLA_B)],
      moneda: (function () {
        const giro = cuadro(MONEDA_GIRO);
        return [
          cuadro(MONEDA_FRENTE),
          giro,
          cuadro(MONEDA_CANTO),
          { der: giro.izq, izq: giro.der }
        ];
      })(),
      corazon: cuadro(CORAZON),
      corazonVacio: cuadro(CORAZON_VACIO),
      lamparaApagada: cuadro(LAMPARA),
      lamparaEncendida: cuadro(LAMPARA, { J: "#e8792e", j: "#3f6d98" }),
      despertador: cuadro(DESPERTADOR)
    };
  }

  return {
    PALETA: PALETA,
    construir: construir,
    // Datos crudos expuestos para pruebas de integridad
    _datos: {
      CABEZA_ABIERTA, CABEZA_CERRADA, CABEZA_DOLOR, TORSO, TORSO_BRAZOS_ARRIBA,
      TORSO_BRAZO_ADELANTE, TORSO_BRAZO_ATRAS, PIERNAS, BICHO_A, BICHO_B,
      PESADILLA_A, PESADILLA_B, MONEDA_FRENTE, MONEDA_GIRO, MONEDA_CANTO, CORAZON, CORAZON_VACIO,
      LAMPARA, DESPERTADOR
    }
  };
})();
