/* =========================================================
   MONKY RUN — MODO AVENTURA
   El nivel "El primer boceto" de la versión 2.0, conservado
   como modo de juego. Se adapta a cualquier tamaño de
   pantalla (la cámara muestra más cielo si hay espacio).
   ========================================================= */

window.MonkyAventura = function (deps) {
  "use strict";

  const VIDAS = 3;
  const INVULNERABLE = 1.5;
  const F = window.MonkyFisica;
  const T = F.T;
  const FIS = F.FIS;
  const S = deps.sprites;
  const ESC = window.MonkyEscenario;
  const Snd = window.MonkySonido;
  const HUD = window.MonkyHUD;
  const E = deps.entrada;

  let ctx = null;
  let ANCHO = 320;
  let ALTO = 180;

  const limitar = (v, min, max) => Math.max(min, Math.min(max, v));
  const solapan = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const azar = (min, max) => min + Math.random() * (max - min);
  const dibujarTexto = (cadena, x, y, color, sombra, escala) => HUD.texto(ctx, cadena, x, y, color, sombra, escala);
  const anchoTexto = HUD.anchoTexto;

  const MAPA = window.MonkyNivel.mapa;
  const mundo = F.crearMundo(MAPA);
  const FILAS = mundo.filas;
  const COLS = mundo.columnas;
  const ANCHO_NIVEL = mundo.ancho;
  const ALTO_NIVEL = mundo.alto;
  const casilla = mundo.casilla;
  const esSolida = mundo.esSolida;

  const capaNivel = ESC.construirCapaNivel(MAPA, { tema: "cuaderno" });
  const fondo = ESC.construirFondo("cuaderno", 0);
  const halo = HUD.halo(S.crearCanvas, 18, "rgba(255, 214, 120, 0.2)");

  /* -------------------------------------------------------
     ESTADO DEL JUEGO
     ------------------------------------------------------- */
  let estado = "inactivo";
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
          // Zona de meta: toda la columna del reloj de entrega (también cuenta pasar por encima)
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
     JUGADOR
     ------------------------------------------------------- */
  function actualizarJugador(dt) {
    const j = jugador;
    if (E.tomarPulso()) j.buffer = FIS.buffer;
    const dir = (E.der ? 1 : 0) - (E.izq ? 1 : 0);
    const ev = F.pasoJugador(j, { dir: dir, saltoSostenido: E.saltar }, dt, mundo, plataformas);

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
    deps.aviso("¡Uy! Vuelves a la última lámpara");
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
        j.vy = E.saltar ? FIS.reboteAlto : FIS.rebote;
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
        deps.aviso("Lámpara encendida: punto de control");
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
    camara.y = limitar(camara.y, Math.min(0, ALTO_NIVEL - ALTO), Math.max(0, ALTO_NIVEL - ALTO));
  }

  /* -------------------------------------------------------
     ACTUALIZACIÓN GENERAL
     ------------------------------------------------------- */
  let relojZetas = 0;

  function actualizar(dt) {
    tiempoGlobal += dt;
    temblor = Math.max(0, temblor - dt);
    fundido = Math.max(0, fundido - dt * 2.5);

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
        estado = "fin";
        deps.fin({ tipo: "derrota" });
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
        estado = "fin";
        deps.fin({ tipo: "victoria", monedas: recogidos.moneda, total: totales.moneda, tiempo: tiempoPartida, vidas: jugador.vidas, vidasMax: VIDAS });
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
        dibujarTexto("Z", x, y, p.color, "#16152a");
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
        if (e.vida > 0.15 || Math.floor(e.vida * 30) % 2) dibujarTexto(e.contenido, x, y, "#ffe08a", "#16152a");
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

  /* HUD: corazones y monedas juntos arriba a la izquierda, lejos de los botones */
  function dibujarHUD() {
    panel(3, 3, 33, 13);
    for (let i = 0; i < VIDAS; i++) {
      const sacude = temblor > 0 && i === jugador.vidas ? Math.round(Math.random() * 2 - 1) : 0;
      dibujarSprite(i < jugador.vidas ? S.corazon : S.corazonVacio, 6 + i * 9 + sacude, 6, false);
    }

    const etiqueta = recogidos.moneda + "/" + totales.moneda;
    const ancho = 12 + 4 + anchoTexto(etiqueta) + 5;
    panel(39, 3, ancho, 13);
    ctx.drawImage(S.moneda[Math.floor(tiempoGlobal * 8) % 8].der, 40, 3);
    const completo = recogidos.moneda === totales.moneda;
    dibujarTexto(etiqueta, 55, 7, completo ? "#ffe08a" : "#fff7e8", "#16152a");
  }

  function dibujar() {
    let sx = 0, sy = 0;
    if (temblor > 0) {
      sx = Math.round((Math.random() - 0.5) * 4);
      sy = Math.round((Math.random() - 0.5) * 4);
    }
    const cx = limitar(Math.round(camara.x) + sx, 0, ANCHO_NIVEL - ANCHO);
    const cy = limitar(Math.round(camara.y) + sy, Math.min(0, ALTO_NIVEL - ALTO), Math.max(0, ALTO_NIVEL - ALTO));

    fondo.dibujar(ctx, cx, tiempoGlobal, ANCHO, ALTO);
    ctx.drawImage(capaNivel, -cx, -cy);
    dibujarMundo(cx, cy);
    dibujarJugador(cx, cy);
    dibujarParticulas(cx, cy);
    fondo.dibujarFrente(ctx, cx, tiempoGlobal, ANCHO, ALTO);
    dibujarHUD();

    if (fundido > 0) {
      ctx.fillStyle = "rgba(13, 15, 38, " + fundido.toFixed(2) + ")";
      ctx.fillRect(0, 0, ANCHO, ALTO);
    }
  }

  /* -------------------------------------------------------
     INTERFAZ DEL MODO
     ------------------------------------------------------- */
  function iniciar() {
    reiniciarNivel();
    estado = "jugando";
    fundido = 1;
    deps.aviso("Reúne monedas y llega al reloj de entrega. ¡Cuidado con los bichos!");
  }

  return {
    nombre: "aventura",
    iniciar: iniciar,
    actualizar(dt) { actualizar(dt); },
    dibujar(c, W, H) {
      ctx = c; ANCHO = W; ALTO = H;
      dibujar();
    },
    estado: () => estado,
    depuracion: {
      estado: () => estado,
      jugador: () => ({ x: jugador.x, y: jugador.y, vx: jugador.vx, vy: jugador.vy, w: jugador.w, h: jugador.h, enSuelo: jugador.enSuelo, vidas: jugador.vidas }),
      recogidos: () => Object.assign({}, recogidos),
      totales: () => Object.assign({}, totales),
      plataformas: () => plataformas.map((p) => ({ x: p.x, y: p.y, w: p.w })),
      enemigos: () => enemigos.filter((e) => e.vivo && !(e.aplastado > 0)).map((e) => ({ tipo: e.tipo, x: e.x, y: e.y, w: e.w, h: e.h })),
      nivel: { columnas: COLS, filas: FILAS },
      teletransportar(columna, fila) {
        colocarJugador({ x: columna * T + 3, y: (fila + 1) * T - jugador.h });
        actualizarCamara(0, true);
      },
      quitarVida() { jugador.invul = 0; herir(jugador.x + jugador.w); }
    }
  };
};
