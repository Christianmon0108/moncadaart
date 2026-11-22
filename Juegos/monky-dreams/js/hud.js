/* =========================================================
   MONKY DREAMS — HUD Y TEXTO PIXEL
   Fuente 3x5 para textos del lienzo, fuente 5x7 para el
   logotipo y paneles con contorno pixel.
   ========================================================= */

window.MonkyHUD = (function () {
  "use strict";

  const TINTA = "#16152a";

  const FUENTE = {
    A: "010101111101101", B: "110101110101110", C: "011100100100011", D: "110101101101110",
    E: "111100110100111", F: "111100110100100", G: "011100101101011", H: "101101111101101",
    I: "111010010010111", J: "001001001101010", K: "101101110101101", L: "100100100100111",
    M: "101111111101101", N: "110101101101101", O: "010101101101010", P: "110101110100100",
    Q: "010101101110011", R: "110101110101101", S: "011100010001110", T: "111010010010010",
    U: "101101101101111", V: "101101101101010", W: "101101111111101", X: "101101010101101",
    Y: "101101010010010", Z: "111001010100111",
    "0": "111101101101111", "1": "010110010010111", "2": "111001111100111", "3": "111001111001111",
    "4": "101101111001001", "5": "111100111001111", "6": "111100111101111", "7": "111001010010010",
    "8": "111101111101111", "9": "111101111001111", "/": "001001010100100", ":": "000010000010000",
    "+": "000010111010000", "!": "010010010000010", ".": "000000000000010", "-": "000000111000000",
    "x": "000101010101000", " ": "000000000000000"
  };

  /* Quita acentos para la fuente pixel */
  function normalizar(cadena) {
    return String(cadena).normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace("X", "X");
  }

  function texto(ctx, cadena, x, y, color, sombra, escala) {
    const e = escala || 1;
    let cursor = Math.round(x);
    for (const letra of normalizar(cadena)) {
      const glifo = FUENTE[letra] || FUENTE[" "];
      for (let i = 0; i < 15; i++) {
        if (glifo[i] !== "1") continue;
        const px = cursor + (i % 3) * e;
        const py = Math.round(y) + Math.floor(i / 3) * e;
        if (sombra) { ctx.fillStyle = sombra; ctx.fillRect(px + e, py + e, e, e); }
        ctx.fillStyle = color;
        ctx.fillRect(px, py, e, e);
      }
      cursor += 4 * e;
    }
  }

  const anchoTexto = (cadena, escala) => String(cadena).length * 4 * (escala || 1) - (escala || 1);

  function panel(ctx, x, y, w, h) {
    ctx.fillStyle = TINTA;
    ctx.fillRect(x + 1, y, w - 2, h);
    ctx.fillRect(x, y + 1, w, h - 2);
    ctx.fillStyle = "rgba(29, 34, 72, 0.9)";
    ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
    ctx.fillStyle = "#3b4478";
    ctx.fillRect(x + 2, y + 1, w - 4, 1);
  }

  const LOGO = {
    M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
    O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
    N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
    K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
    Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
    D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
    R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
    E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
    A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
    S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"]
  };

  /* Palabra del logotipo con contorno, degradado y sombra */
  function construirPalabra(crearCanvas, palabra, colores) {
    const e = 3, sep = 3;
    const ancho = palabra.length * (5 * e + sep) - sep + 4;
    const alto = 7 * e + 6;
    const capa = crearCanvas(ancho, alto);
    const c = capa.getContext("2d");
    const mascara = [];
    for (let y = 0; y < alto; y++) mascara.push(new Array(ancho).fill(0));
    [...palabra].forEach((letra, i) => {
      LOGO[letra].forEach((fila, gy) => {
        for (let gx = 0; gx < 5; gx++) {
          if (fila[gx] !== "1") continue;
          for (let dy = 0; dy < e; dy++) for (let dx = 0; dx < e; dx++) {
            mascara[2 + gy * e + dy][2 + i * (5 * e + sep) + gx * e + dx] = 1;
          }
        }
      });
    });
    const en = (x, y) => y >= 0 && y < alto && x >= 0 && x < ancho && mascara[y][x];
    for (let y = 0; y < alto; y++) {
      for (let x = 0; x < ancho; x++) {
        if (en(x, y)) {
          const t = (y - 2) / (7 * e);
          const idx = Math.min(colores.length - 1, Math.floor(t * colores.length));
          c.fillStyle = en(x, y - 1) ? colores[idx] : "#ffffff";
          if (!en(x, y + 1)) c.fillStyle = colores[colores.length - 1];
          c.fillRect(x, y, 1, 1);
        } else if (en(x - 1, y) || en(x + 1, y) || en(x, y - 1) || en(x, y + 1) ||
                   en(x - 1, y - 1) || en(x + 1, y + 1) || en(x - 1, y + 1) || en(x + 1, y - 1) ||
                   en(x - 2, y - 2) || en(x - 1, y - 2) || en(x - 2, y - 1)) {
          c.fillStyle = TINTA;
          c.fillRect(x, y, 1, 1);
        }
      }
    }
    return capa;
  }

  /* Halo tramado (brillos de meta y poderes) */
  function halo(crearCanvas, r, color) {
    const c = crearCanvas(r * 2 + 1, r * 2 + 1), g = c.getContext("2d");
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
      const d = Math.hypot(x, y);
      if (d > r) continue;
      const denso = d < r * 0.55 ? (x + y) % 2 === 0 : (x % 2 === 0 && y % 2 === 0);
      if (!denso) continue;
      g.fillStyle = color;
      g.fillRect(x + r, y + r, 1, 1);
    }
    return c;
  }

  return {
    FUENTE: FUENTE,
    texto: texto,
    anchoTexto: anchoTexto,
    panel: panel,
    construirPalabra: construirPalabra,
    halo: halo,
    TINTA: TINTA
  };
})();
