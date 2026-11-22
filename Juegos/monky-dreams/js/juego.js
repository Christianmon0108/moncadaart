/* =========================================================
   MONKY DREAMS — MOTOR DEL JUEGO (modo Aventura)
   Canvas 2D a 320x180 con píxeles nítidos. Física a paso
   fijo de 1/60 s compartida con las pruebas (js/fisica.js).
   ========================================================= */

(function () {
  "use strict";

  /* -------------------------------------------------------
     CONFIGURACIÓN
     ------------------------------------------------------- */
  const ANCHO = 320;
  const ALTO = 180;
  const PASO = 1 / 60;
  const VIDAS = 3;
  const INVULNERABLE = 1.5;

  const F = window.MonkyFisica;
  const T = F.T;
  const FIS = F.FIS;

  const lienzo = document.getElementById("juego");
  const ctx = lienzo.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const S = window.MonkySprites.construir();
  const ESC = window.MonkyEscenario;
  const Snd = window.MonkySonido;

  /* -------------------------------------------------------
     UTILIDADES
     ------------------------------------------------------- */
  const limitar = (v, min, max) => Math.max(min, Math.min(max, v));
  const solapan = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const azar = (min, max) => min + Math.random() * (max - min);

  /* -------------------------------------------------------
     NIVEL
     ------------------------------------------------------- */
  const MAPA = window.MonkyNivel.mapa;
  const mundo = F.crearMundo(MAPA);
  const FILAS = mundo.filas;
  const COLS = mundo.columnas;
  const ANCHO_NIVEL = mundo.ancho;
  const ALTO_NIVEL = mundo.alto;
  const casilla = mundo.casilla;
  const esSolida = mundo.esSolida;

  const capaNivel = ESC.construirCapaNivel(MAPA);
  const fondo = ESC.construirFondo();

  /* -------------------------------------------------------
     FUENTES PIXEL
     3x5 para textos pequeños y 5x7 para el logotipo.
     ------------------------------------------------------- */
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
    " ": "000000000000000"
  };

  function texto(cadena, x, y, color, sombra, escala) {
    const e = escala || 1;
    let cursor = Math.round(x);
    for (const letra of String(cadena).toUpperCase()) {
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

  /* Palabra del logotipo con contorno, degradado por filas y sombra */
  function construirPalabra(palabra, colores) {
    const e = 3, sep = 3;
    const ancho = palabra.length * (5 * e + sep) - sep + 4;
    const alto = 7 * e + 6;
    const capa = S.crearCanvas(ancho, alto);
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
        } else if (en(x - 1, y) || en(x + 1, y) || en(x, y - 1) || en(x, y + 1) || en(x - 1, y - 1) || en(x + 1, y + 1) || en(x - 1, y + 1) || en(x + 1, y - 1)) {
          c.fillStyle = "#16152a";
          c.fillRect(x, y, 1, 1);
        } else if (en(x - 2, y - 2) || en(x - 1, y - 2) || en(x - 2, y - 1)) {
          c.fillStyle = "#16152a";
          c.fillRect(x, y, 1, 1); // sombra proyectada
        }
      }
    }
    return capa;
  }

  const logoMonky = construirPalabra("MONKY", ["#fffaf0", "#fff1d6", "#f3e4c8", "#e0c9a2"]);
  const logoDreams = construirPalabra("DREAMS", ["#ffe08a", "#ffb35a", "#e8792e", "#c95f1f"]);

  /* Halo tramado (brillo del despertador) */
  const halo = (function () {
    const r = 18, c = S.crearCanvas(r * 2 + 1, r * 2 + 1), g = c.getContext("2d");
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
      const d = Math.hypot(x, y);
      if (d > r) continue;
      const denso = d < r * 0.55 ? (x + y) % 2 === 0 : (x % 2 === 0 && y % 2 === 0);
      if (!denso) continue;
      g.fillStyle = d < r * 0.55 ? "rgba(255, 214, 120, 0.22)" : "rgba(255, 214, 120, 0.16)";
      g.fillRect(x + r, y + r, 1, 1);
    }
    return c;
  })();

  /* Nube grande de la portada */
  const nubeTitulo = (function () {
    const w = 84, h = 22;
    const c = S.crearCanvas(w, h);
    const g = c.getContext("2d");
    const dentro = (x, y) => {
      if (x < 0 || y < 0 || x >= w || y >= h) return false;
      return Math.hypot(x - 14, y - 13) < 8 || Math.hypot(x - 30, y - 9) < 9 || Math.hypot(x - 42, y - 8) < 8.5 || Math.hypot(x - 54, y - 9) < 8 ||
        Math.hypot(x - 69, y - 13) < 8 || (y > 10 && y < 20 && x > 8 && x < 76);
    };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!dentro(x, y)) continue;
      const borde = !dentro(x - 1, y) || !dentro(x + 1, y) || !dentro(x, y - 1) || !dentro(x, y + 1);
      g.fillStyle = borde ? "#16152a" : !dentro(x, y - 2) ? "#ffffff" : y > h - 5 ? "#c9b8ea" : y > h - 7 ? "#e7dcf6" : "#fff4de";
      g.fillRect(x, y, 1, 1);
    }
    return c;
  })();

  /* -------------------------------------------------------
     ESTADO DEL JUEGO
     ------------------------------------------------------- */
  let estado = "titulo";
  let tiempoGlobal = 0;
  let tiempoPartida = 0;
  let temporizador = 0;
  let temblor = 0;
  let fundido = 0;

  let items = [];
  let enemigos = [];
  let plataformas = [];
  let lamparas = [];
  let meta = null;
  let inicio = { x: 40, y: 140 };
  let reaparicion = { x: 40, y: 140 };
  let particulas = [];
  let efectos = [];

  const totales = { moneda: 0 };
  const recogidos = { moneda: 0 };
  const camara = { x: 0, y: ALTO_NIVEL - ALTO, adelanto: 0 };

  const jugador = Object.assign(F.crearJugador(0, 0), {
    invul: 0, vidas: VIDAS, distancia: 0,
    estirar: 0, aplastar: 0, relojPolvo: 0, animFestejo: 0
  });

  function crearEntidades() {
    items = [];
    enemigos = [];
    plataformas = [];
    lamparas = [];
    meta = null;
    totales.moneda = 0;

    for (let cy = 0; cy < FILAS; cy++) {
      for (let cx = 0; cx < COLS; cx++) {
        const ch = MAPA[cy][cx];
        const x = cx * T;
        const y = cy * T;
        if (ch === "O") {
          totales.moneda++;
          items.push({ tipo: "moneda", x: x + 2, y: y + 2, w: 12, h: 12, fase: cx * 0.7 + cy, tomado: false });
        } else if (ch === "E") {
          enemigos.push({ tipo: "bicho", x: x + 1, y: y + T - 10, w: 14, h: 10, vx: -28, anim: cx, aplastado: 0, vivo: true });
        } else if (ch === "N") {
          enemigos.push({ tipo: "pesadilla", x0: x + 2, y0: y + 2, x: x + 2, y: y + 2, w: 12, h: 12, t: 0, anim: 0, vivo: true });
        } else if (ch === "~") {
          plataformas.push({ x: x - T, y: y, w: 48, h: 8, x0: x - T, x1: x + 7 * T, vel: 34, dx: 0 });
        } else if (ch === "L") {
          lamparas.push({ x: x, y: y, w: T, h: T, activa: false });
        } else if (ch === "Z") {
          // Zona de meta: toda la columna del despertador (también cuenta pasar por encima)
          meta = { x: x - 2, y: -64, w: 20, h: y + 16 + 64, dibujoY: y - 3 };
        } else if (ch === "M") {
          inicio = { x: x + 3, y: y + T - jugador.h };
        }
      }
    }
  }

  function reiniciarNivel() {
    crearEntidades();
    recogidos.moneda = 0;
    particulas = [];
    efectos = [];
    reaparicion = { x: inicio.x, y: inicio.y };
    tiempoPartida = 0;
    temblor = 0;
    jugador.vidas = VIDAS;
    colocarJugador(inicio);
    jugador.invul = 0;
    actualizarCamara(0, true);
  }

  function colocarJugador(punto) {
    Object.assign(jugador, {
      x: punto.x, y: punto.y, vx: 0, vy: 0, dir: 1,
      enSuelo: false, sobre: null, coyote: 0, buffer: 0, dolor: 0,
      estirar: 0, aplastar: 0
    });
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

  const pedirSalto = () => { jugador.buffer = FIS.buffer; };

  const MAPA_TECLAS = {
    ArrowLeft: "izq", KeyA: "izq",
    ArrowRight: "der", KeyD: "der",
    ArrowUp: "saltar", KeyW: "saltar", Space: "saltar", KeyZ: "saltar", KeyK: "saltar"
  };

  window.addEventListener("keydown", (evento) => {
    const accion = MAPA_TECLAS[evento.code];
    const enBoton = document.activeElement && document.activeElement.tagName === "BUTTON";

    if (accion) {
      if (estado === "jugando" || !enBoton) evento.preventDefault();
      if (accion === "saltar" && !teclas.saltar && estado === "jugando") pedirSalto();
      teclas[accion] = true;
      return;
    }

    if (evento.code === "KeyP" || evento.code === "Escape") {
      if (evento.code === "Escape" && pantallaCompletaActiva()) return; // el navegador sale de pantalla completa
      evento.preventDefault();
      alternarPausa();
    } else if (evento.code === "KeyM") {
      alternarSonido();
    } else if (evento.code === "KeyF") {
      alternarPantallaCompleta();
    } else if (evento.code === "Enter" && !enBoton) {
      if (estado === "titulo" || estado === "gameover" || estado === "victoria") iniciarPartida();
      else if (estado === "pausa") alternarPausa();
    }
  });

  window.addEventListener("keyup", (evento) => {
    const accion = MAPA_TECLAS[evento.code];
    if (accion) teclas[accion] = false;
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

  /* Controles táctiles: se puede deslizar el dedo entre ◀ y ▶ */
  const cruceta = document.getElementById("cruceta");
  const btnIzq = document.getElementById("btn-izq");
  const btnDer = document.getElementById("btn-der");
  const btnSaltar = document.getElementById("btn-saltar");
  const punterosCruceta = new Map();

  /* Elige la flecha más cercana al dedo (sirve si están lado a lado o apiladas) */
  function ladoCruceta(evento) {
    const distancia = (el) => {
      const r = el.getBoundingClientRect();
      return Math.hypot(evento.clientX - (r.left + r.width / 2), evento.clientY - (r.top + r.height / 2));
    };
    return distancia(btnIzq) <= distancia(btnDer) ? "izq" : "der";
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
    if (!punterosCruceta.has(evento.pointerId)) return;
    punterosCruceta.set(evento.pointerId, ladoCruceta(evento));
    actualizarCruceta();
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
    if (!tactil.saltar && estado === "jugando") pedirSalto();
    tactil.saltar = true;
    actualizarBotonesTactiles();
  });

  ["pointerup", "pointercancel", "lostpointercapture"].forEach((tipo) => {
    btnSaltar.addEventListener(tipo, () => {
      tactil.saltar = false;
      actualizarBotonesTactiles();
    });
  });

  [cruceta, btnSaltar].forEach((el) => el.addEventListener("contextmenu", (e) => e.preventDefault()));

  function activarModoTactil() {
    if (!document.body.classList.contains("tactil")) {
      document.body.classList.add("tactil");
      requestAnimationFrame(actualizarEscala);
    }
  }

  if ((window.matchMedia && window.matchMedia("(pointer: coarse)").matches) ||
      new URLSearchParams(window.location.search).has("tactil")) {
    activarModoTactil();
  }
  window.addEventListener("touchstart", activarModoTactil, { passive: true, once: true });

  /* -------------------------------------------------------
     JUGADOR
     ------------------------------------------------------- */
  function actualizarJugador(dt) {
    const j = jugador;
    const dir = (entrada.der ? 1 : 0) - (entrada.izq ? 1 : 0);
    const ev = F.pasoJugador(j, { dir: dir, saltoSostenido: entrada.saltar }, dt, mundo, plataformas);

    if (ev.salto) {
      Snd.reproducir("saltar");
      j.estirar = 0.14;
      polvo(j.x + j.w / 2, j.y + j.h, 0);
    }
    if (ev.aterrizo && ev.vyAterrizaje > 140) {
      j.aplastar = 0.12;
      polvo(j.x + j.w / 2 - 5, j.y + j.h, -1);
      polvo(j.x + j.w / 2 + 5, j.y + j.h, 1);
    }
    if (ev.giro && j.relojPolvo <= 0) {
      polvo(j.x + j.w / 2, j.y + j.h, -j.dir);
      j.relojPolvo = 0.15;
    }

    // Polvo al correr
    j.relojPolvo -= dt;
    if (j.enSuelo && Math.abs(j.vx) > 90 && j.relojPolvo <= 0) {
      polvo(j.x + j.w / 2 - j.dir * 4, j.y + j.h, -j.dir);
      j.relojPolvo = 0.22;
    }

    j.distancia += Math.abs(j.vx) * dt;
    j.invul = Math.max(0, j.invul - dt);
    j.dolor = Math.max(0, j.dolor - dt);
    j.estirar = Math.max(0, j.estirar - dt);
    j.aplastar = Math.max(0, j.aplastar - dt);
  }

  function herir(origenX) {
    const j = jugador;
    if (j.invul > 0 || estado !== "jugando") return;

    j.vidas--;
    temblor = 0.3;
    Snd.reproducir("dolor");
    chispas(j.x + j.w / 2, j.y + j.h / 2, ["#e8473c", "#ff9b8a", "#fff7e8"], 12);

    if (j.vidas <= 0) {
      perderPartida();
      return;
    }

    j.invul = INVULNERABLE;
    j.dolor = 0.35;
    j.vy = -240;
    j.vx = (j.x + j.w / 2 < origenX ? -1 : 1) * 125;
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

    fundido = 1;
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
    temporizador = 2;
    jugador.vx = 0;
    jugador.vy = -260;
    Snd.reproducir("victoria");
    chispas(meta.x + 10, meta.dibujoY + 8, ["#f2c14e", "#e8792e", "#fff7e8", "#7aa6cf"], 34);
  }

  /* -------------------------------------------------------
     ENEMIGOS Y PLATAFORMAS
     ------------------------------------------------------- */
  function actualizarPlataformas(dt) {
    plataformas.forEach((p) => {
      const antes = p.x;
      p.x += p.vel * dt;
      if (p.x > p.x1) { p.x = p.x1; p.vel = -Math.abs(p.vel); }
      else if (p.x < p.x0) { p.x = p.x0; p.vel = Math.abs(p.vel); }
      p.dx = p.x - antes;
    });
  }

  function actualizarEnemigos(dt) {
    enemigos.forEach((e) => {
      if (!e.vivo) return;
      if (e.tipo === "bicho") {
        if (e.aplastado > 0) {
          e.aplastado -= dt;
          if (e.aplastado <= 0) {
            e.vivo = false;
            polvo(e.x + e.w / 2, e.y + e.h, 0);
          }
          return;
        }
        e.anim += dt;
        e.x += e.vx * dt;
        const frente = e.vx > 0 ? e.x + e.w + 1 : e.x - 1;
        const cx = Math.floor(frente / T);
        const fila = Math.floor((e.y + e.h / 2) / T);
        const piso = Math.floor((e.y + e.h + 2) / T);
        const choca = esSolida(casilla(cx, fila)) || casilla(cx, fila) === "^";
        if (choca || !esSolida(casilla(cx, piso))) {
          e.vx = -e.vx;
          e.x += e.vx * dt * 2;
        }
      } else if (e.tipo === "pesadilla") {
        e.t += dt;
        e.anim += dt;
        e.x = e.x0 + Math.sin(e.t * 0.9) * 28;
        e.y = e.y0 + Math.sin(e.t * 2.1) * 10;
        if (Math.random() < 0.35) {
          particulas.push({
            x: e.x + 2 + Math.random() * 10, y: e.y + 13, vx: azar(-6, 6), vy: azar(4, 14),
            vida: 0.6, total: 0.6, color: Math.random() < 0.5 ? "#2a2147" : "#43356f", grav: 0, tam: 1
          });
        }
      }
    });
  }

  function revisarColisiones() {
    const j = jugador;

    for (const e of enemigos) {
      if (!e.vivo || e.aplastado > 0 || !solapan(j, e)) continue;
      const pisotea = e.tipo === "bicho" && j.vy > 0 && j.y + j.h - e.y < 10;
      if (pisotea) {
        e.aplastado = 0.45;
        j.vy = entrada.saltar ? FIS.reboteAlto : FIS.rebote;
        j.enSuelo = false;
        j.estirar = 0.12;
        Snd.reproducir("aplastar");
        efecto("destello", e.x + e.w / 2, e.y + 2);
        chispas(e.x + e.w / 2, e.y + 4, ["#b294f0", "#fff7e8", "#f2c14e"], 10);
      } else {
        herir(e.x + e.w / 2);
      }
    }

    const x0 = Math.floor(j.x / T), x1 = Math.floor((j.x + j.w - 0.001) / T);
    const y0 = Math.floor(j.y / T), y1 = Math.floor((j.y + j.h - 0.001) / T);
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        if (casilla(cx, cy) !== "^") continue;
        if (solapan(j, { x: cx * T + 2, y: cy * T + 9, w: 12, h: 7 })) {
          herir(cx * T + T / 2);
          if (estado === "jugando") j.vy = -300;
        }
      }
    }

    items.forEach((it) => {
      if (it.tomado || !solapan(j, it)) return;
      it.tomado = true;
      recogidos.moneda++;
      Snd.reproducir("recoger");
      efecto("destello", it.x + 6, it.y + 6);
      efecto("texto", it.x + 1, it.y - 2, "+1");
      chispas(it.x + 6, it.y + 6, ["#f2c14e", "#fff1b0", "#e8792e"], 8);
    });

    lamparas.forEach((l) => {
      if (l.activa) return;
      const centro = j.x + j.w / 2;
      if (centro > l.x && centro < l.x + l.w && Math.abs(j.y - l.y) < 40) {
        l.activa = true;
        reaparicion = { x: l.x + 3, y: l.y + T - j.h };
        Snd.reproducir("control");
        efecto("destello", l.x + 9, l.y - 1);
        chispas(l.x + 9, l.y, ["#f2c14e", "#fff1d0"], 14);
        mostrarAviso("Lámpara encendida: punto de control");
      }
    });

    if (meta && solapan(j, meta)) ganarPartida();
    if (j.y > ALTO_NIVEL + 24) caerAlVacio();
  }

  /* -------------------------------------------------------
     PARTÍCULAS Y EFECTOS
     ------------------------------------------------------- */
  function chispas(x, y, colores, cantidad) {
    for (let i = 0; i < cantidad; i++) {
      const angulo = (Math.PI * 2 * i) / cantidad + Math.random() * 0.5;
      const rapidez = 40 + Math.random() * 70;
      particulas.push({
        x: x, y: y,
        vx: Math.cos(angulo) * rapidez, vy: Math.sin(angulo) * rapidez - 30,
        vida: 0.5 + Math.random() * 0.4, total: 0.9,
        color: colores[i % colores.length], grav: 170, tam: Math.random() < 0.3 ? 2 : 1
      });
    }
  }

  function polvo(x, y, dir) {
    efectos.push({ tipo: "polvo", x: x - 4 + dir * 2, y: y - 7, vx: dir * 18, vida: 0.32, total: 0.32 });
  }

  function efecto(tipo, x, y, contenido) {
    efectos.push({ tipo: tipo, x: x, y: y, vx: 0, vida: tipo === "texto" ? 0.7 : 0.3, total: tipo === "texto" ? 0.7 : 0.3, contenido: contenido });
  }

  function zeta(x, y) {
    particulas.push({ x: x, y: y, vx: 6, vy: -11, vida: 2.6, total: 2.6, color: "#fff1d0", grav: 0, zeta: true, fase: Math.random() * 6 });
  }

  function actualizarParticulas(dt) {
    particulas.forEach((p) => {
      p.vida -= dt;
      p.vy += p.grav * dt;
      p.x += (p.vx + (p.zeta ? Math.sin(tiempoGlobal * 2 + p.fase) * 8 : 0)) * dt;
      p.y += p.vy * dt;
    });
    particulas = particulas.filter((p) => p.vida > 0);
    efectos.forEach((e) => {
      e.vida -= dt;
      e.x += e.vx * dt;
      if (e.tipo === "texto") e.y -= 18 * dt;
    });
    efectos = efectos.filter((e) => e.vida > 0);
  }

  /* -------------------------------------------------------
     CÁMARA: sigue a Monky y se adelanta hacia donde mira
     ------------------------------------------------------- */
  function actualizarCamara(dt, inmediato) {
    const objetivoAdelanto = jugador.dir * 34;
    camara.adelanto = inmediato ? objetivoAdelanto : camara.adelanto + (objetivoAdelanto - camara.adelanto) * Math.min(1, dt * 2.5);
    const objetivoX = jugador.x + jugador.w / 2 - ANCHO / 2 + camara.adelanto;
    const objetivoY = jugador.y + jugador.h - ALTO * 0.66;

    if (inmediato) {
      camara.x = objetivoX;
      camara.y = objetivoY;
    } else {
      camara.x += (objetivoX - camara.x) * Math.min(1, dt * 7);
      camara.y += (objetivoY - camara.y) * Math.min(1, dt * (jugador.enSuelo ? 5 : 2.5));
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
    fundido = Math.max(0, fundido - dt * 2.5);

    if (estado === "titulo") {
      relojZetas -= dt;
      if (relojZetas <= 0) {
        relojZetas = 0.9;
        zeta(ANCHO / 2 + 10, 96);
      }
      camara.x = 300 + Math.sin(tiempoGlobal * 0.05) * 300;
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
      jugador.vy = Math.min(FIS.caidaMax, jugador.vy + FIS.grav * dt);
      const pieAntes = jugador.y + jugador.h;
      jugador.y += jugador.vy * dt;
      jugador.enSuelo = false;
      F.resolverY(jugador, pieAntes, mundo, plataformas);
      if (jugador.enSuelo) { jugador.vy = -210; jugador.estirar = 0.12; }
      jugador.animFestejo += dt;
      actualizarParticulas(dt);
      if (Math.random() < 0.25) chispas(meta.x + 10, meta.dibujoY + 2, ["#f2c14e", "#fff7e8", "#7aa6cf", "#e8792e"], 1);
      if (temporizador <= 0) {
        estado = "victoria";
        mostrarVictoria();
      }
      return;
    }

    if (estado !== "pausa") actualizarParticulas(dt);
  }

  /* -------------------------------------------------------
     DIBUJO
     ------------------------------------------------------- */
  function cuadroJugador() {
    const j = jugador;
    const m = S.mono;
    if (estado === "ganando" || estado === "victoria") return m.festejo[Math.floor(j.animFestejo * 6) % 2];
    if (estado === "muerte" || j.dolor > 0) return m.dolor;
    if (!j.enSuelo) return j.vy < -30 ? m.saltar : m.caer;
    if (Math.abs(j.vx) > 12) return m.correr[Math.floor(j.distancia / 7) % 6];
    if (tiempoGlobal % 3.4 < 0.14) return m.parpadeo;
    return m.quieto[Math.floor(tiempoGlobal * 1.8) % 2];
  }

  function dibujarJugador(cx, cy) {
    const j = jugador;
    const cuadro = cuadroJugador();
    const golpe = j.invul > INVULNERABLE - 0.18 && estado === "jugando";
    if (!golpe && j.invul > 0 && estado === "jugando" && Math.floor(j.invul * 16) % 2 === 0) return; // parpadeo
    const destello = golpe;
    const izquierda = j.dir < 0;
    const imagen = destello ? (izquierda ? cuadro.blancoIzq : cuadro.blanco) : izquierda ? cuadro.izq : cuadro.der;

    let w = 18, h = 20;
    if (j.estirar > 0) { w = 16; h = 22; }
    else if (j.aplastar > 0) { w = 21; h = 17; }

    const base = Math.round(j.y + j.h - cy);
    const centro = Math.round(j.x + j.w / 2 - cx + (izquierda ? 0 : -1));
    ctx.drawImage(imagen, centro - Math.floor(w / 2), base - h, w, h);
  }

  function dibujarSprite(cuadro, x, y, izquierda) {
    ctx.drawImage(izquierda ? cuadro.izq : cuadro.der, Math.round(x), Math.round(y));
  }

  function dibujarMundo(cx, cy) {
    // Lámparas
    lamparas.forEach((l) => {
      const x = Math.round(l.x - cx), y = Math.round(l.y - cy);
      if (l.activa) {
        for (let r = 0; r < 18; r++) {
          const ancho = 4 + r * 1.2;
          ctx.fillStyle = r % 3 === 0 ? "rgba(255, 214, 120, 0.10)" : "rgba(255, 214, 120, 0.06)";
          ctx.fillRect(Math.round(x + 9 - ancho / 2), y + 2 + r, Math.round(ancho), 1);
        }
      }
      dibujarSprite(l.activa ? S.lamparaEncendida : S.lamparaApagada, x, y + T - 19, false);
    });

    // Despertador (vibra y brilla)
    if (meta) {
      const x = Math.round(meta.x - cx), y = Math.round(meta.dibujoY - cy);
      const vibra = Math.floor(tiempoGlobal * 16) % 2 ? 1 : 0;
      ctx.drawImage(halo, x + 10 - halo.width / 2, y + 9 - halo.height / 2 + Math.round(Math.sin(tiempoGlobal * 3)));
      dibujarSprite(S.despertador, x + vibra, y, false);
      if (Math.floor(tiempoGlobal * 3) % 2) {
        ctx.fillStyle = "#fff1d0";
        ctx.fillRect(x - 3, y + 1, 2, 1); ctx.fillRect(x - 2, y - 2, 1, 2);
        ctx.fillRect(x + 21, y + 1, 2, 1); ctx.fillRect(x + 21, y - 2, 1, 2);
      }
    }

    // Monedas
    items.forEach((it) => {
      if (it.tomado) return;
      const x = Math.round(it.x - cx);
      if (x < -16 || x > ANCHO + 16) return;
      const y = Math.round(it.y - cy + Math.sin(tiempoGlobal * 3 + it.fase) * 1.5);
      const cuadro = S.moneda[Math.floor(tiempoGlobal * 9 + it.fase) % 8];
      ctx.drawImage(cuadro.der, x, y);
      if (Math.floor(tiempoGlobal * 2 + it.fase) % 5 === 0) ctx.drawImage(S.destello[0].der, x + 7, y - 1);
    });

    // Almohadas voladoras
    plataformas.forEach((p) => {
      const x = Math.round(p.x - cx), y = Math.round(p.y - cy);
      const flota = Math.round(Math.sin(tiempoGlobal * 4) * 0.6);
      ctx.drawImage(ESC.almohada[Math.floor(tiempoGlobal * 8) % 2], x - 4, y - 4 + flota);
    });

    // Enemigos
    enemigos.forEach((e) => {
      if (!e.vivo) return;
      const x = Math.round(e.x - cx), y = Math.round(e.y - cy);
      if (e.tipo === "bicho") {
        const cuadro = S.bicho[Math.floor(e.anim * 8) % 3];
        if (e.aplastado > 0) {
          ctx.drawImage(cuadro.der, x - 2, y + 5, 18, 6);
        } else {
          dibujarSprite(cuadro, x - 1, y + e.h - 13, e.vx > 0);
        }
      } else {
        const cuadro = S.pesadilla[Math.floor(e.anim * 4) % 2];
        dibujarSprite(cuadro, x - 2, y - 2, Math.cos(e.t * 0.9) < 0);
      }
    });
  }

  function dibujarParticulas(cx, cy) {
    particulas.forEach((p) => {
      const x = Math.round(p.x - cx), y = Math.round(p.y - cy);
      if (p.zeta) {
        ctx.globalAlpha = limitar(p.vida / p.total, 0, 1);
        texto("Z", x, y, p.color, "#16152a");
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(x, y, p.tam, p.tam);
      }
    });
    efectos.forEach((e) => {
      const avance = 1 - e.vida / e.total;
      const x = Math.round(e.x - cx), y = Math.round(e.y - cy);
      if (e.tipo === "polvo") {
        ctx.drawImage(S.polvo[Math.min(3, Math.floor(avance * 4))].der, x, y);
      } else if (e.tipo === "destello") {
        const f = avance < 0.5 ? Math.floor(avance * 6) : 2 - Math.floor((avance - 0.5) * 6);
        const img = S.destello[limitar(f, 0, 2)].der;
        ctx.drawImage(img, x - Math.floor(img.width / 2), y - Math.floor(img.height / 2));
      } else if (e.tipo === "texto") {
        if (e.vida > 0.15 || Math.floor(e.vida * 30) % 2) texto(e.contenido, x, y, "#ffe08a", "#16152a");
      }
    });
  }

  function panel(x, y, w, h) {
    ctx.fillStyle = "#16152a";
    ctx.fillRect(x + 1, y, w - 2, h);
    ctx.fillRect(x, y + 1, w, h - 2);
    ctx.fillStyle = "rgba(29, 34, 72, 0.92)";
    ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
    ctx.fillStyle = "#3b4478";
    ctx.fillRect(x + 2, y + 1, w - 4, 1);
  }

  function dibujarHUD() {
    panel(3, 3, 33, 13);
    for (let i = 0; i < VIDAS; i++) {
      const sacude = temblor > 0 && i === jugador.vidas ? Math.round(Math.random() * 2 - 1) : 0;
      dibujarSprite(i < jugador.vidas ? S.corazon : S.corazonVacio, 6 + i * 9 + sacude, 6, false);
    }

    const etiqueta = recogidos.moneda + "/" + totales.moneda;
    const ancho = 12 + 4 + anchoTexto(etiqueta) + 6;
    const x = ANCHO - 3 - ancho;
    panel(x, 3, ancho, 16);
    ctx.drawImage(S.moneda[Math.floor(tiempoGlobal * 8) % 8].der, x + 3, 5);
    const completo = recogidos.moneda === totales.moneda;
    texto(etiqueta, x + 18, 9, completo ? "#ffe08a" : "#fff7e8", "#16152a");
  }

  function dibujarTitulo() {
    const cx = Math.round(camara.x);
    fondo.dibujar(ctx, cx, tiempoGlobal);

    const flota = Math.round(Math.sin(tiempoGlobal * 1.3) * 1.5);
    ctx.drawImage(logoMonky, Math.round(ANCHO / 2 - logoMonky.width / 2), 12 + flota);
    ctx.drawImage(logoDreams, Math.round(ANCHO / 2 - logoDreams.width / 2), 38 + flota);
    const sub = "UN JUEGO DE MONCADAART";
    texto(sub, ANCHO / 2 - anchoTexto(sub) / 2, 68, "#ffb35a", "#16152a");

    const ny = 104 + Math.round(Math.sin(tiempoGlobal * 1.1) * 2);
    ctx.drawImage(nubeTitulo, Math.round(ANCHO / 2 - nubeTitulo.width / 2), ny);
    const respira = S.mono.dormido[Math.floor(tiempoGlobal * 1.2) % 2];
    ctx.drawImage(respira.der, Math.round(ANCHO / 2 - 9), ny - 15);

    dibujarParticulas(0, 0);
    fondo.dibujarFrente(ctx, cx, tiempoGlobal);
  }

  function dibujar() {
    if (estado === "titulo") {
      dibujarTitulo();
      return;
    }

    let sx = 0, sy = 0;
    if (temblor > 0) {
      sx = Math.round((Math.random() - 0.5) * 4);
      sy = Math.round((Math.random() - 0.5) * 4);
    }
    const cx = limitar(Math.round(camara.x) + sx, 0, ANCHO_NIVEL - ANCHO);
    const cy = limitar(Math.round(camara.y) + sy, 0, ALTO_NIVEL - ALTO);

    fondo.dibujar(ctx, cx, tiempoGlobal);
    ctx.drawImage(capaNivel, cx, cy, ANCHO, ALTO, 0, 0, ANCHO, ALTO);
    dibujarMundo(cx, cy);
    dibujarJugador(cx, cy);
    dibujarParticulas(cx, cy);
    fondo.dibujarFrente(ctx, cx, tiempoGlobal);
    dibujarHUD();

    if (fundido > 0) {
      ctx.fillStyle = "rgba(13, 15, 38, " + fundido.toFixed(2) + ")";
      ctx.fillRect(0, 0, ANCHO, ALTO);
    }
  }

  /* -------------------------------------------------------
     INTERFAZ HTML
     ------------------------------------------------------- */
  const ui = {
    inicio: document.getElementById("pantalla-inicio"),
    pausa: document.getElementById("pantalla-pausa"),
    derrota: document.getElementById("pantalla-derrota"),
    victoria: document.getElementById("pantalla-victoria"),
    aviso: document.getElementById("aviso"),
    sonido: document.getElementById("btn-sonido"),
    pausar: document.getElementById("btn-pausa"),
    pantalla: document.getElementById("btn-pantalla")
  };

  function mostrarPantalla(pantalla) {
    [ui.inicio, ui.pausa, ui.derrota, ui.victoria].forEach((p) => { p.hidden = p !== pantalla; });
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
    const total = recogidos.moneda;
    const maximo = totales.moneda;
    document.getElementById("res-monedas").textContent = total + "/" + maximo;
    document.getElementById("res-tiempo").textContent = formatoTiempo(tiempoPartida);
    document.getElementById("res-vidas").textContent = jugador.vidas + "/" + VIDAS;
    document.getElementById("res-mensaje").textContent = total === maximo
      ? "¡Sueño perfecto! Reuniste todas las monedas."
      : "Reuniste " + total + " de " + maximo + " monedas. Aún quedan algunas por descubrir.";
    mostrarPantalla(ui.victoria);
  }

  function iniciarPartida() {
    Snd.activar();
    Snd.reproducir("boton");
    soltarTodo();
    reiniciarNivel();
    estado = "jugando";
    fundido = 1;
    mostrarPantalla(null);
    mostrarAviso("Reúne monedas y llega al despertador. ¡Cuidado con los bichos!");
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
    actualizarBotonSonido(Snd.alternarSilencio());
  }

  function actualizarBotonSonido(silencio) {
    ui.sonido.setAttribute("aria-pressed", String(silencio));
    ui.sonido.setAttribute("aria-label", silencio ? "Activar sonido" : "Silenciar sonido");
    ui.sonido.classList.toggle("apagado", silencio);
  }

  /* Pantalla completa (si el navegador la permite) */
  const raiz = document.documentElement;
  const pantallaCompletaDisponible = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled) &&
    !!(raiz.requestFullscreen || raiz.webkitRequestFullscreen);

  function pantallaCompletaActiva() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }

  function alternarPantallaCompleta() {
    if (!pantallaCompletaDisponible) return;
    try {
      if (pantallaCompletaActiva()) {
        (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      } else {
        const pedir = raiz.requestFullscreen || raiz.webkitRequestFullscreen;
        const promesa = pedir.call(raiz, { navigationUI: "hide" });
        const bloquear = () => {
          if (screen.orientation && screen.orientation.lock) screen.orientation.lock("landscape").catch(() => {});
        };
        if (promesa && promesa.then) promesa.then(bloquear).catch(() => mostrarAviso("Tu navegador no permitió la pantalla completa"));
        else bloquear();
      }
    } catch (error) {
      mostrarAviso("Tu navegador no permitió la pantalla completa");
    }
  }

  function actualizarBotonPantalla() {
    const activa = pantallaCompletaActiva();
    ui.pantalla.classList.toggle("activa", activa);
    ui.pantalla.setAttribute("aria-label", activa ? "Salir de pantalla completa" : "Pantalla completa");
    requestAnimationFrame(actualizarEscala);
  }

  ui.pantalla.hidden = !pantallaCompletaDisponible;
  document.addEventListener("fullscreenchange", actualizarBotonPantalla);
  document.addEventListener("webkitfullscreenchange", actualizarBotonPantalla);

  document.querySelectorAll("[data-accion]").forEach((boton) => {
    boton.addEventListener("click", () => {
      const accion = boton.getAttribute("data-accion");
      if (accion === "jugar") iniciarPartida();
      else if (accion === "pausa" || accion === "continuar") alternarPausa();
      else if (accion === "sonido") alternarSonido();
      else if (accion === "pantalla") alternarPantallaCompleta();
      else if (accion === "inicio") {
        estado = "titulo";
        soltarTodo();
        mostrarPantalla(ui.inicio);
      }
    });
  });

  actualizarBotonSonido(Snd.estaSilenciado());

  /* Tamaño de un "pixel del juego" en la pantalla, para que la
     interfaz HTML use exactamente la misma retícula. */
  function actualizarEscala() {
    const r = lienzo.getBoundingClientRect();
    if (!r.width) return;
    const px = Math.max(2, Math.round((r.width / ANCHO) * 2) / 2);
    raiz.style.setProperty("--px", px + "px");
  }
  window.addEventListener("resize", actualizarEscala);
  if (window.ResizeObserver) new ResizeObserver(actualizarEscala).observe(lienzo);
  actualizarEscala();

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
      w: jugador.w, h: jugador.h, enSuelo: jugador.enSuelo, vidas: jugador.vidas
    }),
    recogidos: () => Object.assign({}, recogidos),
    totales: () => Object.assign({}, totales),
    entrada: () => ({ izq: entrada.izq, der: entrada.der, saltar: entrada.saltar }),
    plataformas: () => plataformas.map((p) => ({ x: p.x, y: p.y, w: p.w })),
    enemigos: () => enemigos
      .filter((e) => e.vivo && !(e.aplastado > 0))
      .map((e) => ({ tipo: e.tipo, x: e.x, y: e.y, w: e.w, h: e.h })),
    pantallaCompletaDisponible: pantallaCompletaDisponible,
    nivel: { columnas: COLS, filas: FILAS }
  };

  /* Herramientas de prueba: solo existen con ?depurar en la URL */
  if (new URLSearchParams(window.location.search).has("depurar")) {
    window.MonkyDreams.depurar = {
      teletransportar(columna, fila) {
        colocarJugador({ x: columna * T + 3, y: (fila + 1) * T - jugador.h });
        actualizarCamara(0, true);
      },
      quitarVida() {
        jugador.invul = 0;
        herir(jugador.x + jugador.w);
      }
    };
  }
})();
