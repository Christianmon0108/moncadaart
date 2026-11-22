/* =========================================================
   MONKY DREAMS — ESCENARIO EN PIXEL ART
   Casillas del nivel, fondo con parallax, decoraciones y la
   almohada voladora. Todo se dibuja pixel a pixel con código
   y se guarda en lienzos para no repetir trabajo cada cuadro.
   ========================================================= */

window.MonkyEscenario = (function () {
  "use strict";

  const T = 16;
  const ANCHO = 320;
  const ALTO = 180;
  const TINTA = "#16152a";

  function crearCanvas(ancho, alto) {
    const c = document.createElement("canvas");
    c.width = ancho;
    c.height = alto;
    return c;
  }

  function ruido(x, y, s) {
    let h = (x * 374761393 + y * 668265263 + (s || 0) * 1442695041) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  const BAYER = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5]
  ];

  /* =======================================================
     CASILLAS DEL NIVEL
     ======================================================= */
  const SUELO = { hondo: "#3a1f15", oscuro: "#4f2c1d", base: "#6b3f2a", claro: "#8a5538" };
  const MUSGO = { brillo: "#ffb56e", base: "#e8792e", medio: "#d3662a", oscuro: "#a9481b" };
  const PIEDRA = ["#a5876f", "#76594a", "#4d3a30"];

  function construirCapaNivel(mapa) {
    const filas = mapa.length;
    const columnas = mapa.reduce((m, f) => Math.max(m, f.length), 0);
    const capa = crearCanvas(columnas * T, filas * T);
    const c = capa.getContext("2d");
    const ch = (cx, cy) => (cy < 0 || cy >= filas || cx < 0 || cx >= columnas ? (cy >= filas ? "#" : ".") : mapa[cy][cx] || ".");
    const px = (x, y, color) => { c.fillStyle = color; c.fillRect(x, y, 1, 1); };

    // Primero el suelo y los bloques, luego nubes, púas y decoraciones
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
        const esNube = ch(cx, cy) === "-";
        if (esNube && inicio < 0) inicio = cx;
        if (!esNube && inicio >= 0) { nube(inicio, cx - 1, cy); inicio = -1; }
      }
    }
    for (let cy = 0; cy < filas; cy++) {
      for (let cx = 0; cx < columnas; cx++) {
        const t = ch(cx, cy);
        if (t === "^") puas(cx, cy);
        else if (t === "a") letrero(cx, cy);
        else if (t === "f") flores(cx, cy);
      }
    }
    return capa;

    function suelo(cx, cy) {
      const x0 = cx * T, y0 = cy * T;
      const arriba = ch(cx, cy - 1) === "#";
      const izq = ch(cx - 1, cy) === "#";
      const der = ch(cx + 1, cy) === "#";
      const superficie = !arriba;

      for (let y = 0; y < T; y++) {
        for (let x = 0; x < T; x++) {
          const gx = x0 + x, gy = y0 + y;
          const n = ruido(gx, gy, 1);
          let color = SUELO.base;
          if ((gy + Math.floor(ruido(Math.floor(gx / 5), cy, 2) * 4)) % 9 === 0 && n < 0.7) color = SUELO.oscuro;
          if (n < 0.05) color = SUELO.claro;
          else if (n > 0.96) color = SUELO.hondo;
          px(gx, gy, color);
        }
      }

      // Piedritas incrustadas
      for (let i = 0; i < 2; i++) {
        if (ruido(cx, cy, 10 + i) > 0.55) continue;
        const sx = x0 + 2 + Math.floor(ruido(cx, cy, 20 + i) * 10);
        const sy = y0 + (superficie ? 7 : 2) + Math.floor(ruido(cx, cy, 30 + i) * 6);
        c.fillStyle = PIEDRA[1]; c.fillRect(sx, sy, 3, 2);
        px(sx, sy, PIEDRA[0]); px(sx + 1, sy, PIEDRA[0]);
        c.fillStyle = PIEDRA[2]; c.fillRect(sx, sy + 2, 3, 1); px(sx + 3, sy + 1, PIEDRA[2]);
      }

      if (superficie) {
        for (let x = 0; x < T; x++) {
          const gx = x0 + x;
          const grosor = 4 + (ruido(gx, cy, 3) < 0.35 ? 1 : 0) + (ruido(gx, cy, 4) < 0.12 ? 1 : 0);
          for (let y = 0; y < grosor; y++) {
            let color = MUSGO.base;
            if (y === 0) color = MUSGO.brillo;
            else if (y === grosor - 1) color = MUSGO.oscuro;
            else if (y >= 2 && ruido(gx, y0 + y, 5) < 0.35) color = MUSGO.medio;
            px(gx, y0 + y, color);
          }
          px(gx, y0 + grosor, SUELO.hondo);
        }
        c.fillStyle = TINTA;
        c.fillRect(x0 + (izq ? 0 : 2), y0 - 1, T - (izq ? 0 : 2) - (der ? 0 : 2), 1);
        // Briznas que sobresalen, pegadas al musgo
        for (let x = (izq ? 0 : 3); x < T - (der ? 0 : 3); x++) {
          const gx = x0 + x;
          const r = ruido(gx, cy, 6);
          if (r < 0.16) { px(gx, y0 - 1, MUSGO.base); px(gx, y0 - 2, MUSGO.brillo); px(gx, y0 - 3, TINTA); }
          else if (r < 0.36) { px(gx, y0 - 1, MUSGO.brillo); px(gx, y0 - 2, TINTA); }
        }
      }

      if (!izq) {
        c.fillStyle = TINTA; c.fillRect(x0, y0, 1, T);
        c.fillStyle = SUELO.hondo; c.fillRect(x0 + 1, y0 + (superficie ? 5 : 0), 1, T - (superficie ? 5 : 0));
        if (superficie) {
          c.clearRect(x0, y0 - 1, 2, 2); c.clearRect(x0, y0 + 1, 1, 1);
          px(x0 + 1, y0, TINTA); px(x0, y0 + 1, TINTA); px(x0 + 2, y0 - 1, TINTA);
        }
      }
      if (!der) {
        c.fillStyle = TINTA; c.fillRect(x0 + T - 1, y0, 1, T);
        c.fillStyle = SUELO.oscuro; c.fillRect(x0 + T - 2, y0 + (superficie ? 5 : 0), 1, T - (superficie ? 5 : 0));
        if (superficie) {
          c.clearRect(x0 + T - 2, y0 - 1, 2, 2); c.clearRect(x0 + T - 1, y0 + 1, 1, 1);
          px(x0 + T - 2, y0, TINTA); px(x0 + T - 1, y0 + 1, TINTA); px(x0 + T - 3, y0 - 1, TINTA);
        }
      }
    }

    function bloque(cx, cy) {
      const x0 = cx * T, y0 = cy * T;
      const es = (dx, dy) => ch(cx + dx, cy + dy) === "B";
      c.fillStyle = "#ead9bd"; c.fillRect(x0, y0, T, T);
      c.fillStyle = "#fff6e6"; c.fillRect(x0, y0, T, 2); c.fillRect(x0, y0, 2, T);
      c.fillStyle = "#c9ad85"; c.fillRect(x0, y0 + T - 3, T, 3); c.fillRect(x0 + T - 3, y0, 3, T);
      c.fillStyle = "#a68962"; c.fillRect(x0, y0 + T - 1, T, 1); c.fillRect(x0 + T - 1, y0, 1, T);
      // Rombo naranja (emblema)
      for (let y = 0; y < T; y++) {
        for (let x = 0; x < T; x++) {
          const d = Math.abs(x - 7.5) + Math.abs(y - 7.5);
          if (d <= 3.5) px(x0 + x, y0 + y, x + y < 15 ? "#ffa860" : "#e8792e");
          else if (d <= 4.5) px(x0 + x, y0 + y, "#a9481b");
        }
      }
      if (ruido(cx, cy, 7) < 0.5) { px(x0 + 3, y0 + 11, "#c9ad85"); px(x0 + 4, y0 + 12, "#c9ad85"); }
      c.fillStyle = TINTA;
      if (!es(0, -1)) c.fillRect(x0, y0, T, 1);
      if (!es(0, 1)) c.fillRect(x0, y0 + T - 1, T, 1);
      if (!es(-1, 0)) c.fillRect(x0, y0, 1, T);
      if (!es(1, 0)) c.fillRect(x0 + T - 1, y0, 1, T);
    }

    function nube(cx0, cx1, cy) {
      const x0 = cx0 * T - 2, ancho = (cx1 - cx0 + 1) * T + 4;
      const y0 = cy * T - 3;
      const alto = 13;
      const dentro = (x, y) => {
        if (x < 0 || x >= ancho || y < 0 || y >= alto) return false;
        // Cuerpo con extremos redondeados + bultos en la parte de arriba
        const base = y >= 4 && y <= 10 && x >= 3 && x < ancho - 3;
        const extremoI = Math.hypot(x - 4, y - 7) <= 4.2;
        const extremoD = Math.hypot(x - (ancho - 5), y - 7) <= 4.2;
        let bulto = false;
        for (let bx = 7; bx < ancho - 5; bx += 9) {
          const r = 4 + ruido(bx + cx0 * 31, cy, 8) * 1.6;
          if (Math.hypot(x - bx, y - 5.5) <= r) bulto = true;
        }
        return base || extremoI || extremoD || bulto;
      };
      for (let y = 0; y < alto; y++) {
        for (let x = 0; x < ancho; x++) {
          if (!dentro(x, y)) continue;
          const borde = !dentro(x - 1, y) || !dentro(x + 1, y) || !dentro(x, y - 1) || !dentro(x, y + 1);
          let color = "#fff4de";
          if (borde) color = TINTA;
          else if (!dentro(x, y - 2)) color = "#ffffff";
          else if (y >= alto - 3) color = "#c9b8ea";
          else if (y >= alto - 5) color = "#e7dcf6";
          px(x0 + x, y0 + y, color);
        }
      }
    }

    function puas(cx, cy) {
      const x0 = cx * T, base = cy * T + T;
      const cristales = [
        { x: 0, w: 6, h: 8 + Math.floor(ruido(cx, cy, 11) * 3) },
        { x: 5, w: 6, h: 11 + Math.floor(ruido(cx, cy, 12) * 3) },
        { x: 10, w: 6, h: 7 + Math.floor(ruido(cx, cy, 13) * 3) }
      ];
      cristales.forEach((k) => {
        for (let r = 0; r < k.h; r++) {
          const mitad = ((r + 1) / k.h) * (k.w / 2);
          const izq = Math.round(k.x + k.w / 2 - mitad);
          const der = Math.round(k.x + k.w / 2 + mitad) - 1;
          for (let x = izq; x <= der; x++) {
            let color = "#b9a7e0";
            if (x === izq || x === der) color = TINTA;
            else if (x < k.x + k.w / 2 - 0.5) color = "#efe6ff";
            else if (x > k.x + k.w / 2) color = "#7c64b8";
            px(x0 + x, base - k.h + r, color);
          }
        }
        px(x0 + k.x + Math.floor(k.w / 2), base - k.h - 1, TINTA);
      });
      c.fillStyle = "#4a3d7a"; c.fillRect(x0, base - 2, T, 2);
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
      // Flecha naranja
      c.fillStyle = "#e8792e";
      c.fillRect(x0 + 4, y0 + 4, 6, 2);
      c.fillRect(x0 + 9, y0 + 3, 1, 4);
      c.fillRect(x0 + 10, y0 + 4, 1, 2);
    }

    function flores(cx, cy) {
      const x0 = cx * T, y0 = cy * T;
      const colores = [["#fff4de", "#f2c14e"], ["#7aa6cf", "#fff4de"], ["#ff9b6a", "#fff1b0"]];
      [2, 7, 12].forEach((fx, i) => {
        const alto = 4 + Math.floor(ruido(cx, i, 14) * 4);
        const [petalo, centro] = colores[(i + cx) % 3];
        c.fillStyle = "#2f5f7e"; c.fillRect(x0 + fx, y0 + T - alto, 1, alto);
        if (i === 1) { px(x0 + fx + 1, y0 + T - 3, "#3f6d98"); }
        const py = y0 + T - alto - 2;
        px(x0 + fx, py - 1, petalo); px(x0 + fx - 1, py, petalo); px(x0 + fx + 1, py, petalo); px(x0 + fx, py + 1, petalo);
        px(x0 + fx, py, centro);
      });
    }
  }

  /* =======================================================
     FONDO CON PARALLAX
     ======================================================= */
  function cielo() {
    const capa = crearCanvas(ANCHO, ALTO);
    const c = capa.getContext("2d");
    const paradas = [
      [0, "#0d0f26"], [0.28, "#161b40"], [0.52, "#232d66"],
      [0.72, "#36468a"], [0.86, "#5d5893"], [1, "#a86d7c"]
    ];
    for (let y = 0; y < ALTO; y++) {
      const t = y / (ALTO - 1);
      let i = 0;
      while (i < paradas.length - 2 && t > paradas[i + 1][0]) i++;
      const [t0, c0] = paradas[i];
      const [t1, c1] = paradas[i + 1];
      const f = (t - t0) / (t1 - t0);
      for (let x = 0; x < ANCHO; x++) {
        c.fillStyle = f * 16 > BAYER[y % 4][x % 4] ? c1 : c0;
        c.fillRect(x, y, 1, 1);
      }
    }
    return capa;
  }

  function luna() {
    const capa = crearCanvas(40, 40);
    const c = capa.getContext("2d");
    for (let y = 0; y < 40; y++) {
      for (let x = 0; x < 40; x++) {
        const d = Math.hypot(x - 19.5, y - 19.5);
        if (d <= 12.5) {
          let color = "#fff1d0";
          if (Math.hypot(x - 23, y - 23) > 12) color = "#fff8e6";
          if (Math.hypot(x - 16, y - 16) > 12.6) color = "#f0d39c";
          [[15, 14, 2.6], [23, 19, 2], [18, 24, 3], [24, 13, 1.4]].forEach(([kx, ky, kr]) => {
            if (Math.hypot(x - kx, y - ky) <= kr) color = "#e3c287";
            if (Math.hypot(x - kx - 0.8, y - ky - 0.8) <= kr - 0.8 && Math.hypot(x - kx, y - ky) <= kr) color = "#f4dcaa";
          });
          if (d > 11.6) color = "#e9c98f";
          c.fillStyle = color;
          c.fillRect(x, y, 1, 1);
        } else if (d <= 18 && (x + y) % 2 === 0 && d <= 15 + ((x * 7 + y * 3) % 3)) {
          c.fillStyle = "rgba(255, 241, 208, 0.18)";
          c.fillRect(x, y, 1, 1);
        }
      }
    }
    return capa;
  }

  /* Perfil periódico (se repite sin costuras cada "periodo" píxeles) */
  function perfil(x, periodo, armonicos, semilla) {
    let h = 0;
    armonicos.forEach(([k, a], i) => {
      h += Math.sin((2 * Math.PI * k * x) / periodo + semilla * (i + 1)) * a;
    });
    return h;
  }

  const PERIODO = 512;

  function montanas() {
    const capa = crearCanvas(PERIODO, ALTO);
    const c = capa.getContext("2d");
    for (let x = 0; x < PERIODO; x++) {
      const h = 78 + perfil(x, PERIODO, [[2, 14], [5, 7], [11, 3]], 1.7);
      const top = Math.round(ALTO - h);
      const pendiente = perfil(x + 1, PERIODO, [[2, 14], [5, 7], [11, 3]], 1.7) - perfil(x, PERIODO, [[2, 14], [5, 7], [11, 3]], 1.7);
      for (let y = top; y < ALTO; y++) {
        let color = "#1d2556";
        if (y - top < 3 && pendiente > 0) color = "#2d3a7a";
        if ((y - top) > 18 && BAYER[y % 4][x % 4] < ((y - top - 18) / 40) * 16) color = "#19204b";
        c.fillStyle = color;
        c.fillRect(x, y, 1, 1);
      }
      c.fillStyle = "#34428a";
      c.fillRect(x, top, 1, 1);
    }
    return capa;
  }

  function islas() {
    const capa = crearCanvas(PERIODO, ALTO);
    const c = capa.getContext("2d");
    const px = (x, y, color) => { c.fillStyle = color; c.fillRect(x, y, 1, 1); };
    const lista = [
      { x: 60, y: 62, w: 46, casa: true },
      { x: 230, y: 44, w: 30, arbol: true },
      { x: 360, y: 72, w: 54, cascada: true, arbol: true },
      { x: 465, y: 50, w: 24 }
    ];
    lista.forEach((isla) => {
      // Roca invertida con tramado
      for (let y = 0; y < isla.w * 0.55; y++) {
        const mitad = (isla.w / 2) * (1 - y / (isla.w * 0.55)) ** 0.8;
        for (let x = -Math.floor(mitad); x <= Math.floor(mitad); x++) {
          let color = "#262f66";
          if (x > mitad * 0.3) color = "#1e2654";
          if (y > isla.w * 0.3 && BAYER[(y + 1) % 4][(x + 40) % 4] < 6) color = "#1a2149";
          px(isla.x + x, isla.y + y, color);
        }
      }
      for (let x = -isla.w / 2; x <= isla.w / 2; x++) {
        px(isla.x + x, isla.y - 1, "#3e4f92");
        px(isla.x + x, isla.y - 2, ruido(x, isla.x, 3) < 0.5 ? "#4a5ea6" : "#3e4f92");
      }
      if (isla.casa) {
        const hx = isla.x - 6, hy = isla.y - 12;
        c.fillStyle = "#2b3570"; c.fillRect(hx, hy + 4, 12, 8);
        for (let i = 0; i < 7; i++) { c.fillStyle = "#3a2a4a"; c.fillRect(hx - 1 + i, hy + 4 - i * 0.6, 14 - i * 2, 1); }
        c.fillStyle = "#3a2a4a"; c.fillRect(hx - 1, hy + 3, 14, 1);
        c.fillStyle = "#ffcc66"; c.fillRect(hx + 3, hy + 7, 3, 3);
        c.fillStyle = "#ffe9a8"; c.fillRect(hx + 3, hy + 7, 1, 1);
        c.fillStyle = "#2b3570"; c.fillRect(hx + 8, hy + 7, 2, 5);
      }
      if (isla.arbol) {
        const tx = isla.x + isla.w / 4, ty = isla.y - 2;
        c.fillStyle = "#1e2654"; c.fillRect(tx, ty - 6, 1, 6);
        for (let y = -12; y <= -5; y++) {
          for (let x = -4; x <= 4; x++) {
            if (Math.hypot(x, y + 8.5) <= 4.2) px(tx + x, ty + y, x < 0 && y < -8 ? "#4a5ea6" : "#33427f");
          }
        }
      }
      if (isla.cascada) {
        for (let y = 0; y < 30; y++) {
          px(isla.x + 12, isla.y + 6 + y, (y + Math.floor(y / 3)) % 2 ? "#7aa6cf" : "#4f7fb0");
          if (y > 20 && (y % 2)) px(isla.x + 12, isla.y + 6 + y, "rgba(122,166,207,0.4)");
        }
      }
    });
    return capa;
  }

  function colinas() {
    const capa = crearCanvas(PERIODO, ALTO);
    const c = capa.getContext("2d");
    const px = (x, y, color) => { c.fillStyle = color; c.fillRect(x, y, 1, 1); };
    const altura = (x) => 46 + perfil(x, PERIODO, [[3, 9], [7, 4], [13, 2]], 4.1);

    // Lápices gigantes clavados en las colinas (sueño de artista)
    const lapiz = (bx, inclinacion, largo) => {
      const base = Math.round(ALTO - altura(bx)) + 6;
      for (let i = 0; i < largo; i++) {
        const x = Math.round(bx + i * inclinacion), y = base - i;
        for (let w = -2; w <= 2; w++) {
          let color = "#262f63";
          if (w === -2) color = "#323d7a";
          if (i > largo - 8) color = w === -2 ? "#3a3f72" : "#2a2f5a"; // punta de madera
          if (i > largo - 3) color = "#2a2147";                        // grafito
          if (i < 4) color = "#3a2a4a";                                 // borrador
          if (i > largo - 8 && Math.abs(w) > (largo - i) / 3) continue;
          px(x + w, y, color);
        }
      }
    };
    const libros = (bx) => {
      const base = Math.round(ALTO - altura(bx));
      const tonos = ["#2a3570", "#3a2a4a", "#24305f"];
      for (let i = 0; i < 3; i++) {
        const w = 18 - i * 3, h = 4;
        c.fillStyle = tonos[i]; c.fillRect(bx - w / 2 + i, base - (i + 1) * h, w, h);
        c.fillStyle = "#3e4f92"; c.fillRect(bx - w / 2 + i, base - (i + 1) * h, w, 1);
      }
    };

    for (let x = 0; x < PERIODO; x++) {
      const top = Math.round(ALTO - altura(x));
      for (let y = top; y < ALTO; y++) px(x, y, y - top < 2 ? "#28326b" : "#141a3d");
      px(x, top, "#36438a");
    }
    lapiz(90, 0.35, 40);
    lapiz(300, -0.3, 32);
    lapiz(430, 0.2, 24);
    libros(200);
    libros(470);
    return capa;
  }

  function construirFondo() {
    const capas = {
      cielo: cielo(),
      luna: luna(),
      montanas: montanas(),
      islas: islas(),
      colinas: colinas()
    };

    const estrellas = [];
    for (let i = 0; i < 90; i++) {
      estrellas.push({
        x: ruido(i, 1, 7) * 400,
        y: ruido(i, 2, 7) * 110,
        fase: ruido(i, 3, 7) * Math.PI * 2,
        tipo: ruido(i, 4, 7) < 0.1 ? 2 : ruido(i, 5, 7) < 0.3 ? 1 : 0
      });
    }

    const luciernagas = [];
    for (let i = 0; i < 14; i++) {
      luciernagas.push({ x: ruido(i, 9, 3) * 420, y: 60 + ruido(i, 8, 3) * 110, fase: ruido(i, 7, 3) * 6.28 });
    }

    let fugaz = null;

    function capaRepetida(ctx, lienzo, desplazamiento, y) {
      let x = -(((desplazamiento % PERIODO) + PERIODO) % PERIODO);
      for (; x < ANCHO; x += PERIODO) ctx.drawImage(lienzo, Math.round(x), y || 0);
    }

    function dibujar(ctx, camX, t, extra) {
      ctx.drawImage(capas.cielo, 0, 0);

      estrellas.forEach((e) => {
        let x = (e.x - camX * 0.03) % 400;
        if (x < 0) x += 400;
        if (x > ANCHO) return;
        const brillo = Math.sin(t * 1.7 + e.fase);
        const xi = Math.round(x), yi = Math.round(e.y);
        if (e.tipo === 2) {
          ctx.fillStyle = "#fff1d0";
          ctx.fillRect(xi, yi, 1, 1);
          if (brillo > -0.2) { ctx.fillRect(xi - 1, yi, 3, 1); ctx.fillRect(xi, yi - 1, 1, 3); }
          if (brillo > 0.6) { ctx.fillStyle = "rgba(255,241,208,0.5)"; ctx.fillRect(xi - 2, yi, 5, 1); ctx.fillRect(xi, yi - 2, 1, 5); }
        } else if (brillo > (e.tipo === 1 ? -0.6 : 0)) {
          ctx.fillStyle = e.tipo === 1 ? "#fff1d0" : "#9aa6dc";
          ctx.fillRect(xi, yi, 1, 1);
        }
      });

      // Estrella fugaz ocasional
      if (!fugaz && Math.random() < 0.0025) fugaz = { x: 60 + Math.random() * 220, y: 8 + Math.random() * 40, vida: 0 };
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

      ctx.drawImage(capas.luna, Math.round(246 - camX * 0.02), 10);
      capaRepetida(ctx, capas.montanas, camX * 0.1, 0);
      capaRepetida(ctx, capas.islas, camX * 0.2 + t * 2, Math.round(Math.sin(t * 0.6) * 1.5));
      capaRepetida(ctx, capas.colinas, camX * 0.4, (extra && extra.colinasY) || 0);
    }

    function dibujarFrente(ctx, camX, t) {
      luciernagas.forEach((l, i) => {
        let x = (l.x - camX * 0.9 + Math.sin(t * 0.5 + l.fase) * 14) % 420;
        if (x < 0) x += 420;
        if (x > ANCHO) return;
        const y = l.y + Math.sin(t * 0.9 + l.fase * 2) * 6;
        const encendida = Math.sin(t * 2 + l.fase) > -0.2;
        if (!encendida) return;
        const xi = Math.round(x), yi = Math.round(y);
        ctx.fillStyle = "rgba(255, 214, 120, 0.25)";
        ctx.fillRect(xi - 1, yi, 3, 1);
        ctx.fillRect(xi, yi - 1, 1, 3);
        ctx.fillStyle = i % 3 ? "#ffd678" : "#fff1b0";
        ctx.fillRect(xi, yi, 1, 1);
      });
    }

    return { dibujar: dibujar, dibujarFrente: dibujarFrente };
  }

  /* =======================================================
     ALMOHADA VOLADORA (plataforma móvil) — 2 cuadros de alas
     ======================================================= */
  function almohada(cuadro) {
    const W = 56, H = 16;
    const capa = crearCanvas(W, H);
    const c = capa.getContext("2d");
    const px = (x, y, color) => { c.fillStyle = color; c.fillRect(x, y, 1, 1); };
    const ox = 4, oy = 4, w = 48, h = 10;
    const dentro = (x, y) => {
      if (x < 0 || x >= w || y < 0 || y >= h) return false;
      const curva = Math.sin((x / (w - 1)) * Math.PI) * 1.5;
      if (y < 1.5 - curva || y > h - 1.5 + curva) return false;
      if ((x < 2 || x > w - 3) && (y < 2 || y > h - 3)) return true; // esquinas en punta
      return x >= 1 && x <= w - 2;
    };
    // Alas
    const ala = cuadro === 0
      ? ["..kk..", ".k66k.", "k6666k", ".kkkk."]
      : ["......", "kkkkk.", "k6666k", ".kk66k"];
    const colores = { k: TINTA, "6": "#ffffff" };
    [[0, 3], [W - 6, 3]].forEach(([ax, ay], lado) => {
      ala.forEach((fila, y) => {
        for (let x = 0; x < 6; x++) {
          const chr = lado ? fila[5 - x] : fila[x];
          if (colores[chr]) px(ax + x, ay + y + (cuadro === 0 ? -2 : 0), colores[chr]);
        }
      });
    });
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!dentro(x, y)) continue;
        const borde = !dentro(x - 1, y) || !dentro(x + 1, y) || !dentro(x, y - 1) || !dentro(x, y + 1);
        let color = "#fff4de";
        if (borde) color = TINTA;
        else if (!dentro(x, y - 2)) color = "#ffffff";
        else if (y >= h - 3) color = "#d9c7a6";
        if (!borde && (y === 5 || y === 6) && x > 2 && x < w - 3) color = y === 5 ? "#4f8bab" : "#2f5f7e";
        if (!borde && (x === 16 || x === 32) && y > 1 && y < h - 2) color = "#e8dcc4";
        px(ox + x, oy + y, color);
      }
    }
    return capa;
  }

  return {
    construirCapaNivel: construirCapaNivel,
    construirFondo: construirFondo,
    almohada: [almohada(0), almohada(1)]
  };
})();
