/* =========================================================
   MONKY DREAMS — MOTOR DEL JUEGO
   Canvas 2D a 320x180 píxeles, escalado con píxeles nítidos.
   Física con paso fijo de 1/60 s para que el movimiento sea
   igual en cualquier pantalla.
   ========================================================= */

(function () {
  "use strict";

  /* -------------------------------------------------------
     CONFIGURACIÓN
     ------------------------------------------------------- */
  const ANCHO = 320;
  const ALTO = 180;
  const T = 16;
  const PASO = 1 / 60;

  const FIS = {
    acel: 950,
    acelAire: 700,
    friccion: 1200,
    friccionAire: 380,
    vmax: 108,
    grav: 1250,
    gravCaida: 1550,
    salto: -372,
    corte: -150,
    caidaMax: 420,
    coyote: 0.09,
    buffer: 0.13,
    invul: 1.5,
    rebote: -240,
    reboteAlto: -340
  };

  const VIDAS = 3;

  const lienzo = document.getElementById("juego");
  const ctx = lienzo.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const S = window.MonkySprites.construir();
  const Snd = window.MonkySonido;

  /* -------------------------------------------------------
     UTILIDADES
     ------------------------------------------------------- */
  function crearCanvas(ancho, alto) {
    const c = document.createElement("canvas");
    c.width = ancho;
    c.height = alto;
    return c;
  }

  function ruido(x, y, semilla) {
    let h = (x * 374761393 + y * 668265263 + (semilla || 0) * 1442695041) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  function limitar(valor, min, max) {
    return Math.max(min, Math.min(max, valor));
  }

  function solapan(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  /* -------------------------------------------------------
     NIVEL
     ------------------------------------------------------- */
  const MAPA = window.MonkyNivel.mapa;
  const FILAS = MAPA.length;
  const COLS = MAPA.reduce((max, fila) => Math.max(max, fila.length), 0);
  const ANCHO_NIVEL = COLS * T;
  const ALTO_NIVEL = FILAS * T;

  const TIPOS_OBJETO = { P: "lapiz", C: "camara", K: "cubo" };

  function casilla(cx, cy) {
    if (cx < 0 || cx >= COLS) {
      return "#"; // paredes invisibles a los lados
    }
    if (cy < 0 || cy >= FILAS) {
      return ".";
    }
    const ch = MAPA[cy][cx] || ".";
    return "#B-^".indexOf(ch) >= 0 ? ch : ".";
  }

  function esSolida(ch) {
    return ch === "#" || ch === "B";
  }

  /* -------------------------------------------------------
     CAPA DE CASILLAS (se dibuja una sola vez)
     ------------------------------------------------------- */
  const capaNivel = crearCanvas(ANCHO_NIVEL, ALTO_NIVEL);

  function pixel(c, x, y, color) {
    c.fillStyle = color;
    c.fillRect(x, y, 1, 1);
  }

  function dibujarSuelo(c, cx, cy) {
    const x = cx * T;
    const y = cy * T;
    const superficie = !esSolida(casilla(cx, cy - 1)) && casilla(cx, cy - 1) !== "#";

    c.fillStyle = "#6b3f2a";
    c.fillRect(x, y, T, T);

    for (let i = 0; i < 7; i++) {
      const px = Math.floor(ruido(cx, cy, i) * T);
      const py = Math.floor(ruido(cy, cx, i + 9) * T);
      pixel(c, x + px, y + py, i % 2 ? "#57321f" : "#85543a");
    }

    if (superficie) {
      c.fillStyle = "#e8792e";
      c.fillRect(x, y, T, 4);
      c.fillStyle = "#f6a25e";
      c.fillRect(x, y, T, 1);

      for (let px = 0; px < T; px++) {
        const caida = ruido(cx * T + px, cy, 3) < 0.45 ? 1 : 0;
        const larga = ruido(cx * T + px, cy, 5) < 0.18 ? 1 : 0;
        c.fillStyle = "#cc6121";
        c.fillRect(x + px, y + 4, 1, caida + larga);
        if (ruido(cx * T + px, cy, 8) < 0.12) {
          pixel(c, x + px, y + 1, "#fff1d6");
        }
      }
    }

    if (casilla(cx - 1, cy) !== "#") {
      c.fillStyle = "#1b1a2a";
      c.fillRect(x, y, 1, T);
    }
    if (casilla(cx + 1, cy) !== "#") {
      c.fillStyle = "#1b1a2a";
      c.fillRect(x + T - 1, y, 1, T);
    }
    if (superficie) {
      c.fillStyle = "#1b1a2a";
      c.fillRect(x, y - 1, T, 1);
    }
  }

  function dibujarBloque(c, cx, cy) {
    const x = cx * T;
    const y = cy * T;
    c.fillStyle = "#1b1a2a";
    c.fillRect(x, y, T, T);
    c.fillStyle = "#f6efe5";
    c.fillRect(x + 1, y + 1, T - 2, T - 2);
    c.fillStyle = "#fffaf3";
    c.fillRect(x + 1, y + 1, T - 2, 2);
    c.fillStyle = "#d4bc96";
    c.fillRect(x + 1, y + T - 3, T - 2, 2);
    c.fillRect(x + T - 3, y + 3, 2, T - 6);
    c.fillStyle = "#e8792e";
    c.fillRect(x + 5, y + 5, 6, 6);
    c.fillStyle = "#cc6121";
    c.fillRect(x + 5, y + 10, 6, 1);
    pixel(c, x + 5, y + 5, "#f6a25e");
  }

  function dibujarNube(c, cx, cy) {
    const x = cx * T;
    const y = cy * T;
    const izq = casilla(cx - 1, cy) === "-";
    const der = casilla(cx + 1, cy) === "-";

    for (let px = 0; px < T; px++) {
      let arriba = 1 + (Math.sin((cx * T + px) * 0.7) > 0.3 ? 0 : 1);
      let abajo = 7;
      if (!izq && px < 3) {
        arriba += 3 - px;
        abajo -= 3 - px;
      }
      if (!der && px > T - 4) {
        arriba += px - (T - 4);
        abajo -= px - (T - 4);
      }
      c.fillStyle = "#1b1a2a";
      c.fillRect(x + px, y + arriba - 1, 1, abajo - arriba + 2);
      c.fillStyle = "#fff7e8";
      c.fillRect(x + px, y + arriba, 1, abajo - arriba);
      c.fillStyle = "#cfc6e6";
      c.fillRect(x + px, y + abajo - 2, 1, 2);
    }
  }

  function dibujarPuas(c, cx, cy) {
    const x = cx * T;
    const y = cy * T + 8;
    for (let i = 0; i < 4; i++) {
      for (let r = 0; r < 8; r++) {
        const ancho = Math.min(4, 1 + (r >> 1));
        const inicio = i * 4 + Math.floor((4 - ancho) / 2);
        c.fillStyle = "#b9a7e0";
        c.fillRect(x + inicio, y + r, ancho, 1);
        pixel(c, x + inicio, y + r, "#ece4ff");
        if (ancho > 2) {
          pixel(c, x + inicio + ancho - 1, y + r, "#7c68b0");
        }
      }
    }
    c.fillStyle = "#1b1a2a";
    c.fillRect(x, y + 7, T, 1);
  }

  function construirCapaNivel() {
    const c = capaNivel.getContext("2d");
    for (let cy = 0; cy < FILAS; cy++) {
      for (let cx = 0; cx < COLS; cx++) {
        const ch = MAPA[cy][cx];
        if (ch === "#") dibujarSuelo(c, cx, cy);
        else if (ch === "B") dibujarBloque(c, cx, cy);
        else if (ch === "-") dibujarNube(c, cx, cy);
        else if (ch === "^") dibujarPuas(c, cx, cy);
      }
    }
  }

  /* -------------------------------------------------------
     FONDO SOÑADOR (cielo, luna, estrellas, colinas)
     ------------------------------------------------------- */
  const CIELO = [
    "#141831", "#1a2040", "#212a51", "#293562",
    "#324373", "#3d5282", "#53618f", "#7a6f96",
    "#a7798b", "#d48f74"
  ];

  const capaCielo = crearCanvas(ANCHO, ALTO);
  (function () {
    const c = capaCielo.getContext("2d");
    const banda = Math.ceil(ALTO / CIELO.length);
    CIELO.forEach((color, i) => {
      c.fillStyle = color;
      c.fillRect(0, i * banda, ANCHO, banda);
      // Tramado de transición entre bandas
      if (i > 0) {
        for (let x = 0; x < ANCHO; x += 2) {
          c.fillRect(x + ((i % 2)), i * banda - 1, 1, 1);
          c.fillRect(x + 1 - (i % 2), i * banda - 3, 1, 1);
        }
        c.fillStyle = CIELO[i - 1];
        for (let x = 0; x < ANCHO; x += 2) {
          c.fillRect(x + 1 - (i % 2), i * banda, 1, 1);
        }
      }
    });
  })();

  const capaLuna = crearCanvas(28, 28);
  (function () {
    const c = capaLuna.getContext("2d");
    for (let y = 0; y < 28; y++) {
      for (let x = 0; x < 28; x++) {
        const d1 = Math.hypot(x - 13.5, y - 13.5);
        const d2 = Math.hypot(x - 19, y - 9);
        if (d1 < 12 && d2 > 10) {
          c.fillStyle = d1 > 10.5 ? "#f2c98f" : "#fff1d0";
          c.fillRect(x, y, 1, 1);
        }
      }
    }
  })();

  function crearColinas(factor, colorBase, colorBorde, altura, amplitud, semilla) {
    const ancho = Math.ceil(ANCHO + (ANCHO_NIVEL - ANCHO) * factor) + 2;
    const capa = crearCanvas(ancho, ALTO);
    const c = capa.getContext("2d");
    for (let x = 0; x < ancho; x++) {
      const h =
        altura +
        Math.sin(x * 0.021 + semilla) * amplitud +
        Math.sin(x * 0.057 + semilla * 2) * amplitud * 0.45 +
        Math.sin(x * 0.13 + semilla * 3) * 2;
      const top = Math.round(ALTO - h);
      c.fillStyle = colorBase;
      c.fillRect(x, top, 1, ALTO - top);
      c.fillStyle = colorBorde;
      c.fillRect(x, top, 1, 1);
    }
    return { capa: capa, factor: factor };
  }

  const colinasLejanas = crearColinas(0.15, "#2a3561", "#3b4a7c", 62, 14, 1.3);
  const colinasCercanas = crearColinas(0.35, "#202a4f", "#34437a", 40, 12, 4.1);

  const estrellas = [];
  for (let i = 0; i < 70; i++) {
    estrellas.push({
      x: ruido(i, 1, 7) * (ANCHO + 200),
      y: ruido(i, 2, 7) * 100,
      fase: ruido(i, 3, 7) * Math.PI * 2,
      grande: ruido(i, 4, 7) < 0.12
    });
  }

  const nubesFondo = [];
  for (let i = 0; i < 6; i++) {
    nubesFondo.push({
      x: i * 120 + ruido(i, 5, 2) * 60,
      y: 30 + ruido(i, 6, 2) * 50,
      ancho: 30 + Math.floor(ruido(i, 7, 2) * 30)
    });
  }

  function dibujarNubeFondo(x, y, ancho) {
    ctx.fillStyle = "rgba(255, 241, 214, 0.10)";
    ctx.fillRect(Math.round(x), Math.round(y), ancho, 5);
    ctx.fillRect(Math.round(x + 6), Math.round(y - 4), ancho - 14, 4);
    ctx.fillRect(Math.round(x + 12), Math.round(y - 7), Math.max(6, ancho - 28), 3);
  }

  function dibujarFondo(camX) {
    ctx.drawImage(capaCielo, 0, 0);

    estrellas.forEach((e) => {
      const brillo = 0.45 + Math.sin(tiempoGlobal * 2 + e.fase) * 0.35;
      let x = (e.x - camX * 0.04) % (ANCHO + 200);
      if (x < 0) x += ANCHO + 200;
      ctx.globalAlpha = limitar(brillo, 0.1, 1);
      ctx.fillStyle = "#fff1d0";
      ctx.fillRect(Math.round(x), Math.round(e.y), 1, 1);
      if (e.grande) {
        ctx.fillRect(Math.round(x) - 1, Math.round(e.y), 3, 1);
        ctx.fillRect(Math.round(x), Math.round(e.y) - 1, 1, 3);
      }
    });
    ctx.globalAlpha = 1;

    ctx.drawImage(capaLuna, Math.round(250 - camX * 0.03), 16);

    nubesFondo.forEach((n) => {
      const vuelta = ANCHO + 160;
      let x = (n.x - camX * 0.25 + tiempoGlobal * 3) % vuelta;
      if (x < 0) x += vuelta;
      dibujarNubeFondo(x - 80, n.y, n.ancho);
    });

    [colinasLejanas, colinasCercanas].forEach((capa) => {
      ctx.drawImage(capa.capa, Math.round(camX * capa.factor), 0, ANCHO, ALTO, 0, 0, ANCHO, ALTO);
    });
  }

  /* -------------------------------------------------------
     FUENTE PIXEL 3x5 PARA EL HUD
     ------------------------------------------------------- */
  const FUENTE = {
    "0": "111101101101111", "1": "010110010010111", "2": "111001111100111",
    "3": "111001111001111", "4": "101101111001001", "5": "111100111001111",
    "6": "111100111101111", "7": "111001010010010", "8": "111101111101111",
    "9": "111101111001111", "/": "001001010100100", ":": "000010000010000",
    "x": "000101010101000", "z": "111001010100111"
  };

  function texto(cadena, x, y, color, sombra) {
    let cursor = Math.round(x);
    for (const ch of String(cadena)) {
      const glifo = FUENTE[ch];
      if (glifo) {
        for (let i = 0; i < 15; i++) {
          if (glifo[i] === "1") {
            const px = cursor + (i % 3);
            const py = Math.round(y) + Math.floor(i / 3);
            if (sombra) {
              ctx.fillStyle = sombra;
              ctx.fillRect(px + 1, py + 1, 1, 1);
            }
            ctx.fillStyle = color;
            ctx.fillRect(px, py, 1, 1);
          }
        }
      }
      cursor += 4;
    }
  }

  function anchoTexto(cadena) {
    return String(cadena).length * 4 - 1;
  }

  /* -------------------------------------------------------
     ESTADO DEL JUEGO
     ------------------------------------------------------- */
  let estado = "titulo";
  let tiempoGlobal = 0;
  let tiempoPartida = 0;
  let temporizador = 0;
  let temblor = 0;

  let items = [];
  let enemigos = [];
  let plataformas = [];
  let lamparas = [];
  let meta = null;
  let inicio = { x: 40, y: 140 };
  let reaparicion = { x: 40, y: 140 };
  let particulas = [];

  const totales = { lapiz: 0, camara: 0, cubo: 0 };
  const recogidos = { lapiz: 0, camara: 0, cubo: 0 };

  const camara = { x: 0, y: ALTO_NIVEL - ALTO };

  const jugador = {
    x: 0, y: 0, w: 10, h: 14,
    vx: 0, vy: 0, dir: 1,
    enSuelo: false, sobre: null,
    coyote: 0, buffer: 0,
    invul: 0, dolor: 0,
    anim: 0, aplastar: 0,
    vidas: VIDAS
  };

  function crearEntidades() {
    items = [];
    enemigos = [];
    plataformas = [];
    lamparas = [];
    meta = null;
    totales.lapiz = totales.camara = totales.cubo = 0;

    for (let cy = 0; cy < FILAS; cy++) {
      for (let cx = 0; cx < COLS; cx++) {
        const ch = MAPA[cy][cx];
        const x = cx * T;
        const y = cy * T;

        if (TIPOS_OBJETO[ch]) {
          const tipo = TIPOS_OBJETO[ch];
          totales[tipo]++;
          items.push({ tipo: tipo, x: x + 2, y: y + 2, w: 12, h: 12, fase: cx * 0.6, tomado: false });
        } else if (ch === "E") {
          enemigos.push({ tipo: "bicho", x: x + 1, y: y + T - 10, w: 14, h: 10, vx: -26, anim: cx, aplastado: 0, vivo: true });
        } else if (ch === "N") {
          enemigos.push({ tipo: "pesadilla", x0: x + 2, y0: y + 2, x: x + 2, y: y + 2, w: 12, h: 12, t: 0, anim: 0, vivo: true });
        } else if (ch === "~") {
          plataformas.push({ x: x - T, y: y, w: 48, h: 8, x0: x - T, x1: x + 7 * T, vel: 34, dx: 0 });
        } else if (ch === "L") {
          lamparas.push({ x: x, y: y, w: T, h: T, activa: false });
        } else if (ch === "Z") {
          meta = { x: x, y: y, w: T, h: T };
        } else if (ch === "M") {
          inicio = { x: x + 3, y: y + 2 };
        }
      }
    }
  }

  function reiniciarNivel() {
    crearEntidades();
    recogidos.lapiz = recogidos.camara = recogidos.cubo = 0;
    particulas = [];
    reaparicion = { x: inicio.x, y: inicio.y };
    tiempoPartida = 0;
    temblor = 0;
    jugador.vidas = VIDAS;
    colocarJugador(inicio);
    jugador.invul = 0;
    actualizarCamara(0, true);
  }

  function colocarJugador(punto) {
    jugador.x = punto.x;
    jugador.y = punto.y;
    jugador.vx = 0;
    jugador.vy = 0;
    jugador.dir = 1;
    jugador.enSuelo = false;
    jugador.sobre = null;
    jugador.coyote = 0;
    jugador.buffer = 0;
    jugador.dolor = 0;
  }

  /* -------------------------------------------------------
     ENTRADA: TECLADO Y TÁCTIL
     ------------------------------------------------------- */
  const teclas = { izq: false, der: false, saltar: false };
  const tactil = { izq: false, der: false, saltar: false };

  const entrada = {
    get izq() { return teclas.izq || tactil.izq; },
    get der() { return teclas.der || tactil.der; },
    get saltar() { return teclas.saltar || tactil.saltar; }
  };

  function pedirSalto() {
    jugador.buffer = FIS.buffer;
  }

  const MAPA_TECLAS = {
    ArrowLeft: "izq", KeyA: "izq",
    ArrowRight: "der", KeyD: "der",
    ArrowUp: "saltar", KeyW: "saltar", Space: "saltar", KeyZ: "saltar", KeyK: "saltar"
  };

  window.addEventListener("keydown", (evento) => {
    const accion = MAPA_TECLAS[evento.code];
    const enBoton = document.activeElement && document.activeElement.tagName === "BUTTON";

    if (accion) {
      if (estado === "jugando" || !enBoton) {
        evento.preventDefault();
      }
      if (accion === "saltar" && !teclas.saltar && estado === "jugando") {
        pedirSalto();
      }
      teclas[accion] = true;
      return;
    }

    if (evento.code === "KeyP" || evento.code === "Escape") {
      evento.preventDefault();
      alternarPausa();
    } else if (evento.code === "KeyM") {
      alternarSonido();
    } else if (evento.code === "Enter" && !enBoton) {
      if (estado === "titulo" || estado === "gameover" || estado === "victoria") {
        iniciarPartida();
      } else if (estado === "pausa") {
        alternarPausa();
      }
    }
  });

  window.addEventListener("keyup", (evento) => {
    const accion = MAPA_TECLAS[evento.code];
    if (accion) {
      teclas[accion] = false;
    }
  });

  function soltarTodo() {
    teclas.izq = teclas.der = teclas.saltar = false;
    tactil.izq = tactil.der = tactil.saltar = false;
    punterosCruceta.clear();
    actualizarBotonesTactiles();
  }

  window.addEventListener("blur", () => {
    soltarTodo();
    if (estado === "jugando") alternarPausa();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      soltarTodo();
      if (estado === "jugando") alternarPausa();
    }
  });

  /* Controles táctiles: la cruceta permite deslizar el dedo
     de izquierda a derecha sin levantarlo. */
  const cruceta = document.getElementById("cruceta");
  const btnIzq = document.getElementById("btn-izq");
  const btnDer = document.getElementById("btn-der");
  const btnSaltar = document.getElementById("btn-saltar");
  const punterosCruceta = new Map();

  function ladoCruceta(evento) {
    const r = cruceta.getBoundingClientRect();
    return evento.clientX < r.left + r.width / 2 ? "izq" : "der";
  }

  function actualizarCruceta() {
    const lados = Array.from(punterosCruceta.values());
    tactil.izq = lados.indexOf("izq") >= 0;
    tactil.der = lados.indexOf("der") >= 0;
    actualizarBotonesTactiles();
  }

  function actualizarBotonesTactiles() {
    btnIzq.classList.toggle("activo", tactil.izq);
    btnDer.classList.toggle("activo", tactil.der);
    btnSaltar.classList.toggle("activo", tactil.saltar);
  }

  cruceta.addEventListener("pointerdown", (evento) => {
    evento.preventDefault();
    activarModoTactil();
    cruceta.setPointerCapture(evento.pointerId);
    punterosCruceta.set(evento.pointerId, ladoCruceta(evento));
    actualizarCruceta();
  });

  cruceta.addEventListener("pointermove", (evento) => {
    if (punterosCruceta.has(evento.pointerId)) {
      punterosCruceta.set(evento.pointerId, ladoCruceta(evento));
      actualizarCruceta();
    }
  });

  ["pointerup", "pointercancel", "lostpointercapture"].forEach((tipo) => {
    cruceta.addEventListener(tipo, (evento) => {
      punterosCruceta.delete(evento.pointerId);
      actualizarCruceta();
    });
  });

  btnSaltar.addEventListener("pointerdown", (evento) => {
    evento.preventDefault();
    activarModoTactil();
    btnSaltar.setPointerCapture(evento.pointerId);
    if (!tactil.saltar && estado === "jugando") {
      pedirSalto();
    }
    tactil.saltar = true;
    actualizarBotonesTactiles();
  });

  ["pointerup", "pointercancel", "lostpointercapture"].forEach((tipo) => {
    btnSaltar.addEventListener(tipo, () => {
      tactil.saltar = false;
      actualizarBotonesTactiles();
    });
  });

  [cruceta, btnSaltar].forEach((el) => {
    el.addEventListener("contextmenu", (evento) => evento.preventDefault());
  });

  function activarModoTactil() {
    document.body.classList.add("tactil");
  }

  if (
    (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) ||
    new URLSearchParams(window.location.search).has("tactil")
  ) {
    activarModoTactil();
  }

  window.addEventListener("touchstart", activarModoTactil, { passive: true, once: true });

  /* -------------------------------------------------------
     FÍSICA Y COLISIONES
     ------------------------------------------------------- */
  function resolverX(e, dx) {
    const y0 = Math.floor(e.y / T);
    const y1 = Math.floor((e.y + e.h - 0.001) / T);
    const x0 = Math.floor(e.x / T);
    const x1 = Math.floor((e.x + e.w - 0.001) / T);

    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        if (!esSolida(casilla(cx, cy))) continue;

        if (dx > 0) {
          e.x = cx * T - e.w;
        } else if (dx < 0) {
          e.x = (cx + 1) * T;
        } else if (e.x + e.w / 2 < cx * T + T / 2) {
          e.x = cx * T - e.w;
        } else {
          e.x = (cx + 1) * T;
        }
        e.vx = 0;
        return;
      }
    }
  }

  function resolverY(e, pieAntes) {
    const x0 = Math.floor(e.x / T);
    const x1 = Math.floor((e.x + e.w - 0.001) / T);
    const y0 = Math.floor(e.y / T);
    const y1 = Math.floor((e.y + e.h - 0.001) / T);

    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        const ch = casilla(cx, cy);

        if (esSolida(ch)) {
          if (e.vy > 0) {
            e.y = cy * T - e.h;
            e.enSuelo = true;
          } else if (e.vy < 0) {
            e.y = (cy + 1) * T;
          }
          e.vy = 0;
          return;
        }

        if (ch === "-" && e.vy >= 0 && pieAntes <= cy * T + 0.5 && e.y + e.h >= cy * T) {
          e.y = cy * T - e.h;
          e.vy = 0;
          e.enSuelo = true;
          return;
        }
      }
    }

    if (e.vy >= 0) {
      for (const p of plataformas) {
        const encima = e.x < p.x + p.w && e.x + e.w > p.x;
        if (encima && pieAntes <= p.y + 0.5 && e.y + e.h >= p.y) {
          e.y = p.y - e.h;
          e.vy = 0;
          e.enSuelo = true;
          e.sobre = p;
          return;
        }
      }
    }
  }

  function actualizarJugador(dt) {
    const j = jugador;
    const direccion = j.dolor > 0 ? 0 : (entrada.der ? 1 : 0) - (entrada.izq ? 1 : 0);

    if (direccion !== 0) {
      const acel = j.enSuelo ? FIS.acel : FIS.acelAire;
      j.vx += direccion * acel * dt;
      if (Math.sign(j.vx) !== direccion && j.enSuelo) {
        j.vx += direccion * FIS.friccion * dt;
      }
      j.dir = direccion;
    } else {
      const friccion = (j.enSuelo ? FIS.friccion : FIS.friccionAire) * dt;
      j.vx = Math.abs(j.vx) <= friccion ? 0 : j.vx - Math.sign(j.vx) * friccion;
    }
    j.vx = limitar(j.vx, -FIS.vmax, FIS.vmax);

    j.coyote = j.enSuelo ? FIS.coyote : j.coyote - dt;
    j.buffer -= dt;

    if (j.buffer > 0 && j.coyote > 0) {
      j.vy = FIS.salto;
      j.enSuelo = false;
      j.sobre = null;
      j.coyote = 0;
      j.buffer = 0;
      Snd.reproducir("saltar");
      polvo(j.x + j.w / 2, j.y + j.h, 4);
    }

    if (!entrada.saltar && j.vy < FIS.corte) {
      j.vy = FIS.corte;
    }

    j.vy = Math.min(FIS.caidaMax, j.vy + (j.vy > 0 ? FIS.gravCaida : FIS.grav) * dt);

    const arrastre = j.sobre ? j.sobre.dx : 0;
    const dx = j.vx * dt + arrastre;
    j.x += dx;
    resolverX(j, dx);

    const pieAntes = j.y + j.h;
    const vyAntes = j.vy;
    const estabaEnSuelo = j.enSuelo;
    j.y += j.vy * dt;
    j.enSuelo = false;
    j.sobre = null;
    resolverY(j, pieAntes);

    if (j.enSuelo && !estabaEnSuelo && vyAntes > 160) {
      j.aplastar = 0.12;
      polvo(j.x + j.w / 2, j.y + j.h, 5);
    }

    j.anim += dt * (j.enSuelo ? Math.abs(j.vx) / 55 : 1);
    j.invul = Math.max(0, j.invul - dt);
    j.dolor = Math.max(0, j.dolor - dt);
    j.aplastar = Math.max(0, j.aplastar - dt);
  }

  function herir(origenX) {
    const j = jugador;
    if (j.invul > 0 || estado !== "jugando") return;

    j.vidas--;
    temblor = 0.3;
    Snd.reproducir("dolor");
    chispas(j.x + j.w / 2, j.y + j.h / 2, ["#e8473c", "#ff9b8a", "#fff7e8"], 10);

    if (j.vidas <= 0) {
      perderPartida();
      return;
    }

    j.invul = FIS.invul;
    j.dolor = 0.35;
    j.vy = -230;
    j.vx = (j.x + j.w / 2 < origenX ? -1 : 1) * 120;
    j.enSuelo = false;
    j.sobre = null;
  }

  function caerAlVacio() {
    const j = jugador;
    j.vidas--;
    temblor = 0.25;
    Snd.reproducir("caer");

    if (j.vidas <= 0) {
      estado = "muerte";
      temporizador = 0.9;
      Snd.reproducir("perder");
      return;
    }

    colocarJugador(reaparicion);
    j.invul = 1.2;
    actualizarCamara(0, true);
    mostrarAviso("¡Uy! Vuelves a la última lámpara");
  }

  function perderPartida() {
    estado = "muerte";
    temporizador = 1.6;
    jugador.vy = -300;
    jugador.vx = 0;
    Snd.reproducir("perder");
  }

  function ganarPartida() {
    estado = "ganando";
    temporizador = 1.8;
    jugador.vx = 0;
    jugador.vy = -260;
    Snd.reproducir("victoria");
    chispas(meta.x + 8, meta.y + 8, ["#f2c14e", "#e8792e", "#fff7e8", "#a9d8ec"], 30);
  }

  /* -------------------------------------------------------
     ENEMIGOS, OBJETOS Y PLATAFORMAS
     ------------------------------------------------------- */
  function actualizarPlataformas(dt) {
    plataformas.forEach((p) => {
      const antes = p.x;
      p.x += p.vel * dt;
      if (p.x > p.x1) {
        p.x = p.x1;
        p.vel = -Math.abs(p.vel);
      } else if (p.x < p.x0) {
        p.x = p.x0;
        p.vel = Math.abs(p.vel);
      }
      p.dx = p.x - antes;
    });
  }

  function actualizarEnemigos(dt) {
    enemigos.forEach((e) => {
      if (!e.vivo) return;

      if (e.tipo === "bicho") {
        if (e.aplastado > 0) {
          e.aplastado -= dt;
          if (e.aplastado <= 0) e.vivo = false;
          return;
        }

        e.anim += dt;
        e.x += e.vx * dt;

        const frente = e.vx > 0 ? e.x + e.w + 1 : e.x - 1;
        const cx = Math.floor(frente / T);
        const filaCuerpo = Math.floor((e.y + e.h / 2) / T);
        const filaPiso = Math.floor((e.y + e.h + 2) / T);
        const choca = esSolida(casilla(cx, filaCuerpo)) || casilla(cx, filaCuerpo) === "^";
        const borde = !esSolida(casilla(cx, filaPiso));

        if (choca || borde) {
          e.vx = -e.vx;
          e.x += e.vx * dt * 2;
        }
      } else if (e.tipo === "pesadilla") {
        e.t += dt;
        e.anim += dt;
        e.x = e.x0 + Math.sin(e.t * 0.9) * 28;
        e.y = e.y0 + Math.sin(e.t * 2.1) * 10;
      }
    });
  }

  function revisarColisiones() {
    const j = jugador;

    // Enemigos
    for (const e of enemigos) {
      if (!e.vivo || e.aplastado > 0 || !solapan(j, e)) continue;

      const pisotea = e.tipo === "bicho" && j.vy > 0 && j.y + j.h - e.y < 9;
      if (pisotea) {
        e.aplastado = 0.5;
        j.vy = entrada.saltar ? FIS.reboteAlto : FIS.rebote;
        j.enSuelo = false;
        Snd.reproducir("aplastar");
        chispas(e.x + e.w / 2, e.y + 4, ["#8a6bc4", "#fff7e8"], 8);
      } else {
        herir(e.x + e.w / 2);
      }
    }

    // Púas
    const x0 = Math.floor(j.x / T);
    const x1 = Math.floor((j.x + j.w - 0.001) / T);
    const y0 = Math.floor(j.y / T);
    const y1 = Math.floor((j.y + j.h - 0.001) / T);
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        if (casilla(cx, cy) !== "^") continue;
        const zona = { x: cx * T + 2, y: cy * T + 9, w: 12, h: 7 };
        if (solapan(j, zona)) {
          herir(cx * T + T / 2);
          if (estado === "jugando") j.vy = -300;
        }
      }
    }

    // Objetos
    items.forEach((it) => {
      if (it.tomado || !solapan(j, it)) return;
      it.tomado = true;
      recogidos[it.tipo]++;
      Snd.reproducir("recoger");
      const colores = {
        lapiz: ["#f2c14e", "#e8792e", "#fff7e8"],
        camara: ["#bfe6f5", "#4f8bab", "#fff7e8"],
        cubo: ["#a9d8ec", "#5f9fc0", "#fff7e8"]
      };
      chispas(it.x + 6, it.y + 6, colores[it.tipo], 10);
    });

    // Lámparas (puntos de control)
    lamparas.forEach((l) => {
      if (l.activa) return;
      const centro = j.x + j.w / 2;
      if (centro > l.x && centro < l.x + l.w && Math.abs(j.y - l.y) < 40) {
        l.activa = true;
        reaparicion = { x: l.x + 3, y: l.y + 2 };
        Snd.reproducir("control");
        chispas(l.x + 8, l.y + 4, ["#f2c14e", "#fff1d0"], 12);
        mostrarAviso("Lámpara encendida: punto de control");
      }
    });

    // Meta
    if (meta && solapan(j, meta)) {
      ganarPartida();
    }

    // Vacío
    if (j.y > ALTO_NIVEL + 24) {
      caerAlVacio();
    }
  }

  /* -------------------------------------------------------
     PARTÍCULAS
     ------------------------------------------------------- */
  function chispas(x, y, colores, cantidad) {
    for (let i = 0; i < cantidad; i++) {
      const angulo = (Math.PI * 2 * i) / cantidad + Math.random() * 0.5;
      const rapidez = 40 + Math.random() * 70;
      particulas.push({
        x: x, y: y,
        vx: Math.cos(angulo) * rapidez,
        vy: Math.sin(angulo) * rapidez - 30,
        vida: 0.5 + Math.random() * 0.4,
        color: colores[i % colores.length],
        grav: 160, tam: Math.random() < 0.3 ? 2 : 1
      });
    }
  }

  function polvo(x, y, cantidad) {
    for (let i = 0; i < cantidad; i++) {
      particulas.push({
        x: x + (Math.random() - 0.5) * 8, y: y - 1,
        vx: (Math.random() - 0.5) * 50, vy: -Math.random() * 25,
        vida: 0.3 + Math.random() * 0.2,
        color: "#f3e4c8", grav: 40, tam: 1
      });
    }
  }

  function zeta(x, y) {
    particulas.push({
      x: x, y: y, vx: 6, vy: -12, vida: 2.4, total: 2.4,
      color: "#fff1d0", grav: 0, zeta: true, fase: Math.random() * 6
    });
  }

  function actualizarParticulas(dt) {
    particulas.forEach((p) => {
      p.vida -= dt;
      p.vy += p.grav * dt;
      p.x += (p.vx + (p.zeta ? Math.sin(tiempoGlobal * 2 + p.fase) * 8 : 0)) * dt;
      p.y += p.vy * dt;
    });
    particulas = particulas.filter((p) => p.vida > 0);
  }

  /* -------------------------------------------------------
     CÁMARA
     ------------------------------------------------------- */
  function actualizarCamara(dt, inmediato) {
    const objetivoX = jugador.x + jugador.w / 2 - ANCHO / 2 + jugador.dir * 26;
    const objetivoY = jugador.y + jugador.h / 2 - ALTO * 0.55;

    if (inmediato) {
      camara.x = objetivoX;
      camara.y = objetivoY;
    } else {
      camara.x += (objetivoX - camara.x) * Math.min(1, dt * 5);
      camara.y += (objetivoY - camara.y) * Math.min(1, dt * 4);
    }

    camara.x = limitar(camara.x, 0, ANCHO_NIVEL - ANCHO);
    camara.y = limitar(camara.y, 0, ALTO_NIVEL - ALTO);
  }

  /* -------------------------------------------------------
     ACTUALIZACIÓN GENERAL
     ------------------------------------------------------- */
  let relojZetas = 0;

  function actualizar(dt) {
    tiempoGlobal += dt;
    temblor = Math.max(0, temblor - dt);

    if (estado === "titulo") {
      relojZetas -= dt;
      if (relojZetas <= 0) {
        relojZetas = 0.8;
        zeta(ANCHO / 2 + 8, 92);
      }
      camara.x = 200 + Math.sin(tiempoGlobal * 0.08) * 200;
      actualizarParticulas(dt);
      return;
    }

    if (estado === "jugando") {
      tiempoPartida += dt;
      actualizarPlataformas(dt);
      actualizarJugador(dt);
      actualizarEnemigos(dt);
      revisarColisiones();
      actualizarCamara(dt, false);
      actualizarParticulas(dt);
      return;
    }

    if (estado === "muerte") {
      temporizador -= dt;
      jugador.vy = Math.min(FIS.caidaMax, jugador.vy + FIS.grav * dt);
      jugador.y += jugador.vy * dt;
      actualizarParticulas(dt);
      if (temporizador <= 0) {
        estado = "gameover";
        mostrarPantalla(ui.derrota);
      }
      return;
    }

    if (estado === "ganando") {
      temporizador -= dt;
      actualizarPlataformas(dt);
      actualizarEnemigos(dt);
      // Saltitos de alegría junto al despertador
      jugador.vy = Math.min(FIS.caidaMax, jugador.vy + FIS.grav * dt);
      const pieAntes = jugador.y + jugador.h;
      jugador.y += jugador.vy * dt;
      jugador.enSuelo = false;
      resolverY(jugador, pieAntes);
      if (jugador.enSuelo) jugador.vy = -200;
      actualizarParticulas(dt);
      if (Math.random() < 0.3) {
        chispas(meta.x + 8, meta.y + 2, ["#f2c14e", "#fff7e8"], 1);
      }
      if (temporizador <= 0) {
        estado = "victoria";
        mostrarVictoria();
      }
      return;
    }

    // pausa, gameover y victoria: solo animaciones suaves
    if (estado !== "pausa") {
      actualizarParticulas(dt);
    }
  }

  /* -------------------------------------------------------
     DIBUJO
     ------------------------------------------------------- */
  function dibujarSprite(cuadro, x, y, izquierda) {
    ctx.drawImage(izquierda ? cuadro.izq : cuadro.der, Math.round(x), Math.round(y));
  }

  function cuadroJugador() {
    const j = jugador;
    const m = S.mono;
    if (estado === "muerte" || j.dolor > 0) return m.dolor;
    if (!j.enSuelo) return j.vy < 0 ? m.saltar : m.caer;
    if (Math.abs(j.vx) > 12) return m.correr[Math.floor(j.anim * 2.2) % 4];
    if (tiempoGlobal % 3.2 < 0.13) return m.parpadeo;
    return m.quieto[Math.floor(tiempoGlobal * 1.6) % 2];
  }

  function dibujarJugador(cx, cy) {
    const j = jugador;
    if (j.invul > 0 && Math.floor(j.invul * 18) % 2 === 0 && estado === "jugando") return;

    const cuadro = cuadroJugador();
    const imagen = j.dir < 0 ? cuadro.izq : cuadro.der;
    const x = Math.round(j.x - 3 - cx);
    const y = Math.round(j.y + j.h - 16 - cy);

    if (j.aplastar > 0) {
      ctx.drawImage(imagen, x - 1, y + 2, 18, 14);
    } else {
      ctx.drawImage(imagen, x, y);
    }
  }

  function dibujarMundo(cx, cy) {
    // Lámparas
    lamparas.forEach((l) => {
      const x = Math.round(l.x - cx);
      const y = Math.round(l.y - cy);
      if (l.activa) {
        ctx.fillStyle = "rgba(242, 193, 78, 0.16)";
        ctx.beginPath();
        ctx.arc(x + 8, y + 6, 18 + Math.sin(tiempoGlobal * 3) * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255, 241, 208, 0.9)";
        ctx.fillRect(x + 7, y + 4, 3, 2);
      }
      dibujarSprite(l.activa ? S.lamparaEncendida : S.lamparaApagada, x, y, false);
    });

    // Despertador
    if (meta) {
      const x = Math.round(meta.x - cx);
      const y = Math.round(meta.y - cy);
      const vibra = Math.floor(tiempoGlobal * 14) % 2 ? 1 : -1;
      ctx.fillStyle = "rgba(242, 193, 78, 0.14)";
      ctx.beginPath();
      ctx.arc(x + 8, y + 8, 16 + Math.sin(tiempoGlobal * 4) * 2, 0, Math.PI * 2);
      ctx.fill();
      dibujarSprite(S.despertador, x + vibra, y, false);
      if (Math.floor(tiempoGlobal * 2) % 2) {
        ctx.fillStyle = "#fff1d0";
        ctx.fillRect(x - 4, y + 2, 2, 1);
        ctx.fillRect(x + 18, y + 2, 2, 1);
        ctx.fillRect(x - 3, y - 1, 1, 2);
        ctx.fillRect(x + 18, y - 1, 1, 2);
      }
    }

    // Objetos coleccionables
    items.forEach((it) => {
      if (it.tomado) return;
      const flota = Math.round(Math.sin(tiempoGlobal * 3 + it.fase) * 2);
      const x = Math.round(it.x - cx);
      const y = Math.round(it.y - cy) + flota;
      if (x < -16 || x > ANCHO + 16) return;
      dibujarSprite(S[it.tipo], x, y, false);
      if (Math.floor(tiempoGlobal * 3 + it.fase) % 4 === 0) {
        ctx.fillStyle = "#fff7e8";
        ctx.fillRect(x + 10, y - 1, 1, 1);
      }
    });

    // Plataformas móviles
    plataformas.forEach((p) => {
      const x = Math.round(p.x - cx);
      const y = Math.round(p.y - cy);
      ctx.fillStyle = "#1b1a2a";
      ctx.fillRect(x, y - 1, p.w, p.h + 2);
      ctx.fillStyle = "#a9d8ec";
      ctx.fillRect(x + 1, y, p.w - 2, p.h);
      ctx.fillStyle = "#e6f6ff";
      ctx.fillRect(x + 1, y, p.w - 2, 2);
      ctx.fillStyle = "#5f9fc0";
      ctx.fillRect(x + 1, y + p.h - 2, p.w - 2, 2);
      for (let i = 6; i < p.w - 4; i += 8) {
        ctx.fillStyle = "#315d78";
        ctx.fillRect(x + i, y + 3, 2, 2);
      }
    });

    // Enemigos
    enemigos.forEach((e) => {
      if (!e.vivo) return;
      const x = Math.round(e.x - cx);
      const y = Math.round(e.y - cy);
      if (e.tipo === "bicho") {
        const cuadro = S.bicho[Math.floor(e.anim * 6) % 2];
        if (e.aplastado > 0) {
          ctx.drawImage(cuadro.der, x - 1, y + 4, 16, 6);
        } else {
          dibujarSprite(cuadro, x - 1, y - 2, e.vx > 0);
        }
      } else {
        const cuadro = S.pesadilla[Math.floor(e.anim * 4) % 2];
        ctx.globalAlpha = 0.9;
        dibujarSprite(cuadro, x - 2, y - 2, Math.cos(e.t * 0.9) < 0);
        ctx.globalAlpha = 1;
      }
    });
  }

  function dibujarParticulas(cx, cy) {
    particulas.forEach((p) => {
      const x = Math.round(p.x - cx);
      const y = Math.round(p.y - cy);
      if (p.zeta) {
        ctx.globalAlpha = limitar(p.vida / p.total, 0, 1);
        texto("z", x, y, p.color, "#1b1a2a");
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(x, y, p.tam, p.tam);
      }
    });
  }

  function dibujarHUD() {
    // Vidas
    ctx.fillStyle = "rgba(20, 22, 44, 0.6)";
    ctx.fillRect(3, 3, 31, 12);
    for (let i = 0; i < VIDAS; i++) {
      dibujarSprite(i < jugador.vidas ? S.corazon : S.corazonVacio, 5 + i * 9, 6, false);
    }

    // Coleccionables
    const grupos = ["lapiz", "camara", "cubo"];
    const anchoGrupo = 36;
    const inicioX = ANCHO - 4 - grupos.length * anchoGrupo;
    ctx.fillStyle = "rgba(20, 22, 44, 0.6)";
    ctx.fillRect(inicioX - 2, 3, grupos.length * anchoGrupo + 3, 16);

    grupos.forEach((tipo, i) => {
      const x = inicioX + i * anchoGrupo;
      dibujarSprite(S[tipo], x, 5, false);
      const completo = recogidos[tipo] === totales[tipo];
      texto(recogidos[tipo] + "/" + totales[tipo], x + 14, 9, completo ? "#f2c14e" : "#fff7e8", "#1b1a2a");
    });
  }

  function dibujarTitulo() {
    const cx = Math.round(camara.x);
    dibujarFondo(cx);

    // Nube grande donde duerme Monky
    const nx = ANCHO / 2 - 34;
    const ny = 112 + Math.round(Math.sin(tiempoGlobal * 1.2) * 2);
    ctx.fillStyle = "#1b1a2a";
    ctx.fillRect(nx + 6, ny - 1, 56, 14);
    ctx.fillRect(nx + 1, ny + 4, 66, 8);
    ctx.fillStyle = "#fff7e8";
    ctx.fillRect(nx + 7, ny, 54, 12);
    ctx.fillRect(nx + 2, ny + 5, 64, 6);
    ctx.fillRect(nx + 14, ny - 4, 22, 4);
    ctx.fillRect(nx + 38, ny - 3, 14, 3);
    ctx.fillStyle = "#cfc6e6";
    ctx.fillRect(nx + 3, ny + 9, 62, 2);

    // Monky dormido
    const respira = Math.floor(tiempoGlobal * 1.2) % 2;
    ctx.drawImage(S.mono.dormido.der, ANCHO / 2 - 8, ny - 16 + respira, 16, 16 - respira);

    dibujarParticulas(0, 0);
  }

  function dibujar() {
    if (estado === "titulo") {
      dibujarTitulo();
      return;
    }

    let sacudeX = 0;
    let sacudeY = 0;
    if (temblor > 0) {
      sacudeX = Math.round((Math.random() - 0.5) * 4);
      sacudeY = Math.round((Math.random() - 0.5) * 4);
    }

    const cx = limitar(Math.round(camara.x) + sacudeX, 0, ANCHO_NIVEL - ANCHO);
    const cy = limitar(Math.round(camara.y) + sacudeY, 0, ALTO_NIVEL - ALTO);

    dibujarFondo(cx);
    ctx.drawImage(capaNivel, cx, cy, ANCHO, ALTO, 0, 0, ANCHO, ALTO);
    dibujarMundo(cx, cy);
    dibujarJugador(cx, cy);
    dibujarParticulas(cx, cy);
    dibujarHUD();
  }

  /* -------------------------------------------------------
     INTERFAZ HTML
     ------------------------------------------------------- */
  const ui = {
    inicio: document.getElementById("pantalla-inicio"),
    pausa: document.getElementById("pantalla-pausa"),
    derrota: document.getElementById("pantalla-derrota"),
    victoria: document.getElementById("pantalla-victoria"),
    hud: document.getElementById("hud-botones"),
    aviso: document.getElementById("aviso"),
    sonido: document.getElementById("btn-sonido"),
    pausar: document.getElementById("btn-pausa")
  };

  function mostrarPantalla(pantalla) {
    [ui.inicio, ui.pausa, ui.derrota, ui.victoria].forEach((p) => {
      p.hidden = p !== pantalla;
    });

    ui.pausar.hidden = !(estado === "jugando" || estado === "pausa");
    document.body.classList.toggle("en-juego", estado === "jugando");
    document.body.classList.toggle("en-titulo", estado === "titulo");

    if (pantalla) {
      const principal = pantalla.querySelector("[data-principal]");
      if (principal) principal.focus({ preventScroll: true });
    } else {
      lienzo.focus({ preventScroll: true });
    }
  }

  let relojAviso = null;
  function mostrarAviso(mensaje) {
    ui.aviso.textContent = mensaje;
    ui.aviso.classList.add("visible");
    clearTimeout(relojAviso);
    relojAviso = setTimeout(() => ui.aviso.classList.remove("visible"), 2600);
  }

  function formatoTiempo(segundos) {
    const m = Math.floor(segundos / 60);
    const s = Math.floor(segundos % 60);
    return m + ":" + String(s).padStart(2, "0");
  }

  function mostrarVictoria() {
    const total = recogidos.lapiz + recogidos.camara + recogidos.cubo;
    const maximo = totales.lapiz + totales.camara + totales.cubo;

    document.getElementById("res-lapiz").textContent = recogidos.lapiz + "/" + totales.lapiz;
    document.getElementById("res-camara").textContent = recogidos.camara + "/" + totales.camara;
    document.getElementById("res-cubo").textContent = recogidos.cubo + "/" + totales.cubo;
    document.getElementById("res-tiempo").textContent = formatoTiempo(tiempoPartida);
    document.getElementById("res-vidas").textContent = jugador.vidas + "/" + VIDAS;
    document.getElementById("res-mensaje").textContent =
      total === maximo
        ? "¡Sueño perfecto! Reuniste todas las ideas creativas."
        : "Reuniste " + total + " de " + maximo + " ideas. Aún quedan algunas por descubrir.";

    mostrarPantalla(ui.victoria);
  }

  function iniciarPartida() {
    Snd.activar();
    Snd.reproducir("boton");
    soltarTodo();
    reiniciarNivel();
    estado = "jugando";
    mostrarPantalla(null);
    mostrarAviso("Reúne lápices, cámaras y cubos. ¡Despierta en el reloj!");
  }

  function alternarPausa() {
    if (estado === "jugando") {
      estado = "pausa";
      soltarTodo();
      mostrarPantalla(ui.pausa);
    } else if (estado === "pausa") {
      estado = "jugando";
      mostrarPantalla(null);
    }
  }

  function alternarSonido() {
    Snd.activar();
    const silencio = Snd.alternarSilencio();
    actualizarBotonSonido(silencio);
  }

  function actualizarBotonSonido(silencio) {
    ui.sonido.setAttribute("aria-pressed", String(silencio));
    ui.sonido.setAttribute("aria-label", silencio ? "Activar sonido" : "Silenciar sonido");
    ui.sonido.querySelector("span").textContent = silencio ? "×" : "♪";
  }

  document.querySelectorAll("[data-accion]").forEach((boton) => {
    boton.addEventListener("click", () => {
      const accion = boton.getAttribute("data-accion");
      if (accion === "jugar") iniciarPartida();
      else if (accion === "pausa") alternarPausa();
      else if (accion === "continuar") alternarPausa();
      else if (accion === "sonido") alternarSonido();
      else if (accion === "inicio") {
        estado = "titulo";
        soltarTodo();
        mostrarPantalla(ui.inicio);
      }
    });
  });

  actualizarBotonSonido(Snd.estaSilenciado());

  /* -------------------------------------------------------
     BUCLE PRINCIPAL
     ------------------------------------------------------- */
  let ultimo = performance.now();
  let acumulado = 0;

  function bucle(ahora) {
    let dt = (ahora - ultimo) / 1000;
    ultimo = ahora;
    if (dt > 0.25) dt = 0.25;

    acumulado += dt;
    let pasos = 0;
    while (acumulado >= PASO && pasos < 6) {
      actualizar(PASO);
      acumulado -= PASO;
      pasos++;
    }
    if (pasos === 6) acumulado = 0;

    dibujar();
    requestAnimationFrame(bucle);
  }

  construirCapaNivel();
  reiniciarNivel();
  mostrarPantalla(ui.inicio);
  requestAnimationFrame(bucle);

  /* -------------------------------------------------------
     API DE DEPURACIÓN (solo lectura, útil para pruebas)
     ------------------------------------------------------- */
  window.MonkyDreams = {
    estado: () => estado,
    jugador: () => ({
      x: jugador.x, y: jugador.y, vx: jugador.vx, vy: jugador.vy,
      enSuelo: jugador.enSuelo, vidas: jugador.vidas
    }),
    recogidos: () => Object.assign({}, recogidos),
    totales: () => Object.assign({}, totales),
    entrada: () => ({ izq: entrada.izq, der: entrada.der, saltar: entrada.saltar }),
    plataformas: () => plataformas.map((p) => ({ x: p.x, y: p.y, w: p.w })),
    nivel: { columnas: COLS, filas: FILAS }
  };

  /* Herramientas de prueba: solo existen con ?depurar en la URL */
  if (new URLSearchParams(window.location.search).has("depurar")) {
    window.MonkyDreams.depurar = {
      teletransportar(columna, fila) {
        colocarJugador({ x: columna * T + 3, y: fila * T + 2 });
        actualizarCamara(0, true);
      },
      quitarVida() {
        jugador.invul = 0;
        herir(jugador.x + jugador.w);
      }
    };
  }
})();
