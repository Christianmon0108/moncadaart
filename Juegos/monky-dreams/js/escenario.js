/* =========================================================
   MONKY DREAMS — ESCENARIO EN PIXEL ART
   Casillas, decoraciones, fondos con parallax y almohada
   voladora para cuatro mundos: noche, bosque, digital y
   pesadilla. Todo se dibuja pixel a pixel con código y se
   guarda en lienzos para no repetir trabajo cada cuadro.
   ========================================================= */

window.MonkyEscenario = (function () {
  "use strict";

  const T = 16;
  const ALTO_BASE = 180;
  const TINTA = "#16152a";
  const PERIODO = 512;

  function crearCanvas(ancho, alto) {
    const c = document.createElement("canvas");
    c.width = Math.max(1, ancho);
    c.height = Math.max(1, alto);
    return c;
  }

  function ruido(x, y, s) {
    let h = (x * 374761393 + y * 668265263 + (s || 0) * 1442695041) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];

  /* =======================================================
     PALETAS DE CADA MUNDO
     ======================================================= */
  const TEMAS = {
    noche: {
      suelo: { hondo: "#3a1f15", oscuro: "#4f2c1d", base: "#6b3f2a", claro: "#8a5538" },
      musgo: { brillo: "#ffb56e", base: "#e8792e", medio: "#d3662a", oscuro: "#a9481b" },
      piedra: ["#a5876f", "#76594a", "#4d3a30"],
      bloque: { cara: "#ead9bd", luz: "#fff6e6", sombra: "#c9ad85", borde: "#a68962", e1: "#ffa860", e2: "#e8792e", e3: "#a9481b" },
      cristal: { luz: "#efe6ff", medio: "#b9a7e0", oscuro: "#7c64b8", base: "#4a3d7a" }
    },
    bosque: {
      suelo: { hondo: "#1d140f", oscuro: "#2a1d15", base: "#3d2a1e", claro: "#56402c" },
      musgo: { brillo: "#c4f59a", base: "#62c06c", medio: "#47a05a", oscuro: "#2e7445" },
      piedra: ["#8f9a7a", "#5f6a52", "#3c4535"],
      bloque: { cara: "#7d8f6c", luz: "#a9bc8f", sombra: "#58684b", borde: "#3e4a37", e1: "#c4f59a", e2: "#62c06c", e3: "#2e7445" },
      cristal: { luz: "#f0c8ff", medio: "#b06ad0", oscuro: "#6d3a8c", base: "#3d2350" }
    },
    digital: {
      suelo: { hondo: "#070d1a", oscuro: "#0c1628", base: "#111f38", claro: "#1a2d4f" },
      musgo: { brillo: "#d6fdff", base: "#5ff0ff", medio: "#2bb8d8", oscuro: "#1a6f8f" },
      piedra: ["#2a6f8f", "#1a3f5f", "#0c1f33"],
      bloque: { cara: "#33456a", luz: "#5a72a0", sombra: "#22304d", borde: "#151f36", e1: "#ff6bd5", e2: "#c43aa6", e3: "#6a1d5c" },
      cristal: { luz: "#fff7b0", medio: "#ffd23f", oscuro: "#c98a00", base: "#3a2a0a" }
    },
    pesadilla: {
      suelo: { hondo: "#0d0710", oscuro: "#160c1b", base: "#231329", claro: "#341d3d" },
      musgo: { brillo: "#c2507a", base: "#7a2a55", medio: "#5e1f44", oscuro: "#3a1230" },
      piedra: ["#5a4466", "#3a2a45", "#221829"],
      bloque: { cara: "#4a3a58", luz: "#6a5478", sombra: "#33263f", borde: "#221829", e1: "#ff4d6d", e2: "#b3243f", e3: "#5a0f22" },
      cristal: { luz: "#ff9aa8", medio: "#3a1430", oscuro: "#1a0812", base: "#0d0408" }
    }
  };

  /* =======================================================
     CASILLAS DEL NIVEL
     opciones: { tema, extender } — extender copia la columna
     del borde hacia fuera (para unir tramos sin costuras).
     ======================================================= */
  function construirCapaNivel(mapa, opciones) {
    const op = opciones || {};
    const tema = op.tema || "noche";
    const P = TEMAS[tema];
    const filas = mapa.length;
    const columnas = mapa.reduce((m, f) => Math.max(m, f.length), 0);
    const capa = crearCanvas(columnas * T, filas * T);
    const c = capa.getContext("2d");
    const semilla = op.semilla || 0;
    const ch = (cx, cy) => {
      if (cy >= filas) return "#";
      if (cy < 0) return ".";
      if (cx < 0) return op.extender ? (mapa[cy][0] === "#" ? "#" : ".") : ".";
      if (cx >= columnas) return op.extender ? (mapa[cy][columnas - 1] === "#" ? "#" : ".") : ".";
      return mapa[cy][cx] || ".";
    };
    const px = (x, y, color) => { c.fillStyle = color; c.fillRect(x, y, 1, 1); };
    const rn = (x, y, s) => ruido(x + semilla * 977, y, s);

    for (let cy = 0; cy < filas; cy++) {
      for (let cx = 0; cx < columnas; cx++) {
        const t = ch(cx, cy);
        if (t === "#") suelo(cx, cy);
        else if (t === "B") bloque(cx, cy);
      }
    }
    for (let cy = 0; cy < filas; cy++) {
      let inicio = -1;
      for (let cx = 0; cx <= columnas; cx++) {
        const es = cx < columnas && ch(cx, cy) === "-";
        if (es && inicio < 0) inicio = cx;
        if (!es && inicio >= 0) { plataforma(inicio, cx - 1, cy); inicio = -1; }
      }
    }
    for (let cy = 0; cy < filas; cy++) {
      for (let cx = 0; cx < columnas; cx++) {
        const t = ch(cx, cy);
        if (t === "^") puas(cx, cy);
        else if (t === "a") letrero(cx, cy);
        else if (t === "f") plantas(cx, cy);
        else if (t === "g") adornoGrande(cx, cy);
      }
    }
    return capa;

    function suelo(cx, cy) {
      const x0 = cx * T, y0 = cy * T;
      const S = P.suelo, M = P.musgo;
      const arriba = ch(cx, cy - 1) === "#";
      const izq = ch(cx - 1, cy) === "#";
      const der = ch(cx + 1, cy) === "#";
      const superficie = !arriba;

      for (let y = 0; y < T; y++) {
        for (let x = 0; x < T; x++) {
          const gx = x0 + x, gy = y0 + y;
          const n = rn(gx, gy, 1);
          let color = S.base;
          if ((gy + Math.floor(rn(Math.floor(gx / 5), cy, 2) * 4)) % 9 === 0 && n < 0.7) color = S.oscuro;
          if (n < 0.05) color = S.claro;
          else if (n > 0.96) color = S.hondo;
          px(gx, gy, color);
        }
      }

      if (tema === "digital") {
        // Pistas de circuito con nodos luminosos
        const fila = y0 + (superficie ? 8 : 4) + Math.floor(rn(cx, cy, 20) * 5);
        c.fillStyle = "#1d4766"; c.fillRect(x0, fila, T, 1);
        if (rn(cx, cy, 21) < 0.5) { const vx = x0 + 3 + Math.floor(rn(cx, cy, 22) * 10); c.fillRect(vx, fila, 1, y0 + T - fila); }
        if (rn(cx, cy, 23) < 0.45) { const nx = x0 + 2 + Math.floor(rn(cx, cy, 24) * 12); px(nx, fila, "#5ff0ff"); px(nx - 1, fila, "#2bb8d8"); px(nx + 1, fila, "#2bb8d8"); }
      } else {
        for (let i = 0; i < 2; i++) {
          if (rn(cx, cy, 10 + i) > 0.55) continue;
          const sx = x0 + 2 + Math.floor(rn(cx, cy, 20 + i) * 10);
          const sy = y0 + (superficie ? 7 : 2) + Math.floor(rn(cx, cy, 30 + i) * 6);
          c.fillStyle = P.piedra[1]; c.fillRect(sx, sy, 3, 2);
          px(sx, sy, P.piedra[0]); px(sx + 1, sy, P.piedra[0]);
          c.fillStyle = P.piedra[2]; c.fillRect(sx, sy + 2, 3, 1); px(sx + 3, sy + 1, P.piedra[2]);
        }
        if (tema === "pesadilla" && rn(cx, cy, 40) < 0.4) {
          // Raíces retorcidas
          let rx = x0 + Math.floor(rn(cx, cy, 41) * 14), ry = y0 + (superficie ? 6 : 0);
          for (let i = 0; i < 8; i++) { px(rx, ry, "#3a2346"); ry++; rx += rn(cx, i, 42) < 0.5 ? -1 : 1; }
        }
      }

      if (superficie) {
        for (let x = 0; x < T; x++) {
          const gx = x0 + x;
          const grosor = tema === "digital" ? 3 : 4 + (rn(gx, cy, 3) < 0.35 ? 1 : 0) + (rn(gx, cy, 4) < 0.12 ? 1 : 0);
          for (let y = 0; y < grosor; y++) {
            let color = M.base;
            if (y === 0) color = M.brillo;
            else if (y === grosor - 1) color = M.oscuro;
            else if (y >= 2 && rn(gx, y0 + y, 5) < 0.35) color = M.medio;
            if (tema === "digital" && y === 1) color = (gx % 8 === 0) ? M.brillo : M.medio;
            px(gx, y0 + y, color);
          }
          px(gx, y0 + grosor, S.hondo);
        }
        c.fillStyle = TINTA;
        c.fillRect(x0 + (izq ? 0 : 2), y0 - 1, T - (izq ? 0 : 2) - (der ? 0 : 2), 1);
        if (tema !== "digital") {
          for (let x = (izq ? 0 : 3); x < T - (der ? 0 : 3); x++) {
            const gx = x0 + x;
            const r = rn(gx, cy, 6);
            if (r < 0.16) { px(gx, y0 - 1, M.base); px(gx, y0 - 2, M.brillo); px(gx, y0 - 3, TINTA); }
            else if (r < 0.36) { px(gx, y0 - 1, M.brillo); px(gx, y0 - 2, TINTA); }
          }
        }
      }

      if (!izq) {
        c.fillStyle = TINTA; c.fillRect(x0, y0, 1, T);
        c.fillStyle = S.hondo; c.fillRect(x0 + 1, y0 + (superficie ? 5 : 0), 1, T - (superficie ? 5 : 0));
        if (superficie) {
          c.clearRect(x0, y0 - 1, 2, 2); c.clearRect(x0, y0 + 1, 1, 1);
          px(x0 + 1, y0, TINTA); px(x0, y0 + 1, TINTA); px(x0 + 2, y0 - 1, TINTA);
        }
      }
      if (!der) {
        c.fillStyle = TINTA; c.fillRect(x0 + T - 1, y0, 1, T);
        c.fillStyle = S.oscuro; c.fillRect(x0 + T - 2, y0 + (superficie ? 5 : 0), 1, T - (superficie ? 5 : 0));
        if (superficie) {
          c.clearRect(x0 + T - 2, y0 - 1, 2, 2); c.clearRect(x0 + T - 1, y0 + 1, 1, 1);
          px(x0 + T - 2, y0, TINTA); px(x0 + T - 1, y0 + 1, TINTA); px(x0 + T - 3, y0 - 1, TINTA);
        }
      }
    }

    function bloque(cx, cy) {
      const x0 = cx * T, y0 = cy * T, B = P.bloque;
      const es = (dx, dy) => ch(cx + dx, cy + dy) === "B";
      c.fillStyle = B.cara; c.fillRect(x0, y0, T, T);
      c.fillStyle = B.luz; c.fillRect(x0, y0, T, 2); c.fillRect(x0, y0, 2, T);
      c.fillStyle = B.sombra; c.fillRect(x0, y0 + T - 3, T, 3); c.fillRect(x0 + T - 3, y0, 3, T);
      c.fillStyle = B.borde; c.fillRect(x0, y0 + T - 1, T, 1); c.fillRect(x0 + T - 1, y0, 1, T);
      if (tema === "digital") {
        // Panel metálico con tornillos y luz
        c.fillStyle = B.borde; c.fillRect(x0 + 4, y0 + 6, 8, 4);
        c.fillStyle = (cx + cy) % 2 ? B.e1 : "#5ff0ff"; c.fillRect(x0 + 5, y0 + 7, 6, 2);
        [[3, 3], [12, 3], [3, 12], [12, 12]].forEach(([a, b]) => px(x0 + a, y0 + b, B.luz));
      } else if (tema === "bosque") {
        // Piedra con musgo y hoja
        for (let x = 0; x < T; x++) if (rn(x0 + x, cy, 50) < 0.5) px(x0 + x, y0 + 1 + (rn(x0 + x, cy, 51) < 0.3 ? 1 : 0), "#62c06c");
        c.fillStyle = B.e3; c.fillRect(x0 + 6, y0 + 7, 4, 3);
        c.fillStyle = B.e2; c.fillRect(x0 + 7, y0 + 6, 3, 3);
        px(x0 + 8, y0 + 6, B.e1);
      } else {
        for (let y = 0; y < T; y++) {
          for (let x = 0; x < T; x++) {
            const d = Math.abs(x - 7.5) + Math.abs(y - 7.5);
            if (d <= 3.5) px(x0 + x, y0 + y, x + y < 15 ? B.e1 : B.e2);
            else if (d <= 4.5) px(x0 + x, y0 + y, B.e3);
          }
        }
        if (tema === "pesadilla") { px(x0 + 3, y0 + 4, TINTA); px(x0 + 4, y0 + 5, TINTA); px(x0 + 4, y0 + 6, TINTA); px(x0 + 12, y0 + 10, TINTA); px(x0 + 11, y0 + 11, TINTA); }
      }
      c.fillStyle = TINTA;
      if (!es(0, -1)) c.fillRect(x0, y0, T, 1);
      if (!es(0, 1)) c.fillRect(x0, y0 + T - 1, T, 1);
      if (!es(-1, 0)) c.fillRect(x0, y0, 1, T);
      if (!es(1, 0)) c.fillRect(x0 + T - 1, y0, 1, T);
    }

    /* Plataforma que se atraviesa desde abajo: cambia según el mundo */
    function plataforma(cx0, cx1, cy) {
      if (tema === "bosque") return hongoPlataforma(cx0, cx1, cy);
      if (tema === "digital") return panelHolografico(cx0, cx1, cy);
      if (tema === "pesadilla") return losaFlotante(cx0, cx1, cy);
      return nube(cx0, cx1, cy);
    }

    function nube(cx0, cx1, cy) {
      // Nube sólida: la parte de arriba coincide con la línea donde Monky aterriza
      // y el cuerpo es delgado (8 px), como la zona en que el aterrizaje la acepta.
      const x0 = cx0 * T - 2, ancho = (cx1 - cx0 + 1) * T + 4, y0 = cy * T - 2, alto = 10;
      const dentro = (x, y) => {
        if (x < 0 || x >= ancho || y < 0 || y >= alto) return false;
        const base = y >= 2 && y <= 8 && x >= 3 && x < ancho - 3;
        let bulto = Math.hypot(x - 4, y - 5) <= 4.2 || Math.hypot(x - (ancho - 5), y - 5) <= 4.2;
        for (let bx = 8; bx < ancho - 6; bx += 8) if (Math.hypot(x - bx, y - 4) <= 3.4 + rn(bx + cx0 * 31, cy, 8) * 0.8) bulto = true;
        return base || bulto;
      };
      rellenar(x0, y0, ancho, alto, dentro, (x, y) => (!dentro(x, y - 2) ? "#ffffff" : y >= alto - 3 ? "#c9b8ea" : y >= alto - 5 ? "#e7dcf6" : "#fff4de"));
    }

    function hongoPlataforma(cx0, cx1, cy) {
      const x0 = cx0 * T - 3, ancho = (cx1 - cx0 + 1) * T + 6, y0 = cy * T - 2, alto = 9;
      const dentro = (x, y) => {
        if (x < 0 || x >= ancho || y < 0 || y >= alto) return false;
        const curva = Math.sin((x / (ancho - 1)) * Math.PI);
        return y >= 3 - curva * 3 && y <= 6 + (x > 2 && x < ancho - 3 ? 1 : 0);
      };
      rellenar(x0, y0, ancho, alto, dentro, (x, y) => {
        if (y >= 6) return "#f3e4c8";
        if (!dentro(x, y - 1)) return "#ffa860";
        return (Math.floor(x / 5) + y) % 4 === 0 && y < 5 ? "#fff4de" : "#e8792e";
      });
      // Tallo
      const mx = x0 + Math.floor(ancho / 2) - 2;
      c.fillStyle = TINTA; c.fillRect(mx - 1, y0 + alto - 1, 6, 6);
      c.fillStyle = "#f3e4c8"; c.fillRect(mx, y0 + alto - 1, 4, 5);
      c.fillStyle = "#d4bc96"; c.fillRect(mx + 3, y0 + alto - 1, 1, 5);
    }

    function panelHolografico(cx0, cx1, cy) {
      const x0 = cx0 * T, ancho = (cx1 - cx0 + 1) * T, y0 = cy * T;
      c.fillStyle = TINTA; c.fillRect(x0, y0 - 1, ancho, 7);
      c.fillStyle = "#1a6f8f"; c.fillRect(x0 + 1, y0, ancho - 2, 5);
      c.fillStyle = "#5ff0ff"; c.fillRect(x0 + 1, y0, ancho - 2, 1);
      for (let x = 3; x < ancho - 3; x += 4) { c.fillStyle = x % 8 === 3 ? "#d6fdff" : "#2bb8d8"; c.fillRect(x0 + x, y0 + 2, 2, 1); }
      c.fillStyle = "rgba(95, 240, 255, 0.25)"; c.fillRect(x0 + 2, y0 + 6, ancho - 4, 3);
      c.fillStyle = "rgba(95, 240, 255, 0.12)"; c.fillRect(x0 + 4, y0 + 9, ancho - 8, 3);
    }

    function losaFlotante(cx0, cx1, cy) {
      const x0 = cx0 * T - 1, ancho = (cx1 - cx0 + 1) * T + 2, y0 = cy * T - 1;
      const dentro = (x, y) => {
        if (x < 0 || x >= ancho || y < 0) return false;
        const fondo = 6 + Math.round(Math.sin(x * 0.7 + cx0) + ruido(x, cx0, 9) * 2);
        return y <= Math.max(5, fondo) && !(y === 0 && (x < 2 || x > ancho - 3));
      };
      rellenar(x0, y0, ancho, 10, dentro, (x, y) => (y <= 1 ? "#6a5478" : y >= 6 ? "#33263f" : "#4a3a58"));
      for (let x = 2; x < ancho - 2; x += 7) { c.fillStyle = "#ff4d6d"; c.fillRect(x0 + x, y0 + 3, 1, 1); }
    }

    function rellenar(x0, y0, ancho, alto, dentro, colorDe) {
      for (let y = 0; y < alto; y++) {
        for (let x = 0; x < ancho; x++) {
          if (!dentro(x, y)) continue;
          const borde = !dentro(x - 1, y) || !dentro(x + 1, y) || !dentro(x, y - 1) || !dentro(x, y + 1);
          px(x0 + x, y0 + y, borde ? TINTA : colorDe(x, y));
        }
      }
    }

    function puas(cx, cy) {
      const x0 = cx * T, base = cy * T + T, K = P.cristal;
      const cristales = [
        { x: 0, w: 6, h: 8 + Math.floor(rn(cx, cy, 11) * 3) },
        { x: 5, w: 6, h: 11 + Math.floor(rn(cx, cy, 12) * 3) },
        { x: 10, w: 6, h: 7 + Math.floor(rn(cx, cy, 13) * 3) }
      ];
      cristales.forEach((k) => {
        for (let r = 0; r < k.h; r++) {
          const mitad = ((r + 1) / k.h) * (k.w / 2);
          const izq = Math.round(k.x + k.w / 2 - mitad);
          const der = Math.round(k.x + k.w / 2 + mitad) - 1;
          for (let x = izq; x <= der; x++) {
            let color = K.medio;
            if (x === izq || x === der) color = TINTA;
            else if (x < k.x + k.w / 2 - 0.5) color = K.luz;
            else if (x > k.x + k.w / 2) color = K.oscuro;
            if (tema === "digital" && (r + x) % 4 === 0 && x !== izq && x !== der) color = "#ffffff";
            px(x0 + x, base - k.h + r, color);
          }
        }
        px(x0 + k.x + Math.floor(k.w / 2), base - k.h - 1, TINTA);
      });
      c.fillStyle = K.base; c.fillRect(x0, base - 2, T, 2);
      c.fillStyle = TINTA; c.fillRect(x0, base - 1, T, 1);
    }

    function letrero(cx, cy) {
      const x0 = cx * T, y0 = cy * T;
      c.fillStyle = TINTA; c.fillRect(x0 + 6, y0 + 7, 4, 9);
      c.fillStyle = "#8a5538"; c.fillRect(x0 + 7, y0 + 7, 2, 9);
      c.fillStyle = TINTA; c.fillRect(x0 + 1, y0 + 1, 14, 8);
      c.fillStyle = "#ead7b5"; c.fillRect(x0 + 2, y0 + 2, 12, 6);
      c.fillStyle = "#fff4de"; c.fillRect(x0 + 2, y0 + 2, 12, 1);
      c.fillStyle = "#b49a74"; c.fillRect(x0 + 2, y0 + 7, 12, 1);
      c.fillStyle = "#e8792e";
      c.fillRect(x0 + 4, y0 + 4, 6, 2); c.fillRect(x0 + 9, y0 + 3, 1, 4); c.fillRect(x0 + 10, y0 + 4, 1, 2);
    }

    function plantas(cx, cy) {
      const x0 = cx * T, y0 = cy * T;
      if (tema === "digital") {
        // Chip con patitas
        c.fillStyle = TINTA; c.fillRect(x0 + 3, y0 + 9, 10, 7);
        c.fillStyle = "#33456a"; c.fillRect(x0 + 4, y0 + 10, 8, 5);
        c.fillStyle = "#5ff0ff"; c.fillRect(x0 + 6, y0 + 12, 4, 1);
        for (let i = 0; i < 4; i++) { c.fillStyle = "#8ba3c7"; c.fillRect(x0 + 4 + i * 2, y0 + 8, 1, 1); }
        return;
      }
      if (tema === "pesadilla") {
        // Arbusto con ojos
        for (let y = 0; y < 7; y++) for (let x = 0; x < 12; x++) {
          if (Math.hypot(x - 6, y - 7) < 6.5) px(x0 + 2 + x, y0 + 9 + y, Math.hypot(x - 6, y - 7) > 5.6 ? TINTA : "#1a0d1f");
        }
        px(x0 + 6, y0 + 12, "#ff4d6d"); px(x0 + 9, y0 + 12, "#ff4d6d");
        return;
      }
      if (tema === "bosque") {
        // Hongos pequeños
        [[3, 5], [9, 7], [12, 4]].forEach(([fx, alto], i) => {
          c.fillStyle = "#f3e4c8"; c.fillRect(x0 + fx, y0 + T - alto, 1, alto);
          const cap = i === 1 ? "#ff8fd1" : "#7ff0d0";
          c.fillStyle = TINTA; c.fillRect(x0 + fx - 2, y0 + T - alto - 3, 5, 3);
          c.fillStyle = cap; c.fillRect(x0 + fx - 1, y0 + T - alto - 2, 3, 2);
          px(x0 + fx - 1, y0 + T - alto - 2, "#ffffff");
        });
        return;
      }
      const colores = [["#fff4de", "#f2c14e"], ["#7aa6cf", "#fff4de"], ["#ff9b6a", "#fff1b0"]];
      [2, 7, 12].forEach((fx, i) => {
        const alto = 4 + Math.floor(rn(cx, i, 14) * 4);
        const [petalo, centro] = colores[(i + cx) % 3];
        c.fillStyle = "#2f5f7e"; c.fillRect(x0 + fx, y0 + T - alto, 1, alto);
        const py = y0 + T - alto - 2;
        px(x0 + fx, py - 1, petalo); px(x0 + fx - 1, py, petalo); px(x0 + fx + 1, py, petalo); px(x0 + fx, py + 1, petalo);
        px(x0 + fx, py, centro);
      });
    }

    function adornoGrande(cx, cy) {
      const x0 = cx * T, base = cy * T + T;
      if (tema === "bosque") {
        // Hongo gigante luminoso
        c.fillStyle = TINTA; c.fillRect(x0 + 5, base - 14, 6, 14);
        c.fillStyle = "#f3e4c8"; c.fillRect(x0 + 6, base - 14, 4, 14);
        c.fillStyle = "#d4bc96"; c.fillRect(x0 + 9, base - 14, 1, 14);
        for (let y = 0; y < 10; y++) for (let x = -2; x < 20; x++) {
          const d = Math.hypot((x - 8) / 10, (y - 10) / 9);
          if (d > 1) continue;
          px(x0 + x, base - 24 + y, d > 0.86 ? TINTA : (x + y) % 5 === 0 && y < 7 ? "#ffffff" : y < 4 ? "#a6fff0" : "#3fd6c0");
        }
        return;
      }
      if (tema === "digital") {
        // Antena con luz
        c.fillStyle = TINTA; c.fillRect(x0 + 6, base - 26, 4, 26);
        c.fillStyle = "#5a72a0"; c.fillRect(x0 + 7, base - 26, 2, 26);
        c.fillStyle = TINTA; c.fillRect(x0 + 4, base - 30, 8, 5);
        c.fillStyle = "#ff6bd5"; c.fillRect(x0 + 5, base - 29, 6, 3);
        px(x0 + 5, base - 29, "#ffffff");
        return;
      }
      if (tema === "pesadilla") {
        // Árbol muerto retorcido
        let x = x0 + 8;
        for (let y = 0; y < 26; y++) {
          const ancho = y < 6 ? 3 : 2;
          c.fillStyle = TINTA; c.fillRect(x - 1, base - y - 1, ancho + 2, 1);
          c.fillStyle = "#2a1a30"; c.fillRect(x, base - y - 1, ancho, 1);
          if (y % 7 === 6) x += y % 14 === 6 ? 1 : -1;
        }
        for (let i = 0; i < 6; i++) { px(x0 + 9 + i, base - 22 - i, "#2a1a30"); px(x0 + 6 - i, base - 18 - Math.floor(i / 2), "#2a1a30"); }
        return;
      }
      // Noche: farol de sueño
      c.fillStyle = TINTA; c.fillRect(x0 + 6, base - 22, 4, 22);
      c.fillStyle = "#3f6d98"; c.fillRect(x0 + 7, base - 22, 2, 22);
      c.fillStyle = TINTA; c.fillRect(x0 + 3, base - 30, 10, 9);
      c.fillStyle = "#ffcc66"; c.fillRect(x0 + 4, base - 29, 8, 7);
      c.fillStyle = "#fff1b0"; c.fillRect(x0 + 5, base - 28, 3, 3);
    }
  }

  /* =======================================================
     FONDOS CON PARALLAX (uno por mundo)
     Las capas miden 180 px de alto y se apoyan en el borde
     inferior; si la pantalla es más alta, el cielo crece.
     ======================================================= */
  const CIELOS = {
    noche: [[0, "#0d0f26"], [0.28, "#161b40"], [0.52, "#232d66"], [0.72, "#36468a"], [0.86, "#5d5893"], [1, "#a86d7c"]],
    bosque: [[0, "#07141a"], [0.35, "#0d2a2c"], [0.6, "#16413c"], [0.8, "#2d5a48"], [1, "#6a7a52"]],
    digital: [[0, "#06051a"], [0.35, "#120a35"], [0.6, "#25105a"], [0.82, "#4a1670"], [1, "#9a2f7a"]],
    pesadilla: [[0, "#050207"], [0.4, "#12060f"], [0.65, "#2a0a1c"], [0.85, "#4a0f24"], [1, "#6e1a2a"]]
  };

  function cielo(tema, W, H) {
    const capa = crearCanvas(W, H);
    const c = capa.getContext("2d");
    const paradas = CIELOS[tema];
    for (let y = 0; y < H; y++) {
      const t = Math.max(0, (y - (H - ALTO_BASE)) / (ALTO_BASE - 1));
      let i = 0;
      while (i < paradas.length - 2 && t > paradas[i + 1][0]) i++;
      const [t0, c0] = paradas[i], [t1, c1] = paradas[i + 1];
      const f = Math.max(0, Math.min(1, (t - t0) / (t1 - t0)));
      for (let x = 0; x < W; x++) {
        c.fillStyle = f * 16 > BAYER[y % 4][x % 4] ? c1 : c0;
        c.fillRect(x, y, 1, 1);
      }
    }
    return capa;
  }

  function perfil(x, armonicos, semilla) {
    let h = 0;
    armonicos.forEach(([k, a], i) => { h += Math.sin((2 * Math.PI * k * x) / PERIODO + semilla * (i + 1)) * a; });
    return h;
  }

  function capaSilueta(altura, colorBase, colorBorde, extra) {
    const capa = crearCanvas(PERIODO, ALTO_BASE);
    const c = capa.getContext("2d");
    for (let x = 0; x < PERIODO; x++) {
      const top = Math.round(ALTO_BASE - altura(x));
      c.fillStyle = colorBase; c.fillRect(x, top, 1, ALTO_BASE - top);
      c.fillStyle = colorBorde; c.fillRect(x, top, 1, 1);
    }
    if (extra) extra(c, altura);
    return capa;
  }

  const px = (c, x, y, color) => { c.fillStyle = color; c.fillRect(x, y, 1, 1); };

  /* ---------- Sueño nocturno ---------- */
  function capasNoche(sem) {
    const luna = crearCanvas(40, 40);
    const l = luna.getContext("2d");
    for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) {
      const d = Math.hypot(x - 19.5, y - 19.5);
      if (d <= 12.5) {
        let color = "#fff1d0";
        if (Math.hypot(x - 23, y - 23) > 12) color = "#fff8e6";
        if (Math.hypot(x - 16, y - 16) > 12.6) color = "#f0d39c";
        [[15, 14, 2.6], [23, 19, 2], [18, 24, 3], [24, 13, 1.4]].forEach(([kx, ky, kr]) => {
          if (Math.hypot(x - kx, y - ky) <= kr) color = "#e3c287";
        });
        if (d > 11.6) color = "#e9c98f";
        px(l, x, y, color);
      } else if (d <= 16 && (x + y) % 2 === 0) {
        px(l, x, y, "rgba(255, 241, 208, 0.18)");
      }
    }
    const montanas = capaSilueta((x) => 78 + perfil(x, [[2, 14], [5, 7], [11, 3]], 1.7 + sem), "#1d2556", "#34428a");
    const islas = crearCanvas(PERIODO, ALTO_BASE);
    const ic = islas.getContext("2d");
    [{ x: 60, y: 62, w: 46, casa: true }, { x: 230, y: 44, w: 30 }, { x: 360, y: 72, w: 54, cascada: true }, { x: 465, y: 50, w: 24 }].forEach((isla, n) => {
      const ix = (isla.x + sem * 97) % PERIODO;
      for (let y = 0; y < isla.w * 0.55; y++) {
        const mitad = (isla.w / 2) * (1 - y / (isla.w * 0.55)) ** 0.8;
        for (let x = -Math.floor(mitad); x <= Math.floor(mitad); x++) {
          px(ic, (ix + x + PERIODO) % PERIODO, isla.y + y, x > mitad * 0.3 ? "#1c2350" : "#212a5c");
        }
      }
      // Borde superior apagado: son decorado lejano, no plataformas
      for (let x = -isla.w / 2; x <= isla.w / 2; x++) px(ic, (ix + x + PERIODO) % PERIODO, isla.y - 1, "#283368");
      if (isla.casa) {
        ic.fillStyle = "#2b3570"; ic.fillRect(ix - 6, isla.y - 8, 12, 8);
        ic.fillStyle = "#3a2a4a"; ic.fillRect(ix - 7, isla.y - 10, 14, 2);
        ic.fillStyle = "#ffcc66"; ic.fillRect(ix - 3, isla.y - 6, 3, 3);
      }
      if (isla.cascada) for (let y = 0; y < 30; y++) px(ic, ix + 12, isla.y + 6 + y, (y + n) % 2 ? "#7aa6cf" : "#4f7fb0");
    });
    const colinas = capaSilueta((x) => 46 + perfil(x, [[3, 9], [7, 4], [13, 2]], 4.1 + sem), "#141a3d", "#36438a", (c, altura) => {
      [[90, 0.35, 40], [300, -0.3, 32], [430, 0.2, 24]].forEach(([bx, inc, largo]) => {
        const base = Math.round(ALTO_BASE - altura(bx)) + 6;
        for (let i = 0; i < largo; i++) for (let w = -2; w <= 2; w++) {
          if (i > largo - 8 && Math.abs(w) > (largo - i) / 3) continue;
          px(c, Math.round(bx + i * inc) + w, base - i, i < 4 ? "#3a2a4a" : i > largo - 3 ? "#2a2147" : w === -2 ? "#323d7a" : "#262f63");
        }
      });
    });
    return {
      astro: { lienzo: luna, x: 246, y: 10 },
      capas: [[montanas, 0.1, 0], [islas, 0.2, 2], [colinas, 0.4, 0]],
      estrellas: true, aurora: sem % 2 === 1
    };
  }

  /* ---------- Bosque mágico ---------- */
  function capasBosque(sem) {
    const luna = crearCanvas(24, 24);
    const l = luna.getContext("2d");
    for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) {
      const d = Math.hypot(x - 11.5, y - 11.5);
      if (d <= 8) px(l, x, y, d > 7 ? "#bfe8c8" : "#e9fff0");
      else if (d <= 11 && (x + y) % 2 === 0) px(l, x, y, "rgba(200, 255, 220, 0.16)");
    }
    const arbolesLejos = capaSilueta((x) => 60 + perfil(x, [[4, 6], [9, 3]], 2.2 + sem), "#123029", "#1d4a3e", (c, altura) => {
      for (let i = 0; i < 26; i++) {
        const bx = Math.floor(ruido(i, sem, 31) * PERIODO);
        const top = Math.round(ALTO_BASE - altura(bx));
        const alto = 14 + Math.floor(ruido(i, sem, 32) * 16);
        for (let y = 0; y < alto; y++) {
          const ancho = Math.round((y / alto) * 7) + 1;
          c.fillStyle = "#123029"; c.fillRect(bx - ancho, top - alto + y, ancho * 2, 1);
          px(c, bx - ancho, top - alto + y, "#1d4a3e");
        }
      }
    });
    const arbolesMedio = capaSilueta((x) => 44 + perfil(x, [[3, 8], [8, 4]], 5.3 + sem), "#0b231f", "#174036", (c, altura) => {
      for (let i = 0; i < 9; i++) {
        const bx = Math.floor(ruido(i, sem, 41) * PERIODO);
        const top = Math.round(ALTO_BASE - altura(bx));
        c.fillStyle = "#0b231f"; c.fillRect(bx - 2, top - 30, 5, 30);
        for (let y = -22; y < 0; y++) for (let x = -14; x <= 14; x++) {
          if (Math.hypot(x / 14, (y + 30) / 16) <= 1) px(c, bx + x, top - 30 + y + 16, ruido(bx + x, y, 42) < 0.08 ? "#174036" : "#0b231f");
        }
        // Hongos luminosos al pie
        for (let k = 0; k < 3; k++) {
          const hx = bx - 10 + k * 9, hy = top - 2;
          const color = k % 2 ? "#ff8fd1" : "#7ff0d0";
          px(c, hx, hy, color); px(c, hx + 1, hy, color); px(c, hx - 1, hy + 1, color); px(c, hx + 2, hy + 1, color);
          px(c, hx, hy + 1, "#f3e4c8");
        }
      }
    });
    const helechos = capaSilueta((x) => 26 + perfil(x, [[6, 5], [15, 2]], 8.1 + sem), "#061712", "#0f2d24", (c, altura) => {
      for (let i = 0; i < 14; i++) {
        const bx = Math.floor(ruido(i, sem, 51) * PERIODO);
        const top = Math.round(ALTO_BASE - altura(bx));
        for (let k = 0; k < 12; k++) { px(c, bx + k, top - Math.round(Math.sin(k / 3) * 6) - k / 2, "#0f2d24"); px(c, bx - k, top - Math.round(Math.sin(k / 3) * 6) - k / 2, "#0f2d24"); }
      }
    });
    return { astro: { lienzo: luna, x: 60, y: 18 }, capas: [[arbolesLejos, 0.1, 0], [arbolesMedio, 0.25, 0], [helechos, 0.45, 0]], esporas: true };
  }

  /* ---------- Mundo digital ---------- */
  function capasDigital(sem) {
    const sol = crearCanvas(44, 44);
    const s = sol.getContext("2d");
    for (let y = 0; y < 44; y++) for (let x = 0; x < 44; x++) {
      const d = Math.hypot(x - 21.5, y - 21.5);
      if (d > 18) continue;
      if (y > 22 && (y - 22) % 4 < 1 + Math.floor((y - 22) / 6)) continue; // cortes de barrido
      px(s, x, y, y < 14 ? "#ffd23f" : y < 24 ? "#ff8a3d" : "#ff4d8d");
    }
    const torres = capaSilueta((x) => 30, "#0c0a26", "#1d1650", (c) => {
      for (let i = 0; i < 22; i++) {
        const bx = Math.floor(ruido(i, sem, 61) * PERIODO);
        const ancho = 10 + Math.floor(ruido(i, sem, 62) * 16);
        const alto = 40 + Math.floor(ruido(i, sem, 63) * 70);
        c.fillStyle = "#0c0a26"; c.fillRect(bx, ALTO_BASE - 30 - alto, ancho, alto);
        c.fillStyle = "#1d1650"; c.fillRect(bx, ALTO_BASE - 30 - alto, ancho, 1);
        for (let y = 4; y < alto - 2; y += 4) for (let x = 2; x < ancho - 2; x += 3) {
          if (ruido(bx + x, y, 64) < 0.3) px(c, bx + x, ALTO_BASE - 30 - alto + y, ruido(x, bx + y, 65) < 0.5 ? "#5ff0ff" : "#ff6bd5");
        }
      }
    });
    const circuitos = capaSilueta((x) => 38 + perfil(x, [[2, 4]], 3 + sem), "#100c30", "#3a2a8a", (c, altura) => {
      for (let i = 0; i < 18; i++) {
        let x = Math.floor(ruido(i, sem, 71) * PERIODO);
        let y = Math.round(ALTO_BASE - altura(x)) + 6;
        for (let k = 0; k < 40; k++) {
          px(c, x, y, "#3a2a8a");
          if (ruido(i, k, 72) < 0.3) y += 1; else x += 1;
          if (y > ALTO_BASE - 2) break;
        }
        px(c, x, y, "#5ff0ff"); px(c, x + 1, y, "#5ff0ff");
      }
    });
    const chips = capaSilueta((x) => 18 + (Math.floor(x / 40) % 3) * 6, "#07061a", "#2a1f6a", (c, altura) => {
      for (let i = 0; i < 10; i++) {
        const bx = Math.floor(ruido(i, sem, 81) * PERIODO);
        const top = Math.round(ALTO_BASE - altura(bx));
        c.fillStyle = "#07061a"; c.fillRect(bx, top - 14, 22, 14);
        c.fillStyle = "#2a1f6a"; c.fillRect(bx, top - 14, 22, 1);
        for (let k = 0; k < 5; k++) px(c, bx + 2 + k * 4, top - 16, "#2a1f6a");
      }
    });
    return { astro: { lienzo: sol, x: 200, y: 26 }, capas: [[torres, 0.1, 0], [circuitos, 0.25, 0], [chips, 0.45, 0]], datos: true, rejilla: true };
  }

  /* ---------- Pesadilla ---------- */
  function capasPesadilla(sem) {
    const luna = crearCanvas(36, 36);
    const l = luna.getContext("2d");
    for (let y = 0; y < 36; y++) for (let x = 0; x < 36; x++) {
      const d = Math.hypot(x - 17.5, y - 17.5);
      if (d <= 11) px(l, x, y, Math.hypot(x - 21, y - 14) < 10 ? "#6e1a2a" : "#ff4d6d");
      else if (d <= 16 && (x + y) % 2 === 0) px(l, x, y, "rgba(255, 77, 109, 0.14)");
    }
    const arboles = capaSilueta((x) => 52 + perfil(x, [[3, 8], [7, 3]], 6.6 + sem), "#100510", "#2a0a1c", (c, altura) => {
      for (let i = 0; i < 12; i++) {
        let x = Math.floor(ruido(i, sem, 91) * PERIODO);
        let y = Math.round(ALTO_BASE - altura(x));
        for (let k = 0; k < 40; k++) {
          c.fillStyle = "#100510"; c.fillRect(x, y, 2, 1);
          y--; if (ruido(i, k, 92) < 0.25) x += ruido(i, k, 93) < 0.5 ? -1 : 1;
          if (k > 20 && k % 6 === 0) for (let r = 0; r < 8; r++) px(c, x + (k % 12 ? r : -r), y - Math.floor(r / 2), "#100510");
        }
      }
    });
    const colinas = capaSilueta((x) => 34 + perfil(x, [[4, 6], [10, 2]], 9.2 + sem), "#0a0309", "#240a1c");
    return { astro: { lienzo: luna, x: 230, y: 14 }, capas: [[arboles, 0.12, 0], [colinas, 0.3, 0]], ojos: true, niebla: true };
  }

  const CONSTRUCTORES = { noche: capasNoche, bosque: capasBosque, digital: capasDigital, pesadilla: capasPesadilla };

  function construirFondo(tema, variante) {
    const nombre = tema || "noche";
    const sem = variante || 0;
    const def = CONSTRUCTORES[nombre](sem);
    const cieloCache = { W: 0, H: 0, lienzo: null };

    const estrellas = [];
    for (let i = 0; i < 90; i++) {
      estrellas.push({ x: ruido(i, 1, 7 + sem) * 480, y: ruido(i, 2, 7 + sem), fase: ruido(i, 3, 7) * 6.28, tipo: ruido(i, 4, 7) < 0.1 ? 2 : ruido(i, 5, 7) < 0.3 ? 1 : 0 });
    }
    const brillos = [];
    for (let i = 0; i < 16; i++) brillos.push({ x: ruido(i, 9, 3 + sem) * 480, y: ruido(i, 8, 3), fase: ruido(i, 7, 3) * 6.28 });
    const ojos = [];
    for (let i = 0; i < 7; i++) ojos.push({ x: ruido(i, 11, 5 + sem) * PERIODO, y: 0.45 + ruido(i, 12, 5) * 0.35, fase: ruido(i, 13, 5) * 9 });
    let fugaz = null;

    function capaRepetida(ctx, lienzo, desplazamiento, y, W) {
      let x = -(((desplazamiento % PERIODO) + PERIODO) % PERIODO);
      for (; x < W; x += PERIODO) ctx.drawImage(lienzo, Math.round(x), y);
    }

    function dibujar(ctx, camX, t, W, H) {
      W = W || 320; H = H || ALTO_BASE;
      if (cieloCache.W !== W || cieloCache.H !== H) {
        cieloCache.lienzo = cielo(nombre, W, H);
        cieloCache.W = W; cieloCache.H = H;
      }
      ctx.drawImage(cieloCache.lienzo, 0, 0);
      const base = H - ALTO_BASE;

      if (def.aurora) {
        for (let x = 0; x < W; x += 2) {
          const y = base + 30 + Math.sin(x * 0.03 + t * 0.4) * 10;
          ctx.fillStyle = "rgba(122, 255, 200, 0.10)";
          ctx.fillRect(x, Math.round(y), 2, 18 + Math.round(Math.sin(x * 0.05 + t) * 6));
        }
      }

      if (def.estrellas || nombre === "pesadilla" || nombre === "bosque") {
        const zona = base + 110;
        estrellas.forEach((e, i) => {
          if (nombre !== "noche" && i % 3) return;
          let x = (e.x - camX * 0.03) % 480;
          if (x < 0) x += 480;
          if (x > W) return;
          const y = Math.round(e.y * zona);
          const brillo = Math.sin(t * 1.7 + e.fase);
          const xi = Math.round(x);
          if (e.tipo === 2 && nombre === "noche") {
            ctx.fillStyle = "#fff1d0"; ctx.fillRect(xi, y, 1, 1);
            if (brillo > -0.2) { ctx.fillRect(xi - 1, y, 3, 1); ctx.fillRect(xi, y - 1, 1, 3); }
          } else if (brillo > (e.tipo === 1 ? -0.6 : 0)) {
            ctx.fillStyle = nombre === "pesadilla" ? "#7a2a3a" : e.tipo === 1 ? "#fff1d0" : "#9aa6dc";
            ctx.fillRect(xi, y, 1, 1);
          }
        });
      }

      if (nombre === "noche") {
        if (!fugaz && Math.random() < 0.0025) fugaz = { x: 40 + Math.random() * (W - 120), y: 8 + Math.random() * 40, vida: 0 };
        if (fugaz) {
          fugaz.vida += 1 / 60;
          const avance = fugaz.vida * 160;
          for (let i = 0; i < 10; i++) {
            ctx.globalAlpha = (1 - i / 10) * Math.max(0, 1 - fugaz.vida * 1.4);
            ctx.fillStyle = "#fff1d0";
            ctx.fillRect(Math.round(fugaz.x + avance - i * 2), Math.round(fugaz.y + (avance - i * 2) * 0.45), 1, 1);
          }
          ctx.globalAlpha = 1;
          if (fugaz.vida > 0.8) fugaz = null;
        }
      }

      if (def.rejilla) {
        // Rejilla digital en el horizonte
        const hz = base + 120;
        ctx.fillStyle = "rgba(255, 107, 213, 0.18)";
        for (let y = hz; y < H; y += Math.max(2, Math.round((y - hz) / 6) + 2)) ctx.fillRect(0, y, W, 1);
        for (let x = -((camX * 0.3) % 24); x < W; x += 24) ctx.fillRect(Math.round(x), hz, 1, H - hz);
      }

      const a = def.astro;
      ctx.drawImage(a.lienzo, Math.round(W * (a.x / 320) - camX * 0.02), base + a.y);

      def.capas.forEach(([lienzo, factor, extra]) => {
        capaRepetida(ctx, lienzo, camX * factor + (extra ? t * extra : 0), base + (extra ? Math.round(Math.sin(t * 0.6) * 1.5) : 0), W);
      });

      if (def.ojos) {
        ojos.forEach((o) => {
          let x = (o.x - camX * 0.3) % PERIODO;
          if (x < 0) x += PERIODO;
          if (x > W) return;
          const abierto = (t + o.fase) % 5 > 0.3;
          if (!abierto) return;
          const y = Math.round(base + 180 - 40 * o.y);
          ctx.fillStyle = "#ff4d6d";
          ctx.fillRect(Math.round(x), y, 2, 1);
          ctx.fillRect(Math.round(x) + 5, y, 2, 1);
        });
      }
    }

    function dibujarFrente(ctx, camX, t, W, H) {
      W = W || 320; H = H || ALTO_BASE;
      const base = H - ALTO_BASE;
      if (def.niebla) {
        for (let b = 0; b < 3; b++) {
          const y = base + 120 + b * 18;
          for (let x = 0; x < W; x += 2) {
            const v = Math.sin((x + camX * (0.6 + b * 0.2)) * 0.03 + t * (0.5 + b * 0.2) + b);
            if (v < 0.2) continue;
            ctx.fillStyle = "rgba(120, 60, 110, 0.10)";
            ctx.fillRect(x, y + Math.round(v * 4), 2, 10 + Math.round(v * 6));
          }
        }
      }
      const color = nombre === "bosque" ? "#b6ff9a" : nombre === "digital" ? "#5ff0ff" : nombre === "pesadilla" ? "#ff7a5a" : "#ffd678";
      brillos.forEach((l, i) => {
        if (def.datos) {
          // Lluvia de datos: columnas de pixeles que caen
          const x = Math.round((((l.x - camX * 0.7) % 480) + 480) % 480);
          if (x > W) return;
          const y = Math.round(((t * 40 + l.fase * 30) % (H + 30)) - 20);
          for (let k = 0; k < 6; k++) { ctx.fillStyle = k === 0 ? "#d6fdff" : "rgba(95, 240, 255, " + (0.5 - k * 0.08).toFixed(2) + ")"; ctx.fillRect(x, y - k * 3, 1, 2); }
          return;
        }
        let x = (l.x - camX * 0.9 + Math.sin(t * 0.5 + l.fase) * 14) % 480;
        if (x < 0) x += 480;
        if (x > W) return;
        const y = base + 50 + l.y * 120 + Math.sin(t * 0.9 + l.fase * 2) * 6 - (nombre === "pesadilla" ? (t * 12 + l.fase * 20) % 60 : 0);
        if (Math.sin(t * 2 + l.fase) < -0.2) return;
        const xi = Math.round(x), yi = Math.round(y);
        ctx.fillStyle = "rgba(255, 214, 120, 0.22)";
        ctx.fillRect(xi - 1, yi, 3, 1); ctx.fillRect(xi, yi - 1, 1, 3);
        ctx.fillStyle = i % 3 ? color : "#ffffff";
        ctx.fillRect(xi, yi, 1, 1);
      });
    }

    return { tema: nombre, dibujar: dibujar, dibujarFrente: dibujarFrente };
  }

  /* =======================================================
     ALMOHADA VOLADORA (plataforma móvil del modo Aventura)
     ======================================================= */
  function almohada(cuadro) {
    const W = 56, H = 16;
    const capa = crearCanvas(W, H);
    const c = capa.getContext("2d");
    const ox = 4, oy = 4, w = 48, h = 10;
    const dentro = (x, y) => {
      if (x < 0 || x >= w || y < 0 || y >= h) return false;
      const curva = Math.sin((x / (w - 1)) * Math.PI) * 1.5;
      if (y < 1.5 - curva || y > h - 1.5 + curva) return false;
      if ((x < 2 || x > w - 3) && (y < 2 || y > h - 3)) return true;
      return x >= 1 && x <= w - 2;
    };
    const ala = cuadro === 0 ? ["..kk..", ".k66k.", "k6666k", ".kkkk."] : ["......", "kkkkk.", "k6666k", ".kk66k"];
    const colores = { k: TINTA, "6": "#ffffff" };
    [[0, 3], [W - 6, 3]].forEach(([ax, ay], lado) => {
      ala.forEach((fila, y) => {
        for (let x = 0; x < 6; x++) {
          const chr = lado ? fila[5 - x] : fila[x];
          if (colores[chr]) px(c, ax + x, ay + y + (cuadro === 0 ? -2 : 0), colores[chr]);
        }
      });
    });
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!dentro(x, y)) continue;
      const borde = !dentro(x - 1, y) || !dentro(x + 1, y) || !dentro(x, y - 1) || !dentro(x, y + 1);
      let color = "#fff4de";
      if (borde) color = TINTA;
      else if (!dentro(x, y - 2)) color = "#ffffff";
      else if (y >= h - 3) color = "#d9c7a6";
      if (!borde && (y === 5 || y === 6) && x > 2 && x < w - 3) color = y === 5 ? "#4f8bab" : "#2f5f7e";
      if (!borde && (x === 16 || x === 32) && y > 1 && y < h - 2) color = "#e8dcc4";
      px(c, ox + x, oy + y, color);
    }
    return capa;
  }

  /* Portal de sueño: marca el cambio de mundo */
  function portal(tema) {
    const W = 28, H = 44;
    const capa = crearCanvas(W, H);
    const c = capa.getContext("2d");
    const color = { noche: "#ffd678", bosque: "#7ff0d0", digital: "#ff6bd5", pesadilla: "#ff4d6d" }[tema] || "#ffd678";
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const d = Math.hypot((x - 13.5) / 13.5, (y - 22) / 22);
      if (d > 1) continue;
      if (d > 0.82) px(c, x, y, TINTA);
      else if (d > 0.68) px(c, x, y, color);
      else if ((x + y) % 2 === 0) px(c, x, y, "rgba(255, 255, 255, 0.10)");
    }
    return capa;
  }

  return {
    TEMAS: TEMAS,
    construirCapaNivel: construirCapaNivel,
    construirFondo: construirFondo,
    almohada: [almohada(0), almohada(1)],
    portal: portal
  };
})();
