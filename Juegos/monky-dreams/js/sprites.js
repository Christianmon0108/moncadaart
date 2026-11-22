/* =========================================================
   MONKY RUN — SPRITES PIXEL ART (16 bits)
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
     CARRERA INFINITA: poderes, enemigos nuevos y alas
     ------------------------------------------------------- */
  const ALAS_A = [
    "..kk...",
    ".k66k..",
    "k6666k.",
    ".kk66k.",
    "...kk.."
  ];

  const ALAS_B = [
    ".......",
    "kkkk...",
    "k6666k.",
    ".k666k.",
    "..kkk.."
  ];

  const P_ESCUDO = [
    "..kkkkkkkk..",
    ".klllLLlllk.",
    ".kllLLLLllk.",
    ".kllL66Lllk.",
    ".kllL66Lllk.",
    ".kllLLLLllk.",
    "..kllLLllk..",
    "..kllllllk..",
    "...kllllk...",
    "....kllk....",
    ".....kk.....",
    "............"
  ];

  const P_IMAN = [
    "............",
    "...kkkkkk...",
    "..kzzzzzzk..",
    ".kzzkkkkzzk.",
    ".kzk....kzk.",
    ".kzk....kzk.",
    ".kzk....kzk.",
    ".kzk....kzk.",
    ".k6k....k6k.",
    ".k6k....k6k.",
    ".kkk....kkk.",
    "............"
  ];

  const P_DOBLE = [
    "............",
    ".......kk...",
    "......k66k..",
    ".....k666k..",
    "....k666kk..",
    "...k666k6k..",
    "..k666k66k..",
    "..k66k66k...",
    ".k66k66k....",
    ".k6k66k.....",
    "kkkkkk......",
    "............"
  ];

  const P_IMPULSO = [
    "............",
    "......kkkk..",
    ".....kOOOk..",
    "....kOOOk...",
    "...kOOOkkkk.",
    "..kOWOOOOOk.",
    ".kkkkOOOOk..",
    "....kOOOk...",
    "...kOOOk....",
    "..kOOk......",
    "..kkk.......",
    "............"
  ];

  const HONGO = [
    "....kkkkkkk.....",
    "..kkzzzzzzzkk...",
    ".kzz66zzzz66zk..",
    "kzz666zzzz666zk.",
    "kzzzzzzzzzzzzzk.",
    "kkzzzz66zzzzzkk.",
    ".kkkkkkkkkkkkk..",
    "...khhhhhhhk....",
    "...khkhhhkhk....",
    "...khhhhhhhk....",
    "...khkkkkkhk....",
    "....khhhhhk.....",
    "....kk...kk.....",
    "...kkk...kkk...."
  ];

  const POLILLA_A = [
    "..kk........kk..",
    ".kUUk......kUUk.",
    ".kUuUk....kUuUk.",
    "..kUuUkkkkUuUk..",
    "...kUuvvvvuUk...",
    "....kvyvvyvk....",
    "....kvvvvvvk....",
    ".....kvvvvk.....",
    "......k..k......",
    "................",
    "................",
    "................"
  ];

  const POLILLA_B = [
    "................",
    "................",
    "......kkkk......",
    "....kkvvvvkk....",
    "..kkUkvyyvkUkk..",
    ".kUUukvvvvkuUUk.",
    "kUUuukvvvvkuuUUk",
    ".kUuk.kvvk.kuUk.",
    "..kk...kk...kk..",
    "................",
    "................",
    "................"
  ];

  const DRON_A = [
    "..kkkk....kkkk..",
    ".....k....k.....",
    "...kkkkkkkkkk...",
    "..kAAAAAAAAAAk..",
    ".kAAIIAAAAAAAAk.",
    ".kAAkrrkAAAAAAk.",
    ".kAAkrrkAAAAAAk.",
    ".kAAAAAAAAAAAAk.",
    "..kaaaaaaaaaak..",
    "...kkkkkkkkkk...",
    "....k......k....",
    "...kk......kk..."
  ];

  const DRON_B = [
    "....kk....kk....",
    ".....k....k.....",
    "...kkkkkkkkkk...",
    "..kAAAAAAAAAAk..",
    ".kAAIIAAAAAAAAk.",
    ".kAAkrrkAAAAAAk.",
    ".kAAkrrkAAAAAAk.",
    ".kAAAAAAAAAAAAk.",
    "..kaaaaaaaaaak..",
    "...kkkkkkkkkk...",
    "....k......k....",
    "...kk......kk..."
  ];

  const CUERVO_A = [
    "...kk.............",
    "..kqqk............",
    "..kqQqk......kk...",
    "...kqQqk...kkqqk..",
    "....kqqqkkkqqqqk..",
    ".....kqqqqqqqrkk..",
    "......kqqqqqqqkkk.",
    ".......kqqqqqk....",
    "........kkkkk.....",
    "..................",
    "..................",
    ".................."
  ];

  const CUERVO_B = [
    "..................",
    "..................",
    "..........kk......",
    ".........kqqk.....",
    "...kkkkkkqqqqk....",
    "..kqqqqqqqqqrkk...",
    ".kqQqqqqqqqqqqkkk.",
    "kqQqk.kqqqqqk.....",
    "kqk....kkkkk......",
    "kk................",
    "..................",
    ".................."
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
      if (fila.length !== ancho) console.warn("Monky Run: fila de sprite irregular", fila);
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


  /* Tronco rodante: 4 cuadros de giro */
  function tronco(cuadroN) {
    const c = crearCanvas(16, 14);
    const g = c.getContext("2d");
    const ang = (cuadroN / 4) * Math.PI;
    for (let y = 0; y < 14; y++) for (let x = 0; x < 16; x++) {
      const dx = x + 0.5 - 8, dy = y + 0.5 - 7;
      const d = Math.hypot(dx, dy);
      if (d > 6.9) continue;
      let color = "#d9a066";
      if (d > 5.9) color = "#16152a";
      else if (d > 4.6) color = (Math.atan2(dy, dx) * 3 + cuadroN) % 2 > 1 ? "#7e4022" : "#a8602f";
      else if (Math.abs(d - 2.6) < 0.6) color = "#a8602f";
      else if (Math.abs(dx * Math.sin(ang) - dy * Math.cos(ang)) < 0.6) color = "#8a5538";
      g.fillStyle = color;
      g.fillRect(x, y, 1, 1);
    }
    return c;
  }

  /* Burbuja de poder (16x16) con el icono dentro */
  function burbuja(icono, color) {
    const c = crearCanvas(16, 16);
    const g = c.getContext("2d");
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const d = Math.hypot(x + 0.5 - 8, y + 0.5 - 8);
      if (d > 7.8) continue;
      if (d > 6.9) g.fillStyle = "#16152a";
      else if (d > 5.9) g.fillStyle = color;
      else g.fillStyle = (x + y) % 2 === 0 ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.04)";
      g.fillRect(x, y, 1, 1);
    }
    g.drawImage(icono, 2, 2);
    g.fillStyle = "#ffffff";
    g.fillRect(4, 3, 2, 1); g.fillRect(3, 4, 1, 2);
    return c;
  }


  /* -------------------------------------------------------
     TINTA: gota que cae y charco (El Cuaderno)
     ------------------------------------------------------- */
  function gotaTinta(fase) {
    const c = crearCanvas(12, 14), g = c.getContext("2d");
    const dentro = (x, y) => {
      const yy = y - 1;
      if (yy < 0) return false;
      const r = yy < 6 ? (yy / 6) * 4.2 : Math.sqrt(Math.max(0, 16 - (yy - 8.5) * (yy - 8.5) * 0.9)) + 0.3;
      return Math.abs(x - 5.5) <= r;
    };
    for (let y = 0; y < 14; y++) for (let x = 0; x < 12; x++) {
      if (!dentro(x, y)) continue;
      const borde = !dentro(x - 1, y) || !dentro(x + 1, y) || !dentro(x, y - 1) || !dentro(x, y + 1);
      g.fillStyle = borde ? "#05060f" : (x <= 4 && y >= 6 && y <= 9) ? "#4a5ab8" : y > 10 ? "#0e1130" : "#1b2050";
      g.fillRect(x, y, 1, 1);
    }
    g.fillStyle = "#c9d2ff"; g.fillRect(4, 7 + (fase % 2), 1, 1);
    return c;
  }

  function charcoTinta(fase) {
    const c = crearCanvas(18, 6), g = c.getContext("2d");
    for (let x = 0; x < 18; x++) {
      const alto = Math.round(2.5 + Math.sin(x * 0.7 + fase) * 0.8 + (x > 3 && x < 14 ? 1.5 : 0));
      for (let y = 6 - alto; y < 6; y++) {
        g.fillStyle = y === 6 - alto ? "#05060f" : y === 6 - alto + 1 ? (x % 4 === fase % 4 ? "#c9d2ff" : "#4a5ab8") : "#1b2050";
        g.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }


  /* Estrella fugaz (recompensa de evento) */
  function estrella(fase) {
    const c = crearCanvas(16, 16), g = c.getContext("2d");
    const puntas = 5, rExt = 7.4, rInt = 3.2, cx = 7.5, cy = 8;
    const dentro = (x, y) => {
      const ang = Math.atan2(y - cy, x - cx) + Math.PI / 2 + fase * 0.12;
      const d = Math.hypot(x - cx, y - cy);
      const k = ((ang / (Math.PI * 2)) * puntas % 1 + 1) % 1;
      const r = rInt + (rExt - rInt) * Math.abs(1 - 2 * k);
      return d <= r;
    };
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      if (!dentro(x, y)) continue;
      const borde = !dentro(x - 1, y) || !dentro(x + 1, y) || !dentro(x, y - 1) || !dentro(x, y + 1);
      g.fillStyle = borde ? "#7a3a12" : (x < cx && y < cy) ? "#fff8c8" : y > cy + 1 ? "#f2a93b" : "#ffe08a";
      g.fillRect(x, y, 1, 1);
    }
    g.fillStyle = "#16152a"; g.fillRect(6, 7, 1, 2); g.fillRect(9, 7, 1, 2);
    return c;
  }

  /* -------------------------------------------------------
     EL GRAN BORRADOR: máquina gigante con orugas, brazo
     mecánico y una goma de borrar enorme (mira a la derecha)
     ------------------------------------------------------- */
  function granBorrador(f) {
    const W = 100, H = 84;
    const c = crearCanvas(W, H), g = c.getContext("2d");
    const P = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
    const caja = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    const K = "#16152a";
    // Contorno + relleno de un rectángulo con luz y sombra
    const placa = (x, y, w, h, base, luz, sombra) => {
      caja(x - 1, y - 1, w + 2, h + 2, K);
      caja(x, y, w, h, base);
      caja(x, y, w, 1, luz); caja(x, y, 1, h, luz);
      caja(x, y + h - 1, w, 1, sombra); caja(x + w - 1, y, 1, h, sombra);
    };
    // Chimenea
    placa(12, 4, 9, 30, "#4c5366", "#6b7489", "#2e3342");
    placa(10, 2, 13, 4, "#2e3342", "#4c5366", "#1d2130");
    // Cabina con ojo
    placa(20, 14, 40, 22, "#5a6278", "#7b849c", "#3a4052");
    placa(24, 18, 14, 8, "#1d2130", "#2e3342", "#11131d");          // ventana
    P(26, 19, "#5ff0ff"); P(27, 19, "#2bb8d8");
    const ojoX = 48, ojoY = 24, brillo = f % 2 ? "#ff6b6b" : "#ff4d4d";
    for (let y = -6; y <= 6; y++) for (let x = -6; x <= 6; x++) {
      const d = Math.hypot(x, y);
      if (d <= 6.2) P(ojoX + x, ojoY + y, d > 5.2 ? K : d > 3.8 ? "#8a1222" : d > 1.6 ? brillo : "#ffd0d0");
    }
    caja(40, 15, 16, 2, K); caja(41, 17, 5, 1, K);                    // ceja enojada
    // Chasis
    placa(6, 36, 64, 24, "#7a8296", "#9aa3b8", "#4c5366");
    for (let x = 6; x < 70; x++) for (let y = 52; y < 58; y++) P(x, y, ((x + y + f * 2) % 8) < 4 ? "#f2c14e" : K);
    [[10, 40], [24, 40], [38, 40], [52, 40], [64, 40]].forEach(([x, y]) => { P(x, y, "#c9d0dd"); P(x + 1, y + 1, "#4c5366"); });
    // Tubos y medidores
    caja(30, 42, 18, 6, K); caja(31, 43, 16, 4, "#3a4052");
    P(34 + (f % 4) * 3, 44, "#8be38b"); P(35 + (f % 4) * 3, 45, "#8be38b");
    // Orugas
    placa(2, 62, 72, 18, "#2e3342", "#4c5366", "#1d2130");
    for (let x = 3; x < 74; x++) if ((x + f * 3) % 6 < 2) { P(x, 62, "#6b7489"); P(x, 79, "#6b7489"); }
    [12, 28, 44, 60].forEach((cx) => {
      const cy = 71;
      for (let y = -7; y <= 7; y++) for (let x = -7; x <= 7; x++) {
        const d = Math.hypot(x, y);
        if (d > 7.2) continue;
        let col = d > 6.2 ? K : d > 4.5 ? "#9aa3b8" : "#5a6278";
        const ang = Math.atan2(y, x) + f * (Math.PI / 6);
        if (d <= 4.5 && d > 1 && Math.abs(Math.sin(ang * 2)) < 0.3) col = "#c9d0dd";
        if (d <= 1.5) col = K;
        P(cx + x, cy + y, col);
      }
    });
    // Brazo mecánico (dos segmentos con pistón) que sostiene la goma
    const fregar = [0, 2, 0, -2][f % 4];
    placa(66, 40, 10, 6, "#9aa3b8", "#c9d0dd", "#5a6278");
    placa(74, 34 + fregar, 6, 12, "#5a6278", "#7b849c", "#3a4052");
    caja(76, 30 + fregar, 2, 6, "#c9d0dd");
    // Segundo brazo: pinza articulada que sale de la cabina
    const abre = f % 2;
    placa(58, 20, 8, 4, "#9aa3b8", "#c9d0dd", "#5a6278");
    placa(65, 12, 4, 12, "#5a6278", "#7b849c", "#3a4052");
    placa(66, 10, 12, 4, "#9aa3b8", "#c9d0dd", "#5a6278");
    caja(77, 6 - abre, 2, 5, K); caja(78, 6 - abre, 3, 1, K);       // dedo de arriba
    caja(77, 13 + abre, 2, 4, K); caja(78, 16 + abre, 3, 1, K);      // dedo de abajo
    caja(76, 9, 2, 6, "#c9d0dd");
    // Goma de borrar gigante (rosa con funda azul)
    const gx = 78, gy = 24 + fregar, gw = 20, gh = 40;
    caja(gx - 1, gy - 1, gw + 2, gh + 2, K);
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
      let col = x < 3 ? "#ffd0da" : x > gw - 4 ? "#d9567a" : "#ff8fab";
      if (y < 2) col = "#ffe3ea";
      if (y > gh - 3) col = "#c24466";
      if (y >= 10 && y < 26) col = x < 3 ? "#7aa6ff" : x > gw - 4 ? "#22489c" : "#3b6fd8";     // funda
      if (y >= 15 && y < 20 && x >= 5 && x < gw - 4 && (x + y) % 3 === 0) col = "#fff7e8";     // letras de la funda
      P(gx + x, gy + y, col);
    }
    // Borde gastado de la goma
    for (let y = 2; y < gh - 2; y += 3) P(gx + gw - 1, gy + y, "#ffe3ea");
    return c;
  }

  /* Garabato: un enredo de rayas de lápiz con ojos (Cuaderno) */
  function garabato(f) {
    const c = crearCanvas(16, 14), g = c.getContext("2d");
    const P = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
    const lazos = [[7.5, 6, 5.2, 4.2], [6, 5.5, 3.4, 3], [9.5, 6.5, 3.6, 3.2], [7.5, 7, 4.2, 2]];
    lazos.forEach(([cx, cy, rx, ry], i) => {
      for (let a = 0; a < Math.PI * 2; a += 0.12) {
        const x = Math.round(cx + Math.cos(a + i + f * 0.4) * rx), y = Math.round(cy + Math.sin(a + i) * ry);
        P(x, y, i % 2 ? "#5a5f73" : "#2e3142");
      }
    });
    [[5, 5], [9, 5]].forEach(([x, y]) => { g.fillStyle = "#16152a"; g.fillRect(x - 1, y - 1, 4, 4); g.fillStyle = "#fff7e8"; g.fillRect(x, y, 2, 2); P(x + 1, y + 1, "#16152a"); });
    const patas = [[3, 12, 5, 13], [10, 12, 12, 13], [4, 12, 3, 13], [11, 12, 10, 13]];
    const p = f % 2 ? [patas[0], patas[1]] : [patas[2], patas[3]];
    p.forEach(([x0, y0, x1, y1]) => { P(x0, y0, "#2e3142"); P(x1, y1, "#2e3142"); });
    return c;
  }

  /* Lápiz volador (apunta a la izquierda) */
  function lapizVolador() {
    const filas = [
      "....kkkkkkkkkkkkkk",
      "..kkwwYYYYYYYYYYmmJk",
      "kgkwwwyyyyyyyyyymmJJk",
      "..kkwwYYYYYYYYYYmmJk",
      "....kkkkkkkkkkkkkk"
    ];
    const colores = { k: "#16152a", g: "#3a3d4e", w: "#e8c08a", Y: "#f2c14e", y: "#ffd86b", m: "#b9c0cc", J: "#ff8fab" };
    const c = crearCanvas(21, 5), g = c.getContext("2d");
    filas.forEach((f, y) => { for (let x = 0; x < f.length; x++) if (colores[f[x]]) { g.fillStyle = colores[f[x]]; g.fillRect(x, y, 1, 1); } });
    return c;
  }

  /* Engranaje que rueda y salta (Fábrica de Ideas) */
  function engranaje(f) {
    const c = crearCanvas(16, 16), g = c.getContext("2d");
    const P = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const dx = x - 7.5, dy = y - 7.5, d = Math.hypot(dx, dy);
      const ang = Math.atan2(dy, dx) - f * (Math.PI / 16);
      const r = 5.4 + (Math.cos(ang * 8) > 0.35 ? 2.2 : 0);
      if (d > r) continue;
      let col = d > r - 1 ? "#16152a" : d < 2 ? "#16152a" : d < 3.2 ? "#ff6b4a" : (dx + dy < 0 ? "#c9d0dd" : "#7a8296");
      P(x, y, col);
    }
    return c;
  }

  /* Chispa eléctrica que se lanza en picada (Fábrica de Ideas) */
  function chispa(f) {
    const c = crearCanvas(14, 12), g = c.getContext("2d");
    const P = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
    for (let y = 0; y < 12; y++) for (let x = 0; x < 14; x++) {
      const d = Math.hypot(x - 7, y - 6);
      if (d < 2.2) P(x, y, "#ffffff");
      else if (d < 3.6) P(x, y, "#fff1b0");
      else if (d < 4.4) P(x, y, "#f2c14e");
    }
    const rayos = f % 2 ? [[1, 2], [12, 3], [2, 10], [12, 10]] : [[0, 6], [13, 6], [7, 0], [7, 11]];
    rayos.forEach(([x, y]) => { P(x, y, "#5ff0ff"); P(Math.round((x + 7) / 2), Math.round((y + 6) / 2), "#d6fdff"); });
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
      dormido: [cuadro(monky("dormido", "quieto", 0)), cuadro(monky("dormido", "respira", 1))],
      deslizar: [
        cuadro(CABEZA.normal.concat(["bbb.kssskksssssk.."])),
        cuadro(CABEZA.normal.concat([".bbbksssk.ksssssk."]))
      ]
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
      alas: [cuadro(ALAS_A), cuadro(ALAS_B)],
      poderes: {
        escudo: desdeLienzo(burbuja(pintar(P_ESCUDO), "#7aa6cf")),
        iman: desdeLienzo(burbuja(pintar(P_IMAN), "#ff6b6b")),
        doble: desdeLienzo(burbuja(pintar(P_DOBLE), "#e7dcf6")),
        impulso: desdeLienzo(burbuja(pintar(P_IMPULSO), "#ffb35a"))
      },
      iconos: {
        escudo: pintar(P_ESCUDO), iman: pintar(P_IMAN), doble: pintar(P_DOBLE), impulso: pintar(P_IMPULSO)
      },
      hongo: [cuadro(HONGO), cuadro(HONGO, { z: "#7a2a55", "6": "#c2507a", h: "#5a4466" })],
      polilla: [cuadro(POLILLA_A), cuadro(POLILLA_B)],
      dron: [cuadro(DRON_A), cuadro(DRON_B)],
      cuervo: [cuadro(CUERVO_A), cuadro(CUERVO_B)],
      tronco: [0, 1, 2, 3].map((i) => desdeLienzo(tronco(i))),
      bichoDigital: BICHO_PATAS.map((patas) => cuadro(BICHO_CUERPO.concat(patas), { u: "#2bb8d8", U: "#5ff0ff", V: "#1a6f8f", v: "#0c3550", r: "#ff6bd5" })),
      gota: [0, 1].map((i) => desdeLienzo(gotaTinta(i))),
      borrador: [0, 1, 2, 3].map((i) => desdeLienzo(granBorrador(i))),
      garabato: [0, 1, 2].map((i) => desdeLienzo(garabato(i))),
      lapiz: desdeLienzo(lapizVolador()),
      engranaje: [0, 1, 2, 3].map((i) => desdeLienzo(engranaje(i))),
      chispa: [0, 1].map((i) => desdeLienzo(chispa(i))),
      mariposa: [cuadro(POLILLA_A, { U: "#ff8fd1", u: "#7ff0d0", v: "#6a3a9c", y: "#fff7e8" }), cuadro(POLILLA_B, { U: "#ff8fd1", u: "#7ff0d0", v: "#6a3a9c", y: "#fff7e8" })],
      charco: [0, 1, 2, 3].map((i) => desdeLienzo(charcoTinta(i))),
      estrella: [0, 1, 2, 3, 4, 5].map((i) => desdeLienzo(estrella(i))),
      polvo: [0, 1, 2, 3].map((i) => desdeLienzo(polvo(i))),
      crearCanvas: crearCanvas
    };
  }

  return {
    PALETA: PALETA,
    construir: construir,
    _datos: { CABEZA, CUERPO, BICHO_CUERPO, BICHO_PATAS, PESADILLA, CORAZON, LAMPARA, DESPERTADOR },
    // Piezas para armar personajes y artículos de la tienda (personajes.js)
    piezas: { CABEZA: CABEZA, CUERPO: CUERPO, cuadro: cuadro, pintar: pintar, desdeLienzo: desdeLienzo, crearCanvas: crearCanvas }
  };
})();
