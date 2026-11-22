/* =========================================================
   MONKY DREAMS — SPRITES PIXEL ART (16 bits)
   Todo el arte se dibuja con código. Los personajes son
   filas de texto: cada carácter es un color de la PALETA
   y "." es transparente. Los objetos redondos (monedas,
   destellos) se generan con geometría pixel a pixel.
   ========================================================= */

window.MonkySprites = (function () {
  "use strict";

  /* -------------------------------------------------------
     PALETA: rampas de 3-4 tonos por material.
     Azul noche, naranja MoncadaArt, dorado y crema.
     ------------------------------------------------------- */
  const PALETA = {
    k: "#16152a", // contorno azul noche

    // Gorra azul (sombra → brillo)
    C: "#142a45", c: "#24486e", l: "#3f6d98", L: "#7aa6cf",

    // Pelaje
    d: "#4e2614", b: "#7e4022", B: "#a8602f",

    // Cara
    F: "#c98756", f: "#f0b27c", g: "#ffd6a8", n: "#8a4524",

    // Ojos y boca
    w: "#fff7e8", e: "#16152a", m: "#ff8a3d", M: "#7a2e1a",

    // Sudadera crema y cordón naranja
    H: "#b49a74", h: "#ead7b5", j: "#fff4de", o: "#e8792e",

    // Pantalón y tenis
    p: "#2c2b46", P: "#46456e", s: "#e8792e", S: "#a94d17", x: "#fff1d6",

    // Bicho
    v: "#2f1f52", V: "#55398f", u: "#7e5cc4", U: "#b294f0", y: "#fff4de", r: "#ff9a3c",

    // Pesadilla
    N: "#120f24", q: "#2a2147", Q: "#43356f",

    // Corazón
    R: "#8f1d2c", z: "#e8473c", Z: "#ff9b8a",

    // Lámpara
    a: "#24486e", A: "#3f6d98", i: "#8b8aa6", I: "#c9c8dc", t: "#e8792e", T: "#ffc46b",

    // Despertador
    G: "#b9551c", O: "#f2c14e", W: "#fff1b0", K: "#ffe9a8",

    // Almohada voladora
    "1": "#fff4de", "2": "#d9c7a6", "3": "#a98f6c", "4": "#4f8bab", "5": "#2f5f7e", "6": "#ffffff"
  };

  /* -------------------------------------------------------
     MONKY 18x20 — cabeza (13 filas) + cuerpo (7 filas)
     Mira a la derecha. Gorra hacia atrás, como la mascota.
     ------------------------------------------------------- */
  const CABEZA = {
    normal: [
      "......kkkkkk......",
      "....kkcllLLlkk....",
      "...kcllllLLllck...",
      "..kccccllllllcck..",
      "kkkCccccccccccCk..",
      "kCCCkddbbbbbbbdk..",
      "kkk.kbbffffbfffbk.",
      ".kkkbffewffewfffk.",
      "kffkbffeeffeefffk.",
      "kfFkbffeeffeeffFk.",
      ".kkkbFffgggkkFk...",
      "...kbbFFggkmmkk...",
      "....kkbFFFFkkk...."
    ],
    parpadeo: [
      "......kkkkkk......",
      "....kkcllLLlkk....",
      "...kcllllLLllck...",
      "..kccccllllllcck..",
      "kkkCccccccccccCk..",
      "kCCCkddbbbbbbbdk..",
      "kkk.kbbffffbfffbk.",
      ".kkkbfffffffffffk.",
      "kffkbffkkffkkfffk.",
      "kfFkbffffffffffFk.",
      ".kkkbFffgggkkFk...",
      "...kbbFFggkmmkk...",
      "....kkbFFFFkkk...."
    ],
    feliz: [
      "......kkkkkk......",
      "....kkcllLLlkk....",
      "...kcllllLLllck...",
      "..kccccllllllcck..",
      "kkkCccccccccccCk..",
      "kCCCkddbbbbbbbdk..",
      "kkk.kbbffffbfffbk.",
      ".kkkbffkkffkkfffk.",
      "kffkbfkffkkffkffk.",
      "kfFkbffffffffffFk.",
      ".kkkbFffgkMMMkk...",
      "...kbbFFgkmmmkk...",
      "....kkbFFFFkkk...."
    ],
    dolor: [
      "......kkkkkk......",
      "....kkcllLLlkk....",
      "...kcllllLLllck...",
      "..kccccllllllcck..",
      "kkkCccccccccccCk..",
      "kCCCkddbbbbbbbdk..",
      "kkk.kbbffffbfffbk.",
      ".kkkbffkffffkfffk.",
      "kffkbfffkffkffffk.",
      "kfFkbffkffffkffFk.",
      ".kkkbFffgkMMMkk...",
      "...kbbFFgkmmmkk...",
      "....kkbFFFFkkk...."
    ],
    dormido: [
      "......kkkkkk......",
      "....kkcllLLlkk....",
      "...kcllllLLllck...",
      "..kccccllllllcck..",
      "kkkCccccccccccCk..",
      "kCCCkddbbbbbbbdk..",
      "kkk.kbbffffbfffbk.",
      ".kkkbfffffffffffk.",
      "kffkbffkkffkkfffk.",
      "kfFkbffffffffffFk.",
      ".kkkbFffgggfkFk...",
      "...kbbFFggkkkkk...",
      "....kkbFFFFkkk...."
    ]
  };

  /* Cuerpo: 7 filas (13 a 19) */
  const CUERPO = {
    quieto: [
      ".....khhhhhhhk....",
      "....khjjhohhohk...",
      "...kBkjhhhhhhhkBk.",
      "bb.kkHhhhhhhHkk...",
      ".bb.kpppkpppPk....",
      "....ksssk.ksssk...",
      "....kxxxk.kxxxxk.."
    ],
    respira: [
      ".....khhhhhhhk....",
      "....khjjhohhohk...",
      "...kBkjhhhhhhhkBk.",
      "bb.kkHhhhhhhHkk...",
      ".bb.kpppkpppPk....",
      "....ksssk.ksssk...",
      "....kxxxk.kxxxxk.."
    ],
    paso1: [
      ".....khhhhhhhk....",
      "....khjjhohhohkBk.",
      "...kBkjhhhhhhhk...",
      "bb.kkHhhhhhhHk....",
      ".bbkppk...kpppk...",
      "..kssk.....kssssk.",
      "..kxxk.....kxxxxk."
    ],
    paso2: [
      ".....khhhhhhhk....",
      "....khjjhohhohk...",
      "...kBkjhhhhhhhkBk.",
      "bb.kkHhhhhhhHk....",
      ".bb.kpppPpk.......",
      "....kssssssk......",
      "....kxxxxxxk......"
    ],
    paso3: [
      ".....khhhhhhhk....",
      "...kBkjjhohhohk...",
      "....khjhhhhhhhkBk.",
      "bb.kkHhhhhhhHk....",
      ".bb.kpk....kppk...",
      ".kssk.....ksssk...",
      ".kxxk.....kxxxk..."
    ],
    salto: [
      "...kBkhhhhhhhkBk..",
      "....khjjhohhohk...",
      "....khhhhhhhhhk...",
      "bb..kHhhhhhhHk....",
      ".bb.kpppkpppk.....",
      "....kssk.kssk.....",
      "....kxxk.kxxk....."
    ],
    caida: [
      "...kBkhhhhhhhkBk..",
      "....khjjhohhohk...",
      "....khhhhhhhhhk...",
      "bb..kHhhhhhhHk....",
      ".bb.kppk..kppk....",
      "...kssk....kssk...",
      "...kxxk....kxxk..."
    ],
    festejo: [
      "..kBk.khhhhhk.kBk.",
      "...kkkhjjhohokk...",
      "....khhhhhhhhhk...",
      "bb..kHhhhhhhHk....",
      ".bb.kpppkpppk.....",
      "....kssk.kssk.....",
      "....kxxk.kxxk....."
    ]
  };

  /* Combina cabeza y cuerpo; dy mueve la cabeza (rebote al correr) */
  function monky(cabeza, cuerpo, dy) {
    const filas = [];
    for (let i = 0; i < 20; i++) filas.push("..................".split(""));
    CUERPO[cuerpo].forEach((fila, i) => {
      for (let x = 0; x < 18; x++) if (fila[x] !== ".") filas[13 + i][x] = fila[x];
    });
    CABEZA[cabeza].forEach((fila, i) => {
      const y = i + (dy || 0);
      if (y < 0 || y >= 20) return;
      for (let x = 0; x < 18; x++) if (fila[x] !== ".") filas[y][x] = fila[x];
    });
    return filas.map((f) => f.join(""));
  }

  /* -------------------------------------------------------
     ENEMIGOS
     ------------------------------------------------------- */
  const BICHO_CUERPO = [
    "...k........k...",
    "....k......k....",
    "....kkkkkkkk....",
    "...kuUUuuuuuk...",
    "..kuUUuuuuuuuk..",
    ".kuUuuuuyykyykk.",
    ".kVuuuuuyykyykk.",
    ".kVVuuuuuuuuuuk.",
    ".kvVVkrrrrrrkVk.",
    "..kvVVkkkkkkVk..",
    "...kkkkkkkkkk..."
  ];

  const BICHO_PATAS = [
    ["...k.k....k.k...", "..k...k..k...k.."],
    ["....k.k..k.k....", "....k.k..k.k...."],
    ["..k.k......k.k..", ".k...k....k...k."]
  ];

  const PESADILLA = [
    [
      "......kkkkk.....",
      "....kkqqqqqkk...",
      "...kqQQqqqqqqk..",
      "..kqQQqqqqqqqqk.",
      "..kqQqqqqqqqqqk.",
      ".kqqqrrqqqqrrqqk",
      ".kqqrrkqqqrrkqqk",
      ".kqqqqqqqqqqqqqk",
      ".kqqqkkkkkkkqqqk",
      ".kqqkwkwkwkwkqqk",
      ".kqqqkkkkkkkqqqk",
      ".kqqqqqqqqqqqqqk",
      ".kqQqqqqqqqqQqqk",
      "..kqqqkqqqkqqqk.",
      "..kqk.kqqk.kqk..",
      "...k...kk...k..."
    ],
    [
      "......kkkkk.....",
      "....kkqqqqqkk...",
      "...kqQQqqqqqqk..",
      "..kqQQqqqqqqqqk.",
      "..kqQqqqqqqqqqk.",
      ".kqqqrrqqqqrrqqk",
      ".kqqrrkqqqrrkqqk",
      ".kqqqqqqqqqqqqqk",
      ".kqqqkkkkkkkqqqk",
      ".kqqkwkwkwkwkqqk",
      ".kqqqkkkkkkkqqqk",
      ".kqqqqqqqqqqqqqk",
      ".kqQqqqqqqqqQqqk",
      ".kqqqqkqqkqqqqk.",
      ".kqk..kqqk..kqk.",
      "..k....kk....k.."
    ]
  ];

  /* -------------------------------------------------------
     INTERFAZ Y OBJETOS
     ------------------------------------------------------- */
  const CORAZON = [
    ".kk.kk..",
    "kzZkzzk.",
    "kzzzzzk.",
    "kRzzzRk.",
    ".kRzRk..",
    "..kRk...",
    "...k...."
  ];

  const LAMPARA = [
    "......kkkkkk....",
    ".....kttTTttk...",
    "....kttttTtttk..",
    "...ktttttttttk..",
    "...kkkkkkkkkkk..",
    "......kIk.......",
    ".....kIik.......",
    "....kIik........",
    "...kIik.........",
    "...kIik.........",
    "....kIik........",
    ".....kIik.......",
    "......kIik......",
    "......kIik......",
    "......kIik......",
    "...kkkkkkkkk....",
    "..kAAAAAAAAAk...",
    "..kaaaaaaaaak...",
    "...kkkkkkkkk...."
  ];

  const DESPERTADOR = [
    "...kkk.......kkk....",
    "..kOWOk.....kOWOk...",
    ".kOOOk.kkkkk.kOOOk..",
    ".kkkkkkGzzzGkkkkkk..",
    "...kkzzzzzzzzzkk....",
    "..kzzzzzzzzzzzzzk...",
    ".kzzzWWWWWWWWzzzzk..",
    ".kzzWWWWWkWWWWWzzk..",
    "kzzWWWWWWkWWWWWWzzk.",
    "kzzWWWWWWkWWWWWWzzk.",
    "kzzWWWWWWkkkkkWWzzk.",
    "kzzWWWWWWWWWWWWWzzk.",
    ".kzzWWWWWWWWWWWzzk..",
    ".kGzzWWWWWWWWWzzGk..",
    "..kGzzzWWWWWzzzGk...",
    "...kGGzzzzzzzGGk....",
    "....kkkkkkkkkkk.....",
    "...kGk.......kGk....",
    "..kkk.........kkk..."
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
      if (fila.length !== ancho) console.warn("Monky Dreams: fila de sprite irregular", fila);
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

  /* Silueta de un color (destello blanco al recibir daño) */
  function silueta(lienzo, color) {
    const copia = crearCanvas(lienzo.width, lienzo.height);
    const ctx = copia.getContext("2d");
    ctx.drawImage(lienzo, 0, 0);
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, copia.width, copia.height);
    return copia;
  }

  function cuadro(filas, cambios) {
    const der = pintar(filas, cambios);
    return { der: der, izq: espejo(der), blanco: silueta(der, "#fff7e8"), blancoIzq: silueta(espejo(der), "#fff7e8") };
  }

  function desdeLienzo(lienzo) {
    return { der: lienzo, izq: espejo(lienzo) };
  }

  /* Moneda MoncadaArt: 8 cuadros de giro generados con geometría */
  function moneda(angulo) {
    const T = 12;
    const c = crearCanvas(T, T);
    const ctx = c.getContext("2d");
    const ancho = Math.max(1.6, 5.4 * Math.abs(Math.cos(angulo)));
    const alto = 5.6;
    const frente = Math.cos(angulo) >= 0;
    const px = (x, y, color) => { ctx.fillStyle = color; ctx.fillRect(x, y, 1, 1); };
    const dentro = (x, y) => ((x + 0.5 - 6) / ancho) ** 2 + ((y + 0.5 - 6) / alto) ** 2 <= 1;

    for (let y = 0; y < T; y++) {
      for (let x = 0; x < T; x++) {
        if (!dentro(x, y)) continue;
        const borde = !dentro(x - 1, y) || !dentro(x + 1, y) || !dentro(x, y - 1) || !dentro(x, y + 1);
        if (borde) { px(x, y, "#16152a"); continue; }
        const rel = (x + 0.5 - 6) / ancho; // -1 izquierda, 1 derecha
        let color = "#f2c14e";
        if (rel < -0.35 || y < 4) color = "#ffe08a";
        if (rel > 0.4 || y > 8) color = "#c98a1e";
        if (ancho < 2.2) color = y % 3 === 0 ? "#ffe08a" : "#d9a032";
        px(x, y, color);
      }
    }

    // Emblema "M" cuando la moneda mira de frente
    if (ancho > 4) {
      const tono = frente ? "#9a5f10" : "#b3761a";
      [[4, 4], [4, 5], [4, 6], [4, 7], [5, 5], [6, 6], [7, 5], [8, 4], [8, 5], [8, 6], [8, 7]].forEach(([x, y]) => px(x, y, tono));
      px(3, 3, "#fff7d6");
    }
    return c;
  }

  /* Destello de 4 puntas (recoger monedas, brillo) */
  function destello(radio, color) {
    const t = radio * 2 + 1;
    const c = crearCanvas(t, t);
    const ctx = c.getContext("2d");
    ctx.fillStyle = color;
    for (let i = -radio; i <= radio; i++) {
      ctx.fillRect(radio + i, radio, 1, 1);
      ctx.fillRect(radio, radio + i, 1, 1);
    }
    if (radio > 1) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(radio, radio, 1, 1);
    }
    return c;
  }

  /* Nube de polvo: 4 cuadros que crecen y se deshacen por el borde */
  function polvo(i) {
    const c = crearCanvas(8, 8);
    const ctx = c.getContext("2d");
    const r = [2.2, 3, 3.5, 3.8][i];
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const d = Math.hypot(x + 0.5 - 4, y + 0.5 - 4.5);
        if (d > r) continue;
        const exterior = d > r - 1.2;
        if (i >= 2 && exterior && (x + y) % 2 === 0) continue;
        if (i === 3 && !exterior && (x * 3 + y) % 4 === 0) continue;
        ctx.fillStyle = exterior ? "#cdbb9b" : y < 4 ? "#fff4de" : "#f3e4c8";
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  function construir() {
    const m = {
      quieto: [cuadro(monky("normal", "quieto", 0)), cuadro(monky("normal", "respira", 1))],
      parpadeo: cuadro(monky("parpadeo", "quieto", 0)),
      correr: [
        cuadro(monky("normal", "paso1", 1)),
        cuadro(monky("normal", "paso1", 1)),
        cuadro(monky("normal", "paso2", 0)),
        cuadro(monky("normal", "paso3", 1)),
        cuadro(monky("normal", "paso3", 1)),
        cuadro(monky("normal", "paso2", 0))
      ],
      saltar: cuadro(monky("normal", "salto", 0)),
      caer: cuadro(monky("normal", "caida", 0)),
      dolor: cuadro(monky("dolor", "caida", 0)),
      festejo: [cuadro(monky("feliz", "festejo", 0)), cuadro(monky("feliz", "salto", 1))],
      dormido: [cuadro(monky("dormido", "quieto", 0)), cuadro(monky("dormido", "respira", 1))]
    };

    const bicho = BICHO_PATAS.map((patas) => cuadro(BICHO_CUERPO.concat(patas)));
    const monedas = [];
    for (let i = 0; i < 8; i++) {
      const lienzo = moneda((i / 8) * Math.PI * 2);
      monedas.push({ der: lienzo, izq: lienzo });
    }

    return {
      mono: m,
      bicho: bicho,
      pesadilla: PESADILLA.map((f) => cuadro(f)),
      moneda: monedas,
      corazon: cuadro(CORAZON),
      corazonVacio: cuadro(CORAZON, { z: "#3a3656", Z: "#4d4870", R: "#2a2742" }),
      lamparaApagada: cuadro(LAMPARA, { t: "#6d6a8a", T: "#8f8cab" }),
      lamparaEncendida: cuadro(LAMPARA),
      despertador: cuadro(DESPERTADOR),
      destello: [destello(1, "#fff1b0"), destello(2, "#ffe08a"), destello(3, "#f2c14e")].map(desdeLienzo),
      polvo: [0, 1, 2, 3].map((i) => desdeLienzo(polvo(i))),
      crearCanvas: crearCanvas
    };
  }

  return {
    PALETA: PALETA,
    construir: construir,
    _datos: { CABEZA, CUERPO, BICHO_CUERPO, BICHO_PATAS, PESADILLA, CORAZON, LAMPARA, DESPERTADOR }
  };
})();
