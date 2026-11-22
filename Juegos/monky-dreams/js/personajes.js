/* =========================================================
   MONKY RUN — PERSONAJES Y ARTÍCULOS DE LA TIENDA
   Arma los cuadros del personaje equipado combinando:
   - el personaje (Monky, Monky Explorador, Monky Cyber o Nubi),
   - la vestimenta (cambia la ropa de Monky),
   - los accesorios (gorro en la cabeza, bufanda en el cuello).
   Todo es pixel art dibujado con filas de texto, como el
   resto de los sprites del juego.
   ========================================================= */

window.MonkyPersonajes = (function () {
  "use strict";

  const SP = window.MonkySprites.piezas;
  const CABEZA = SP.CABEZA, CUERPO = SP.CUERPO;

  /* -------------------------------------------------------
     SOMBREROS: reemplazan las filas 0-6 de la cabeza de Monky
     ------------------------------------------------------- */
  const SOMBREROS = {
    // Casco de explorador con ala ancha y cinta
    explorador: [
      "......kkkkkk......",
      "....kkllLLLlkk....",
      "...kllllllLLllk...",
      "...kclllllllllck..",
      "..kCCCCCCCCCCCCk..",
      "kcccccccccccccccck",
      "kkkkkbbffffbfffbkk"
    ],
    // Gorro de dormir con borla, caído hacia atrás
    gorro: [
      "......kkkkk.......",
      "....kkEEJEEkk.....",
      "..kkEEEEEJEEEk....",
      ".kEEDEEEEEEEJEk...",
      "kJkDDEEEEEEEEEEk..",
      "kJJkkddbbbbbbbdk..",
      "kkk.kbbffffbfffbk."
    ],
    // Gorra con antena de señal (Cyber)
    cyber: [
      "......kkkkkk...kk.",
      "....kkcllLLlkkkLk.",
      "...kcllllLLllckk..",
      "..kccccllllllcck..",
      "kkkCccccccccccCk..",
      "kCCCkddbbbbbbbdk..",
      "kkk.kbbffffbfffbk."
    ]
  };

  /* -------------------------------------------------------
     PALETAS de cada personaje y vestimenta
     ------------------------------------------------------- */
  const PALETAS = {
    monky: {},
    explorador: {
      C: "#5a3d1e", c: "#b8925a", l: "#d8b87c", L: "#f0dca8",
      H: "#4f5a2a", h: "#76843e", j: "#a3b56a", o: "#d8b87c",
      p: "#5b4127", P: "#7a5a36", s: "#7a5a36", S: "#4a321c", x: "#e0c9a2"
    },
    cyber: {
      C: "#0b1a2e", c: "#1b2f52", l: "#2bb8d8", L: "#5ff0ff",
      w: "#bffcff", e: "#1a8fa8",
      H: "#151a33", h: "#252d55", j: "#3a4580", o: "#ff4dd2",
      p: "#101024", P: "#22224a", s: "#5ff0ff", S: "#1a8fa8", x: "#d6fdff"
    },
    nubi: {
      "1": "#fffaf0", "2": "#e7dcf6", "3": "#c9b8ea", v: "#3a2f5c", V: "#55478a",
      w: "#fff7e8", e: "#16152a", r: "#ffb35a", R: "#e8792e", m: "#ff8a9a", M: "#7a2e1a",
      p: "#3a2f5c", x: "#fff1d6", O: "#f2c14e"
    }
  };

  const VESTIMENTAS = {
    pijama: { H: "#1e2a5c", h: "#2f3f7a", j: "#4a5fa8", o: "#f2c14e", p: "#2f3f7a", P: "#4a5fa8", "0": "#fff1b0" },
    sudadera: { H: "#a94d17", h: "#e8792e", j: "#ffa860", o: "#fff4de" }
  };

  const ACCESORIOS = {
    gorro: { D: "#7e6bb0", E: "#b9a7e0", J: "#fff4de" },
    bufanda: { "7": "#ff6b6b", "8": "#b3243f", "9": "#ffe08a" }
  };

  /* Qué artículos admite cada personaje */
  const ADMITE = {
    monky: { vestimenta: true, cabeza: true, cuello: true },
    explorador: { vestimenta: false, cabeza: false, cuello: true },
    cyber: { vestimenta: false, cabeza: false, cuello: true },
    nubi: { vestimenta: false, cabeza: false, cuello: true }
  };

  const NUBI = {
    quieto: [
      "..................",
      "..................",
      "..................",
      "............kkkk..",
      "...........k1111k.",
      ".......kk.k111111k",
      ".....kk11kk11111rk",
      "...kk111111111vvvr",
      "..k11111111vVwwwRR",
      ".k111111111Vvweevv",
      "k22111O1111vvvvvmv",
      "k2222111111vvvvMvk",
      "k33222221111vvvvvk",
      "k333332222211kkkk.",
      "k333333332222k....",
      ".k33333333322k....",
      "..kk3pp333ppk.....",
      "....kpp3kkppk.....",
      "....kppk.kppk.....",
      "....kxxk.kxxk....."
    ],
    respira: [
      "..................",
      "..................",
      "..................",
      "............kkkk..",
      "...........k1111k.",
      ".......kk.k111111k",
      ".....kk11kk11111rk",
      "...kk111111111vvvr",
      "..k11111111vVwwwRR",
      ".k111111111Vvweevv",
      "k22111O1111vvvvvmv",
      "k2222111111vvvvMvk",
      "k33222221111vvvvvk",
      "k333332222211kkkk.",
      "k333333332222k....",
      ".k33333333322k....",
      "..kk3pp333ppk.....",
      "....kpp3kkppk.....",
      "....kppk.kppk.....",
      "....kxxk.kxxk....."
    ],
    parpadeo: [
      "..................",
      "..................",
      "..................",
      "............kkkk..",
      "...........k1111k.",
      ".......kk.k111111k",
      ".....kk11kk11111rk",
      "...kk111111111vvvr",
      "..k11111111vVvvvRR",
      ".k111111111Vvwwwvv",
      "k22111O1111vvvvvmv",
      "k2222111111vvvvMvk",
      "k33222221111vvvvvk",
      "k333332222211kkkk.",
      "k333333332222k....",
      ".k33333333322k....",
      "..kk3pp333ppk.....",
      "....kpp3kkppk.....",
      "....kppk.kppk.....",
      "....kxxk.kxxk....."
    ],
    correrA: [
      "..................",
      "..................",
      "............kkkk..",
      "...........k1111k.",
      ".......kk.k111111k",
      ".....kk11kk11111rk",
      "...kk111111111vvvr",
      "..k11111111vVwwwRR",
      ".k111111111Vvweevv",
      "k22111O1111vvvvvmv",
      "k2222111111vvvvMvk",
      "k33222221111vvvvvk",
      "k333332222211kkkk.",
      "k333333332222k....",
      ".k33333333322k....",
      "..kkpp333333k.....",
      "...kpp33kkkppk....",
      "...kppkk..kppk....",
      "...kxxk...kppk....",
      "....kk....kxxk...."
    ],
    correrB: [
      "..................",
      "..................",
      "..................",
      "............kkkk..",
      "...........k1111k.",
      ".......kk.k111111k",
      ".....kk11kk11111rk",
      "...kk111111111vvvr",
      "..k11111111vVwwwRR",
      ".k111111111Vvweevv",
      "k22111O1111vvvvvmv",
      "k2222111111vvvvMvk",
      "k33222221111vvvvvk",
      "k333332222211kkkk.",
      "k333333332222k....",
      ".k33333333322k....",
      "..kk33pp3pp3k.....",
      "....k3ppkppk......",
      ".....kppkppk......",
      ".....kxxkxxk......"
    ],
    correrC: [
      "..................",
      "..................",
      "............kkkk..",
      "...........k1111k.",
      ".......kk.k111111k",
      ".....kk11kk11111rk",
      "...kk111111111vvvr",
      "..k11111111vVwwwRR",
      ".k111111111Vvweevv",
      "k22111O1111vvvvvmv",
      "k2222111111vvvvMvk",
      "k33222221111vvvvvk",
      "k333332222211kkkk.",
      "k333333332222k....",
      ".k33333333322k....",
      "..kk3333333ppk....",
      "....kpp3kkkppk....",
      "....kppk..kppk....",
      "....kppk..kxxk....",
      "....kxxk...kk....."
    ],
    saltar: [
      "..................",
      "..................",
      "............kkkk..",
      "...........k1111k.",
      ".......kk.k111111k",
      ".....kk11kk11111rk",
      "...kk111111111vvvr",
      "..k11111111vVwwwRR",
      ".k111111111Vvweevv",
      "k22111O1111vvvvvmv",
      "k2222111111vvvvMvk",
      "k33222221111vvvvvk",
      "k333332222211kkkk.",
      "k333333332222k....",
      ".k333pp333pp2k....",
      "..kk3pp333ppk.....",
      "....kpp3kkppk.....",
      "....kxxk.kxxk.....",
      ".....kk...kk......",
      ".................."
    ],
    caer: [
      "..................",
      "..................",
      "..................",
      "............kkkk..",
      "...........k1111k.",
      ".......kk.k111111k",
      ".....kk11kk11111rk",
      "...kk111111111vvvr",
      "..k11111111vVwwwRR",
      ".k111111111Vvweevv",
      "k22111O1111vvvvvmv",
      "k2222111111vvvvMvk",
      "k33222221111vvvvvk",
      "k333332222211kkkk.",
      "k333333332222k....",
      ".k33333333322k....",
      "..kkpp33333ppk....",
      "...kpp33kkkppk....",
      "...kppkk..kppk....",
      "...kxxk...kxxk...."
    ],
    dolor: [
      "..................",
      "..................",
      "..................",
      "............kkkk..",
      "...........k1111k.",
      ".......kk.k111111k",
      ".....kk11kk11111rk",
      "...kk111111111vvvr",
      "..k11111111vVwvwRR",
      ".k111111111Vvvwvvv",
      "k22111O1111vvwvwmv",
      "k2222111111vvvvvvk",
      "k33222221111vvvvvk",
      "k333332222211kkkk.",
      "k333333332222k....",
      ".k33333333322k....",
      "..kkpp33333ppk....",
      "...kpp33kkkppk....",
      "...kppkk..kppk....",
      "...kxxk...kxxk...."
    ],
    feliz: [
      "..................",
      "..................",
      "............kkkk..",
      "...........k1111k.",
      ".......kk.k111111k",
      ".....kk11kk11111rk",
      "...kk111111111vvvr",
      "..k11111111vVvwvRR",
      ".k111111111Vvwvwvv",
      "k22111O1111vvvvvmv",
      "k2222111111vvvMMvk",
      "k33222221111vvvvvk",
      "k333332222211kkkk.",
      "k333333332222k....",
      ".k333pp333pp2k....",
      "..kk3pp333ppk.....",
      "....kpp3kkppk.....",
      "....kxxk.kxxk.....",
      ".....kk...kk......",
      ".................."
    ],
    dormido: [
      "..................",
      "..................",
      "..................",
      "............kkkk..",
      "...........k1111k.",
      ".......kk.k111111k",
      ".....kk11kk11111rk",
      "...kk111111111vvvr",
      "..k11111111vVvvvRR",
      ".k111111111Vvwwwvv",
      "k22111O1111vvvvvmv",
      "k2222111111vvvvMvk",
      "k33222221111vvvvvk",
      "k333332222211kkkk.",
      "k333333332222k....",
      ".k33333333322k....",
      "..kk3pp333ppk.....",
      "....kpp3kkppk.....",
      "....kppk.kppk.....",
      "....kxxk.kxxk....."
    ],
    bolaA: [
      ".......kkk........",
      ".....kk111kk...k..",
      "....k1111111k.krk.",
      "...k111111111kkRk.",
      "..k11311111111kk..",
      "..k1111O111111kk..",
      ".k2211111111vwwvk.",
      ".k222211111vvwevk.",
      ".k333222211vvvvvk.",
      "..k333322222vvvvk.",
      "..k3333333222vvk..",
      "...k333333332kk...",
      "....k3333333k.....",
      ".....kk333kk......"
    ],
    bolaB: [
      ".......kkk........",
      ".....kk111kk...k..",
      "....k1111111k.krk.",
      "...k111111111kkRk.",
      "..k11111111111kk..",
      "..k11111111111kk..",
      ".k2311111111vwwvk.",
      ".k222211111vvwevk.",
      ".k332222211vvvvvk.",
      "..k333322222vvvvk.",
      "..k333O333222vvk..",
      "...k333333332kk...",
      "....k3333333k.....",
      ".....kk333kk......"
    ]
  };
  /* -------------------------------------------------------
     ARMADO
     ------------------------------------------------------- */
  const vacio = () => { const f = []; for (let i = 0; i < 20; i++) f.push("..................".split("")); return f; };

  function cabezaCon(variante, sombrero) {
    const filas = CABEZA[variante].map((f) => f.split(""));
    if (sombrero) SOMBREROS[sombrero].forEach((fila, i) => { filas[i] = fila.split(""); });
    return filas;
  }

  function componer(cabeza, cuerpo, dy) {
    const filas = vacio();
    cuerpo.forEach((fila, i) => {
      for (let x = 0; x < 18; x++) if (fila[x] !== ".") filas[13 + i][x] = fila[x];
    });
    cabeza.forEach((fila, i) => {
      const y = i + (dy || 0);
      if (y < 0 || y >= 20) return;
      for (let x = 0; x < 18; x++) if (fila[x] !== ".") filas[y][x] = fila[x];
    });
    return filas;
  }

  /* Pone pixeles nuevos y les agrega contorno donde tocan el vacío */
  function superponer(filas, pixeles) {
    const alto = filas.length;
    pixeles.forEach(([x, y, ch]) => { if (y >= 0 && y < alto && x >= 0 && x < 18) filas[y][x] = ch; });
    pixeles.forEach(([x, y]) => {
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
        const X = x + dx, Y = y + dy;
        if (Y >= 0 && Y < alto && X >= 0 && X < 18 && filas[Y][X] === ".") filas[Y][X] = "k";
      });
    });
  }

  /* Estrellas del pijama sobre la tela de la sudadera */
  function estampar(filas, desde) {
    for (let y = desde; y < filas.length; y++) {
      for (let x = 0; x < 18; x++) if (filas[y][x] === "h" && (x + 2 * y) % 5 === 0) filas[y][x] = "0";
    }
  }

  /* Bufanda: vuelta al cuello y una punta que ondea hacia atrás */
  function bufandaMonky(filas, fila, onda) {
    const p = [];
    for (let x = 5; x <= 12; x++) p.push([x, fila, x % 3 === 0 ? "9" : "7"]);
    p.push([4, fila, "8"]);
    const punta = onda ? [[3, fila - 1, "7"], [2, fila - 1, "8"], [1, fila - 2, "7"], [0, fila - 2, "9"]]
      : [[3, fila - 1, "7"], [2, fila - 2, "8"], [1, fila - 2, "7"], [0, fila - 3, "9"]];
    superponer(filas, p.concat(punta));
  }

  function bufandaNubi(filas, dy, onda) {
    const p = [];
    for (let y = 11; y <= 13; y++) { p.push([9, y + dy, y === 12 ? "9" : "7"]); p.push([10, y + dy, "7"]); }
    const punta = onda ? [[8, 11 + dy, "8"], [7, 10 + dy, "7"], [6, 10 + dy, "9"]] : [[8, 12 + dy, "8"], [7, 12 + dy, "7"], [6, 13 + dy, "9"]];
    superponer(filas, p.concat(punta));
  }

  /* Equipo válido: lo que el personaje no admite se ignora */
  function normalizar(eq) {
    const e = Object.assign({ personaje: "monky", vestimenta: null, cabeza: null, cuello: null }, eq || {});
    if (!ADMITE[e.personaje]) e.personaje = "monky";
    const a = ADMITE[e.personaje];
    if (!a.vestimenta || !VESTIMENTAS[e.vestimenta]) e.vestimenta = null;
    if (!a.cabeza || e.cabeza !== "gorro") e.cabeza = null;
    if (!a.cuello || e.cuello !== "bufanda") e.cuello = null;
    return e;
  }

  function construirMonky(e) {
    const sombrero = e.cabeza === "gorro" ? "gorro" : SOMBREROS[e.personaje] ? e.personaje : null;
    const colores = Object.assign({}, PALETAS[e.personaje],
      e.vestimenta ? VESTIMENTAS[e.vestimenta] : {},
      e.cabeza ? ACCESORIOS.gorro : {},
      e.cuello ? ACCESORIOS.bufanda : {});
    let n = 0;
    const hacer = (cara, cuerpo, dy) => {
      const filas = componer(cabezaCon(cara, sombrero), CUERPO[cuerpo], dy);
      if (e.vestimenta === "pijama") estampar(filas, 13);
      if (e.cuello) bufandaMonky(filas, 13, (n++) % 2 === 0);
      return SP.cuadro(filas.map((f) => f.join("")), colores);
    };
    const deslizar = (punta) => {
      const filas = cabezaCon("normal", sombrero).concat([(punta ? "bbb.kssskksssssk.." : ".bbbksssk.ksssssk.").split("")]);
      if (e.cuello) bufandaMonky(filas, 12, punta);
      return SP.cuadro(filas.map((f) => f.join("")), colores);
    };
    return {
      quieto: [hacer("normal", "quieto", 0), hacer("normal", "respira", 1)],
      parpadeo: hacer("parpadeo", "quieto", 0),
      correr: [
        hacer("normal", "paso1", 1), hacer("normal", "paso1", 1), hacer("normal", "paso2", 0),
        hacer("normal", "paso3", 1), hacer("normal", "paso3", 1), hacer("normal", "paso2", 0)
      ],
      saltar: hacer("normal", "salto", 0),
      caer: hacer("normal", "caida", 0),
      dolor: hacer("dolor", "caida", 0),
      festejo: [hacer("feliz", "festejo", 0), hacer("feliz", "salto", 1)],
      dormido: [hacer("dormido", "quieto", 0), hacer("dormido", "respira", 1)],
      deslizar: [deslizar(true), deslizar(false)]
    };
  }

  function construirNubi(e) {
    const colores = Object.assign({}, PALETAS.nubi, e.cuello ? ACCESORIOS.bufanda : {});
    let n = 0;
    const hacer = (nombre, dy) => {
      const filas = NUBI[nombre].map((f) => f.split(""));
      if (e.cuello) bufandaNubi(filas, dy || 0, (n++) % 2 === 0);
      return SP.cuadro(filas.map((f) => f.join("")), colores);
    };
    const bola = (nombre) => SP.cuadro(NUBI[nombre], colores);
    return {
      quieto: [hacer("quieto", 0), hacer("respira", 0)],
      parpadeo: hacer("parpadeo", 0),
      correr: [hacer("correrA", -1), hacer("correrA", -1), hacer("correrB", 0), hacer("correrC", -1), hacer("correrC", -1), hacer("correrB", 0)],
      saltar: hacer("saltar", -1),
      caer: hacer("caer", 0),
      dolor: hacer("dolor", 0),
      festejo: [hacer("feliz", -1), hacer("saltar", -1)],
      dormido: [hacer("dormido", 0), hacer("dormido", 0)],
      deslizar: [bola("bolaA"), bola("bolaB")]
    };
  }

  const cache = {};
  function construir(equipo) {
    const e = normalizar(equipo);
    const clave = [e.personaje, e.vestimenta, e.cabeza, e.cuello].join("|");
    if (!cache[clave]) cache[clave] = e.personaje === "nubi" ? construirNubi(e) : construirMonky(e);
    return cache[clave];
  }

  return {
    construir: construir,
    normalizar: normalizar,
    admite: (personaje, ranura) => !!(ADMITE[personaje] && ADMITE[personaje][ranura]),
    PERSONAJES: Object.keys(ADMITE)
  };
})();
