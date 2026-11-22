/* =========================================================
   MONKY RUN — FÍSICA
   Movimiento, salto y colisiones. Lo usan el juego y las
   pruebas de alcance del nivel, así ambos coinciden siempre.
   ========================================================= */

(function (raiz) {
  "use strict";

  const T = 16;

  const FIS = {
    acel: 980,
    acelAire: 760,
    friccion: 1250,
    friccionAire: 420,
    giro: 1400,        // frenado extra al cambiar de dirección en el suelo
    vmax: 118,
    grav: 1180,
    gravCaida: 1500,
    gravApice: 820,    // gravedad suave en el punto más alto (salto "flotante")
    salto: -382,
    corte: -150,
    caidaMax: 410,
    coyote: 0.1,
    buffer: 0.14,
    rebote: -250,
    reboteAlto: -350
  };

  const JUGADOR = { w: 10, h: 18 };

  function crearMundo(mapa) {
    const filas = mapa.length;
    const columnas = mapa.reduce((max, fila) => Math.max(max, fila.length), 0);

    function casilla(cx, cy) {
      if (cx < 0 || cx >= columnas) return "#"; // paredes invisibles a los lados
      if (cy < 0 || cy >= filas) return ".";
      const ch = mapa[cy][cx] || ".";
      return "#B-^".indexOf(ch) >= 0 ? ch : ".";
    }

    return {
      filas: filas,
      columnas: columnas,
      ancho: columnas * T,
      alto: filas * T,
      casilla: casilla,
      esSolida: (ch) => ch === "#" || ch === "B"
    };
  }

  function resolverX(e, dx, mundo) {
    const y0 = Math.floor(e.y / T);
    const y1 = Math.floor((e.y + e.h - 0.001) / T);
    const x0 = Math.floor(e.x / T);
    const x1 = Math.floor((e.x + e.w - 0.001) / T);

    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        if (!mundo.esSolida(mundo.casilla(cx, cy))) continue;
        if (dx > 0) e.x = cx * T - e.w;
        else if (dx < 0) e.x = (cx + 1) * T;
        else if (e.x + e.w / 2 < cx * T + T / 2) e.x = cx * T - e.w;
        else e.x = (cx + 1) * T;
        e.vx = 0;
        return true;
      }
    }
    return false;
  }

  /* Plataformas atravesables ("-"):
     pies: { margen, tolerancia } opcional (Carrera infinita).
     - margen: px extra a cada lado para apoyar los pies (el dibujo de los pies
       de Monky es más ancho que su caja de choque).
     - tolerancia: px por debajo de la superficie en que todavía se aterriza al
       bajar (si el salto termina con los pies apenas dentro de la nube). */
  function resolverY(e, pieAntes, mundo, plataformas, pies) {
    const x0 = Math.floor(e.x / T);
    const x1 = Math.floor((e.x + e.w - 0.001) / T);
    const y0 = Math.floor(e.y / T);
    const y1 = Math.floor((e.y + e.h - 0.001) / T);
    let golpeCabeza = false;

    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        const ch = mundo.casilla(cx, cy);
        if (mundo.esSolida(ch)) {
          if (e.vy > 0) {
            e.y = cy * T - e.h;
            e.enSuelo = true;
          } else if (e.vy < 0) {
            e.y = (cy + 1) * T;
            golpeCabeza = true;
          }
          e.vy = 0;
          return golpeCabeza;
        }
        if (!pies && ch === "-" && e.vy >= 0 && pieAntes <= cy * T + 0.5 && e.y + e.h >= cy * T) {
          e.y = cy * T - e.h;
          e.vy = 0;
          e.enSuelo = true;
          return false;
        }
      }
    }

    if (pies && e.vy >= 0 && aterrizarEnNube(e, pieAntes, mundo, pies)) return false;

    if (e.vy >= 0 && plataformas) {
      for (const p of plataformas) {
        const encima = e.x < p.x + p.w && e.x + e.w > p.x;
        if (encima && pieAntes <= p.y + 0.5 && e.y + e.h >= p.y) {
          e.y = p.y - e.h;
          e.vy = 0;
          e.enSuelo = true;
          e.sobre = p;
          return false;
        }
      }
    }
    return false;
  }

  function aterrizarEnNube(e, pieAntes, mundo, pies) {
    const pie = e.y + e.h;
    const cx0 = Math.floor((e.x - pies.margen) / T);
    const cx1 = Math.floor((e.x + e.w + pies.margen - 0.001) / T);
    // Filas cuya superficie cruzaron los pies en este paso (o dentro de la tolerancia)
    const cy0 = Math.floor((pieAntes - pies.tolerancia) / T);
    const cy1 = Math.floor(pie / T);
    for (let cy = Math.max(0, cy0); cy <= cy1; cy++) {
      const sup = cy * T;
      if (pieAntes > sup + pies.tolerancia || pie < sup) continue;
      for (let cx = cx0; cx <= cx1; cx++) {
        if (mundo.casilla(cx, cy) !== "-") continue;
        // La cabeza no debe quedar dentro de un bloque al subir a la nube
        const y = sup - e.h;
        const prueba = { x: e.x, y: y, w: e.w, h: e.h };
        if (!libre(prueba, mundo)) continue;
        e.y = y;
        e.vy = 0;
        e.enSuelo = true;
        return true;
      }
    }
    return false;
  }

  function libre(r, mundo) {
    const x0 = Math.floor(r.x / T), x1 = Math.floor((r.x + r.w - 0.001) / T);
    const y0 = Math.floor(r.y / T), y1 = Math.floor((r.y + r.h - 0.001) / T);
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) if (mundo.esSolida(mundo.casilla(cx, cy))) return false;
    return true;
  }

  /* Un paso de física del jugador.
     entrada: { dir: -1|0|1, saltoSostenido: bool }
     Devuelve eventos para sonido y efectos. */
  function pasoJugador(j, entrada, dt, mundo, plataformas) {
    const ev = { salto: false, aterrizo: false, vyAterrizaje: 0, golpeCabeza: false, giro: false };
    const dir = j.dolor > 0 ? 0 : entrada.dir;

    if (dir !== 0) {
      const acel = j.enSuelo ? FIS.acel : FIS.acelAire;
      if (j.enSuelo && j.vx !== 0 && Math.sign(j.vx) !== dir) {
        j.vx += dir * FIS.giro * dt;
        ev.giro = Math.abs(j.vx) > 60;
      }
      j.vx += dir * acel * dt;
      j.dir = dir;
    } else {
      const friccion = (j.enSuelo ? FIS.friccion : FIS.friccionAire) * dt;
      j.vx = Math.abs(j.vx) <= friccion ? 0 : j.vx - Math.sign(j.vx) * friccion;
    }
    j.vx = Math.max(-FIS.vmax, Math.min(FIS.vmax, j.vx));

    j.coyote = j.enSuelo ? FIS.coyote : j.coyote - dt;
    j.buffer -= dt;

    if (j.buffer > 0 && j.coyote > 0) {
      j.vy = FIS.salto;
      j.enSuelo = false;
      j.sobre = null;
      j.coyote = 0;
      j.buffer = 0;
      ev.salto = true;
    }

    if (!entrada.saltoSostenido && j.vy < FIS.corte) j.vy = FIS.corte;

    let gravedad = j.vy > 0 ? FIS.gravCaida : FIS.grav;
    if (entrada.saltoSostenido && Math.abs(j.vy) < 60) gravedad = FIS.gravApice;
    j.vy = Math.min(FIS.caidaMax, j.vy + gravedad * dt);

    const arrastre = j.sobre ? j.sobre.dx : 0;
    const dx = j.vx * dt + arrastre;
    j.x += dx;
    resolverX(j, dx, mundo);

    const pieAntes = j.y + j.h;
    const vyAntes = j.vy;
    const estabaEnSuelo = j.enSuelo;
    j.y += j.vy * dt;
    j.enSuelo = false;
    j.sobre = null;
    ev.golpeCabeza = resolverY(j, pieAntes, mundo, plataformas);

    if (j.enSuelo && !estabaEnSuelo) {
      ev.aterrizo = true;
      ev.vyAterrizaje = vyAntes;
    }
    return ev;
  }

  /* =======================================================
     CARRERA INFINITA: Monky corre solo hacia la derecha.
     entrada: { pulsoSalto, saltoSostenido, abajo }
     Alturas: de pie 18 px, deslizándose 12 px.
     ======================================================= */
  const ALTO_PIE = 18;
  const ALTO_DESLIZ = 12;
  // Pies de Monky sobre las nubes: el dibujo sobresale 2 px de la caja por lado y el
  // salto puede terminar con los pies hasta 6 px dentro de la nube.
  const PIES_CORREDOR = { margen: 2, tolerancia: 6 };

  function cabeLevantarse(j, mundo) {
    const prueba = { x: j.x, y: j.y + j.h - ALTO_PIE, w: j.w, h: ALTO_PIE };
    const x0 = Math.floor(prueba.x / T), x1 = Math.floor((prueba.x + prueba.w - 0.001) / T);
    const y0 = Math.floor(prueba.y / T), y1 = Math.floor((prueba.y + prueba.h - 0.001) / T);
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        if (mundo.esSolida(mundo.casilla(cx, cy))) return false;
      }
    }
    return true;
  }

  function cambiarAltura(j, alto) {
    j.y += j.h - alto;
    j.h = alto;
  }

  function pasoCorredor(j, entrada, dt, mundo, vel) {
    const ev = { salto: false, dobleSalto: false, aterrizo: false, vyAterrizaje: 0, choque: false, deslizo: false };

    // Deslizarse (en el suelo) o caer rápido (en el aire)
    if (entrada.abajo && j.enSuelo) {
      if (!j.deslizando) { cambiarAltura(j, ALTO_DESLIZ); j.deslizando = true; ev.deslizo = true; }
    } else if (j.deslizando && cabeLevantarse(j, mundo)) {
      cambiarAltura(j, ALTO_PIE);
      j.deslizando = false;
    }
    if (entrada.abajo && !j.enSuelo && j.vy < 240) j.vy = Math.max(j.vy, 240);

    j.coyote = j.enSuelo ? FIS.coyote : j.coyote - dt;
    j.buffer -= dt;
    if (entrada.pulsoSalto) j.buffer = FIS.buffer;

    const puedeSaltar = !j.deslizando || cabeLevantarse(j, mundo);
    if (j.buffer > 0 && puedeSaltar) {
      if (j.coyote > 0) {
        if (j.deslizando) { cambiarAltura(j, ALTO_PIE); j.deslizando = false; }
        j.vy = FIS.salto;
        j.enSuelo = false;
        j.coyote = 0;
        j.buffer = 0;
        ev.salto = true;
      } else if (j.saltosExtra > 0 && entrada.pulsoSalto) {
        j.vy = FIS.salto * 0.88;
        j.saltosExtra--;
        j.buffer = 0;
        ev.dobleSalto = true;
      }
    }

    if (!entrada.saltoSostenido && j.vy < FIS.corte) j.vy = FIS.corte;
    let gravedad = j.vy > 0 ? FIS.gravCaida : FIS.grav;
    if (entrada.saltoSostenido && Math.abs(j.vy) < 60) gravedad = FIS.gravApice;
    j.vy = Math.min(FIS.caidaMax, j.vy + gravedad * dt);

    j.vx = vel;
    const dx = vel * dt;
    const xAntes = j.x;
    j.x += dx;
    resolverX(j, dx, mundo);
    if (j.x < xAntes + dx - 0.01) ev.choque = true;
    j.vx = vel;

    const pieAntes = j.y + j.h;
    const vyAntes = j.vy;
    const estaba = j.enSuelo;
    j.y += j.vy * dt;
    j.enSuelo = false;
    resolverY(j, pieAntes, mundo, null, PIES_CORREDOR);
    if (j.enSuelo) {
      j.saltosExtra = j.dobleSalto ? 1 : 0;
      if (!estaba) { ev.aterrizo = true; ev.vyAterrizaje = vyAntes; }
    }
    return ev;
  }

  function crearCorredor(x, ySuelo) {
    return {
      x: x, y: ySuelo - ALTO_PIE, w: 10, h: ALTO_PIE,
      vx: 0, vy: 0, dir: 1, enSuelo: true, sobre: null,
      coyote: FIS.coyote, buffer: 0, dolor: 0,
      deslizando: false, saltosExtra: 0, dobleSalto: false
    };
  }

  function clonar(j) {
    return Object.assign({}, j);
  }

  function crearJugador(x, y) {
    return {
      x: x, y: y, w: JUGADOR.w, h: JUGADOR.h,
      vx: 0, vy: 0, dir: 1,
      enSuelo: false, sobre: null,
      coyote: 0, buffer: 0, dolor: 0
    };
  }

  raiz.MonkyFisica = {
    T: T,
    FIS: FIS,
    JUGADOR: JUGADOR,
    crearMundo: crearMundo,
    crearJugador: crearJugador,
    resolverX: resolverX,
    resolverY: resolverY,
    pasoJugador: pasoJugador,
    pasoCorredor: pasoCorredor,
    crearCorredor: crearCorredor,
    cabeLevantarse: cabeLevantarse,
    clonar: clonar,
    ALTO_PIE: ALTO_PIE,
    ALTO_DESLIZ: ALTO_DESLIZ,
    PIES_CORREDOR: PIES_CORREDOR
  };
})(typeof window !== "undefined" ? window : globalThis);
