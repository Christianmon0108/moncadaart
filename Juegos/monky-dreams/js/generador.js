/* =========================================================
   MONKY DREAMS — GENERADOR DE TRAMOS (Carrera infinita)

   Crea tramos de terreno nuevos según la distancia recorrida
   y comprueba con la física real de Monky (fisica.js) que
   cada tramo se pueda superar sin recibir daño. Si un tramo
   no se puede superar, se descarta y se genera otro.

   Cada tramo es un pequeño mapa de 12 filas (como el modo
   Aventura) más una lista de entidades (enemigos, láseres,
   monedas y poderes). Las entidades se mueven según el
   avance de Monky, así el validador y el juego coinciden.
   ========================================================= */

(function (raiz) {
  "use strict";

  const F = raiz.MonkyFisica;
  const T = F.T;
  const FILAS = 12;
  const FILA_BASE = 10;          // superficie del suelo con altura 0
  const METRO = 16;              // 1 metro = 16 px = 1 casilla
  const ACTIVACION = 300;        // px antes de una entidad en que empieza a moverse
  const DT = 1 / 60;

  /* -------------------------------------------------------
     MUNDOS: cambian cada 500 m y se repiten en ciclo
     ------------------------------------------------------- */
  const MUNDOS = ["noche", "bosque", "digital", "pesadilla"];
  const LARGO_MUNDO = 500;

  function mundoEn(metros) {
    return MUNDOS[Math.floor(metros / LARGO_MUNDO) % MUNDOS.length];
  }

  function cicloEn(metros) {
    return Math.floor(metros / (LARGO_MUNDO * MUNDOS.length));
  }

  /* Velocidad: sube rápido al principio y se estabiliza */
  function velocidad(metros) {
    return 118 + 86 * (1 - Math.exp(-metros / 1400));
  }

  /* Dificultad de 0 a 1 */
  function dificultad(metros) {
    return Math.min(1, metros / 2600);
  }

  /* -------------------------------------------------------
     AZAR CON SEMILLA (cada partida distinta, reproducible)
     ------------------------------------------------------- */
  function crearAzar(semilla) {
    let a = semilla >>> 0;
    const f = function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    f.entre = (min, max) => min + Math.floor(f() * (max - min + 1));
    f.elegir = (lista) => lista[Math.floor(f() * lista.length)];
    return f;
  }

  /* -------------------------------------------------------
     ENTIDADES: posición según el avance de Monky
     ------------------------------------------------------- */
  const DEF = {
    bicho:   { w: 14, h: 10, pisable: true },
    hongo:   { w: 14, h: 14, pisable: true },
    tronco:  { w: 14, h: 14, pisable: false },
    polilla: { w: 12, h: 10, pisable: true },
    dron:    { w: 14, h: 10, pisable: false },
    cuervo:  { w: 14, h: 10, pisable: false },
    laser:   { w: 16, h: 4,  pisable: false }
  };

  function posicion(e, px, vel) {
    const t = Math.max(0, (px - (e.x - ACTIVACION)) / vel);
    let x = e.x, y = e.y;
    switch (e.tipo) {
      case "bicho": {
        const ancho = e.xmax - e.xmin;
        let d = (t * 30) % (ancho * 2);
        x = d < ancho ? e.x - d : e.x - (ancho * 2 - d);
        x = Math.max(e.xmin, Math.min(e.xmax, x));
        break;
      }
      case "hongo": {
        const fase = (t + e.fase) % 1.4;
        y = e.y - (fase < 0.6 ? Math.sin((Math.PI * fase) / 0.6) * 26 : 0);
        break;
      }
      case "tronco":
        x = e.x - t * 55;
        break;
      case "polilla":
        x = e.x - t * 18;
        y = e.y + Math.sin(t * 2.2 + e.fase) * 8;
        break;
      case "dron":
        y = e.y + Math.sin(t * 2.4 + e.fase) * 18;
        break;
      case "cuervo": {
        x = e.x - t * 70;
        const rel = (x - px - 34) / 34;
        y = e.y + 34 * Math.exp(-rel * rel);
        break;
      }
    }
    return { x: x, y: y, w: e.w, h: e.h, t: t };
  }

  /* Copia del estado de Monky sin el registro del recorrido */
  function limpiar(j) {
    const c = F.clonar(j);
    delete c.camino; delete c.decisiones; delete c.fin;
    c.muertos = 0;
    c.nubes = 0;
    return c;
  }

  const solapan = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  /* -------------------------------------------------------
     CONSTRUCTOR DE TRAMOS
     ------------------------------------------------------- */
  function Constructor(ancho, hEntrada) {
    this.ancho = ancho;
    this.filas = [];
    for (let i = 0; i < FILAS; i++) this.filas.push(new Array(ancho).fill("."));
    this.entidades = [];
    this.hEntrada = hEntrada;
    this.hSalida = hEntrada;
  }

  Constructor.prototype.suelo = function (c0, c1, h) {
    for (let c = Math.max(0, c0); c <= Math.min(this.ancho - 1, c1); c++) {
      for (let f = FILA_BASE - h; f < FILAS; f++) this.filas[f][c] = "#";
    }
  };
  Constructor.prototype.poner = function (c, f, ch) {
    if (c >= 0 && c < this.ancho && f >= 0 && f < FILAS) this.filas[f][c] = ch;
  };
  Constructor.prototype.entidad = function (tipo, c, f, extra) {
    const d = DEF[tipo];
    const e = Object.assign({ tipo: tipo, w: d.w, h: d.h, pisable: d.pisable, fase: 0 }, extra || {});
    e.cx = c; e.cy = f;
    this.entidades.push(e);
    return e;
  };
  Constructor.prototype.mapa = function () {
    return this.filas.map((f) => f.join(""));
  };

  const superficie = (h) => FILA_BASE - h; // fila donde empieza el suelo

  /* -------------------------------------------------------
     ALCANCE DEL SALTO a una velocidad dada (con la física real)
     ------------------------------------------------------- */
  const cacheAlcance = new Map();
  function alcanceSalto(vel) {
    const clave = Math.round(vel);
    if (cacheAlcance.has(clave)) return cacheAlcance.get(clave);
    // Simula un salto completo sobre suelo plano y mide la distancia horizontal
    const mundo = F.crearMundo(["....................................................................................................", ...new Array(10).fill(".".repeat(100)), "#".repeat(100)]);
    const j = F.crearCorredor(16, 11 * T);
    let x0 = j.x, aire = false, distancia = 0;
    for (let f = 0; f < 120; f++) {
      F.pasoCorredor(j, { pulsoSalto: f === 0, saltoSostenido: true, abajo: false }, DT, mundo, clave);
      if (!j.enSuelo) aire = true;
      else if (aire) { distancia = j.x - x0; break; }
    }
    cacheAlcance.set(clave, distancia);
    return distancia;
  }

  /* Trayectoria de un salto completo (sosteniendo) desde suelo plano:
     lista de [dx, altura de los pies sobre el despegue, vy] por cuadro */
  const cacheArco = new Map();
  function arcoSalto(vel) {
    const clave = Math.round(vel);
    if (cacheArco.has(clave)) return cacheArco.get(clave);
    const filas = ["." .repeat(100)];
    for (let i = 0; i < 10; i++) filas.push(".".repeat(100));
    filas.push("#".repeat(4) + ".".repeat(96)); // despega del borde y cae al vacío
    const mundo = F.crearMundo(filas);
    const j = F.crearCorredor(50, 11 * T);
    const x0 = j.x, pie0 = j.y + j.h;
    const arco = [];
    for (let f = 0; f < 90; f++) {
      F.pasoCorredor(j, { pulsoSalto: f === 0, saltoSostenido: f < 26, abajo: false }, DT, mundo, clave);
      arco.push([j.x - x0, pie0 - (j.y + j.h), j.vy]);
    }
    cacheArco.set(clave, arco);
    return arco;
  }

  /* Distancia horizontal desde el despegue hasta que los pies bajan a "altura" px
     sobre el punto de despegue (null si el salto no llega tan alto) */
  function bajadaSalto(vel, altura) {
    const arco = arcoSalto(vel);
    let subio = false;
    for (const [dx, h, vy] of arco) {
      if (h > altura + 2) subio = true;
      if (subio && vy > 0 && h <= altura) return dx;
    }
    return null;
  }

  /* Hueco máximo justo (en casillas) a esta velocidad */
  function huecoMaximo(vel, d) {
    const seguro = (alcanceSalto(vel) * (0.58 + 0.12 * d)) / T;
    return Math.max(2, Math.floor(seguro));
  }

  /* -------------------------------------------------------
     PATRONES
     Cada patrón recibe (k = constructor, c = columna inicial,
     h = altura actual, ctx) y devuelve { c, h } finales.
     ------------------------------------------------------- */
  const PATRONES = {
    llano(k, c, h, ctx) {
      const largo = ctx.azar.entre(5, 8);
      k.suelo(c, c + largo - 1, h);
      if (ctx.azar() < 0.5) k.poner(c + ctx.azar.entre(1, largo - 2), superficie(h) - 1, ctx.azar() < 0.5 ? "f" : "g");
      return { c: c + largo, h: h };
    },

    hueco(k, c, h, ctx) {
      const g = ctx.azar.entre(2, huecoMaximo(ctx.vel, ctx.d));
      let h2 = h;
      if (ctx.d > 0.15 && ctx.azar() < 0.4) h2 = Math.max(0, Math.min(2, h + (ctx.azar() < 0.5 ? 1 : -1)));
      // Subir y cruzar a la vez es más difícil: el hueco se acorta
      const ancho = h2 > h ? Math.max(2, g - 1) : g;
      k.suelo(c + ancho, c + ancho + 3, h2);
      return { c: c + ancho + 4, h: h2 };
    },

    escalon(k, c, h, ctx) {
      let h2 = h < 2 && ctx.azar() < 0.6 ? h + 1 : Math.max(0, h - ctx.azar.entre(1, 2));
      if (h2 === h) h2 = h === 0 ? 1 : 0;
      k.suelo(c, c + 1, h);
      k.suelo(c + 2, c + 6, h2);
      return { c: c + 7, h: h2 };
    },

    puas(k, c, h, ctx) {
      const n = ctx.d > 0.5 && ctx.azar() < 0.5 ? ctx.azar.entre(2, 3) : ctx.azar.entre(1, 2);
      const largo = n + 6;
      k.suelo(c, c + largo - 1, h);
      for (let i = 0; i < n; i++) k.poner(c + 3 + i, superficie(h) - 1, "^");
      return { c: c + largo, h: h };
    },

    nubes(k, c, h, ctx) {
      // Nubes colocadas donde el salto real de Monky baja a su altura (a la velocidad
      // actual). El validador exige además aterrizar en cada nube (ver resolver).
      const s = superficie(h);
      let filas = ctx.d > 0.4 && ctx.azar() < 0.45 ? 3 : 2;
      if (bajadaSalto(ctx.vel, filas * T) === null) filas = 2;
      const largo = ctx.d > 0.6 && ctx.azar() < 0.4 ? 2 : 3;
      k.suelo(c, c + 2, h);
      // Despegue cómodo: la punta del pie de Monky en el borde del suelo
      const despegue = (c + 3) * T - 12;
      const n0 = Math.max(c + 4, Math.floor((despegue + bajadaSalto(ctx.vel, filas * T) - 6) / T));
      for (let i = 0; i < largo; i++) k.poner(n0 + i, s - filas, "-");
      let fin = n0 + largo, fila = s - filas;
      // Segunda nube (más adelante en el juego): a la misma altura o una casilla más arriba
      if (ctx.d > 0.25 && ctx.azar() < 0.55) {
        const sube = fila > 3 && ctx.azar() < 0.5 ? 1 : 0;
        const d2 = bajadaSalto(ctx.vel, sube * T);
        const m0 = Math.max(fin + 2, Math.floor((fin * T - 12 + d2 - 6) / T));
        for (let i = 0; i < 3; i++) k.poner(m0 + i, fila - sube, "-");
        fin = m0 + 3; fila -= sube;
      }
      // Suelo de llegada: cerca de la última nube
      k.suelo(fin + 1, fin + 4, h);
      return { c: fin + 5, h: h };
    },

    valla(k, c, h, ctx) {
      const alta = ctx.d > 0.3 && ctx.azar() < 0.5 ? 2 : 1;
      k.suelo(c, c + 8, h);
      for (let i = 1; i <= alta; i++) k.poner(c + 4, superficie(h) - i, "B");
      if (alta === 1 && ctx.azar() < 0.4) k.poner(c + 5, superficie(h) - 1, "B");
      return { c: c + 9, h: h };
    },

    techo(k, c, h, ctx) {
      // Techo bajo: solo se pasa deslizándose
      const largo = ctx.azar.entre(3, 5) + (ctx.d > 0.5 ? 1 : 0);
      const s = superficie(h);
      k.suelo(c, c + largo + 7, h);
      for (let i = 0; i < largo; i++) {
        for (let f = s - 2; f >= Math.max(0, s - 4); f--) k.poner(c + 4 + i, f, "B");
      }
      return { c: c + largo + 8, h: h, deslizar: true };
    },

    terrestre(k, c, h, ctx) {
      const s = superficie(h);
      const largo = 10;
      k.suelo(c, c + largo - 1, h);
      const tipo = ctx.tema === "bosque" ? ctx.azar.elegir(["hongo", "tronco"])
        : ctx.tema === "pesadilla" ? "hongo" : "bicho";
      const x = (c + 7) * T + 1;
      const y = s * T - DEF[tipo].h;
      if (tipo === "bicho") k.entidad(tipo, c + 7, s - 1, { x: x, y: y, xmin: (c + 2) * T, xmax: x });
      else if (tipo === "hongo") k.entidad(tipo, c + 6, s - 1, { x: x - T, y: y, fase: ctx.azar() * 1.4 });
      else k.entidad(tipo, c + 9, s - 1, { x: x + 2 * T, y: y });
      return { c: c + largo, h: h };
    },

    volador(k, c, h, ctx) {
      const s = superficie(h);
      const largo = 11;
      k.suelo(c, c + largo - 1, h);
      const tipo = ctx.tema === "digital" ? "dron" : ctx.tema === "pesadilla" ? "cuervo" : "polilla";
      const ySuelo = s * T;
      if (tipo === "polilla") {
        // A la altura de la cabeza: deslizarse o saltar
        k.entidad(tipo, c + 7, s - 2, { x: (c + 7) * T, y: ySuelo - 25, fase: ctx.azar() * 6 });
      } else if (tipo === "dron") {
        k.entidad(tipo, c + 6, s - 3, { x: (c + 6) * T, y: ySuelo - 44, fase: ctx.azar() * 6 });
      } else {
        k.entidad(tipo, c + 9, s - 5, { x: (c + 9) * T + 60, y: ySuelo - 70 });
      }
      return { c: c + largo, h: h };
    },

    laser(k, c, h, ctx) {
      const s = superficie(h);
      const ySuelo = s * T;
      const largo = 9;
      k.suelo(c, c + largo - 1, h);
      const bajo = ctx.azar() < 0.5;
      const ancho = ctx.azar.entre(1, 2) * T;
      // bajo: hay que saltarlo; alto (a la altura de la cabeza): hay que deslizarse
      k.entidad("laser", c + 4, s - 1, {
        x: (c + 4) * T, y: bajo ? ySuelo - 7 : ySuelo - 17, w: ancho, h: 3, alto: !bajo
      });
      return { c: c + largo, h: h, deslizar: !bajo };
    }
  };

  /* Qué patrones están disponibles según distancia y mundo */
  function catalogo(metros, tema) {
    const lista = [
      ["llano", 2], ["hueco", 4], ["puas", 3], ["escalon", 2]
    ];
    if (metros > 60) lista.push(["terrestre", 3]);
    if (metros > 120) lista.push(["nubes", 2]);
    if (metros > 160) lista.push(["valla", 2]);
    if (metros > 220) lista.push(["techo", 2]);
    if (metros > 280) lista.push(["volador", 3]);
    if (tema === "digital") lista.push(["laser", 4]);
    return lista;
  }

  function elegirPatron(ctx) {
    const lista = catalogo(ctx.metros, ctx.tema);
    const total = lista.reduce((s, [, p]) => s + p, 0);
    let r = ctx.azar() * total;
    for (const [nombre, peso] of lista) {
      if ((r -= peso) <= 0) return nombre;
    }
    return "llano";
  }

  /* -------------------------------------------------------
     MUNDO DE PRUEBA de un tramo (con suelo plano a los lados)
     ------------------------------------------------------- */
  function mundoDeTramo(tramo) {
    const filas = tramo.mapa.length;
    const columnas = tramo.ancho;
    const esSolida = (ch) => ch === "#" || ch === "B";
    function casilla(cx, cy) {
      const local = cx - tramo.x0;
      if (cy < 0) return ".";
      if (cy >= filas) return local >= 0 && local < columnas ? tramo.mapa[filas - 1][local] : "#";
      if (local < 0) return cy >= superficie(tramo.hEntrada) ? "#" : ".";
      // Tras el final solo están garantizadas las 3 casillas llanas de entrada del tramo siguiente
      if (local >= columnas) return local < columnas + 3 && cy >= superficie(tramo.hSalida) ? "#" : ".";
      const ch = tramo.mapa[cy][local];
      return "#B-^".indexOf(ch) >= 0 ? ch : ".";
    }
    return { filas: filas, columnas: columnas, casilla: casilla, esSolida: esSolida, alto: filas * T };
  }

  /* Grupos de nubes de un tramo (casillas "-" contiguas en una fila) */
  function gruposNubes(tramo) {
    const grupos = [];
    tramo.mapa.forEach((fila, cy) => {
      for (let c = 0; c < fila.length; c++) {
        if (fila[c] !== "-") continue;
        const g = grupos.find((g) => g.cy === cy && g.c1 === tramo.x0 + c - 1);
        if (g) g.c1++;
        else grupos.push({ cy: cy, c0: tramo.x0 + c, c1: tramo.x0 + c });
      }
    });
    return grupos;
  }

  /* ¿Sobre qué grupo de nubes está parado Monky? (-1 si no) */
  function nubeBajo(j, grupos) {
    if (!j.enSuelo || !grupos.length) return -1;
    const pie = j.y + j.h;
    const m = F.PIES_CORREDOR.margen;
    for (let i = 0; i < grupos.length; i++) {
      const g = grupos[i];
      if (Math.abs(pie - g.cy * T) > 0.01) continue;
      if (j.x + j.w + m > g.c0 * T && j.x - m < (g.c1 + 1) * T) return i;
    }
    return -1;
  }

  /* Peligros fijos de un tramo: púas */
  function zonasPuas(tramo) {
    const zonas = [];
    tramo.mapa.forEach((fila, cy) => {
      for (let c = 0; c < fila.length; c++) {
        if (fila[c] === "^") zonas.push({ x: (tramo.x0 + c) * T + 2, y: cy * T + 9, w: 12, h: 7 });
      }
    });
    return zonas;
  }

  /* -------------------------------------------------------
     VALIDADOR: busca un recorrido sin daño con la física real
     ------------------------------------------------------- */
  const ACCIONES = [
    { tipo: "correr" },
    { tipo: "saltar", sostener: 4 },
    { tipo: "saltar", sostener: 9 },
    { tipo: "saltar", sostener: 15 },
    { tipo: "saltar", sostener: 26 },
    { tipo: "deslizar", sostener: 24 },
    { tipo: "deslizar", sostener: 48 }
  ];

  function resolver(tramo, vel, opciones) {
    const op = opciones || {};
    const mundo = mundoDeTramo(tramo);
    const puas = zonasPuas(tramo);
    const xFin = (tramo.x0 + tramo.ancho) * T + 6;
    // Cada nube del tramo debe formar parte del recorrido: ninguna es solo decorado
    const nubes = gruposNubes(tramo);
    const todasNubes = (1 << nubes.length) - 1;
    const inicio = op.inicio ? F.clonar(op.inicio) : F.crearCorredor(tramo.x0 * T + 4, superficie(tramo.hEntrada) * T);
    inicio.muertos = 0;
    inicio.nubes = 0;
    inicio.camino = [];
    inicio.decisiones = [];

    let pasos = 0;
    const limite = op.limitePasos || 60000;

    /* Un cuadro de física con todas las comprobaciones de daño.
       Devuelve false si Monky recibe un golpe o cae al vacío. */
    function paso(j, entrada) {
      pasos++;
      const ev = F.pasoCorredor(j, entrada, DT, mundo, vel);
      if (ev.choque) return false;
      if (j.y > mundo.alto + 8) return false;
      if (puas.some((p) => solapan(j, p))) return false;
      for (let i = 0; i < tramo.entidades.length; i++) {
        if (j.muertos & (1 << i)) continue;
        const e = tramo.entidades[i];
        const p = posicion(e, j.x, vel);
        if (!solapan(j, p)) continue;
        if (e.pisable && j.vy > 0 && j.y + j.h - p.y < 10) {
          j.muertos |= 1 << i;
          j.vy = F.FIS.rebote;
          j.enSuelo = false;
        } else {
          return false;
        }
      }
      const n = nubeBajo(j, nubes);
      if (n >= 0) j.nubes |= 1 << n;
      return true;
    }

    const terminado = (j) => j.x >= xFin && j.enSuelo && !j.deslizando;

    function simular(estado, accion, indice) {
      const j = F.clonar(estado);
      j.camino = estado.camino;
      j.decisiones = indice === 0 ? estado.decisiones : estado.decisiones.concat([[estado.x, indice]]);
      let enAire = false;
      const corto = Math.max(2, Math.round(5 / (vel * DT)));
      for (let f = 0; f < 200; f++) {
        // Correr: unos px; si Monky sale de un borde, sigue cayendo hasta tocar suelo
        if (accion.tipo === "correr" && f >= corto && j.enSuelo) return j;
        const entrada = {
          pulsoSalto: accion.tipo === "saltar" && f === 0,
          saltoSostenido: accion.tipo === "saltar" && f < accion.sostener,
          abajo: accion.tipo === "deslizar" && f < accion.sostener
        };
        if (!paso(j, entrada)) return null;
        if (terminado(j)) {
          if (j.nubes !== todasNubes) return null;
          j.fin = true; return j;
        }
        if (!j.enSuelo) enAire = true;
        if (accion.tipo === "saltar" && enAire && j.enSuelo) return j;
        if (accion.tipo === "deslizar" && f >= accion.sostener && !j.deslizando && j.enSuelo) return j;
      }
      return j.enSuelo ? j : null;
    }

    /* Repite un plan cuadro a cuadro igual que el piloto del juego:
       una acción empieza en el primer cuadro con x >= su posición. */
    function reproducir(decisiones, guardar) {
      const j = F.clonar(inicio);
      j.camino = [];
      const cuadros = guardar ? [] : null;
      let accion = null, siguiente = 0;
      for (let f = 0; f < 60 * 30; f++) {
        if (accion) {
          const a = accion.a;
          if ((a.tipo === "saltar" && accion.enAire && j.enSuelo) ||
              (a.tipo === "deslizar" && accion.f > a.sostener && !j.deslizando && j.enSuelo) || accion.f > 200) accion = null;
        }
        let empieza = -1;
        if (!accion && siguiente < decisiones.length && j.x >= decisiones[siguiente][0] - 1e-6) {
          accion = { a: ACCIONES[decisiones[siguiente][1]], f: 0, enAire: false };
          empieza = siguiente++;
        }
        if (cuadros) cuadros.push({ j: F.clonar(j), libre: !accion, empieza: empieza });
        const entrada = { pulsoSalto: false, saltoSostenido: false, abajo: false };
        if (accion) {
          const a = accion.a, k = accion.f++;
          if (a.tipo === "saltar") { entrada.pulsoSalto = k === 0; entrada.saltoSostenido = k < a.sostener; }
          if (a.tipo === "deslizar") entrada.abajo = k < a.sostener;
        }
        if (!paso(j, entrada)) return null;
        if (accion && !j.enSuelo) accion.enAire = true;
        const n = nubeBajo(j, nubes);
        if (f % 3 === 0 || n >= 0 && !(j.camino.length && j.camino[j.camino.length - 1][2] === 2)) {
          j.camino.push([Math.round(j.x), Math.round(j.y), n >= 0 ? 2 : j.enSuelo ? 1 : 0, j.h]);
        }
        if (terminado(j)) {
          if (j.nubes !== todasNubes || siguiente < decisiones.length) return null;
          if (cuadros) cuadros.push({ j: F.clonar(j), libre: true, empieza: -1 });
          return { j: j, cuadros: cuadros };
        }
      }
      return null;
    }

    /* ¿El salto "accion" empezado en el estado s llega a "meta" (cuadro y estado)
       sin daño y exactamente igual que el plan original? */
    function saltoEquivalente(s, accion, cuadrosHasta, meta) {
      const j = F.clonar(s);
      let enAire = false, activa = true, f = 0;
      for (let n = 0; n < cuadrosHasta; n++) {
        if (activa && accion.tipo === "saltar" && enAire && j.enSuelo) activa = false;
        const entrada = { pulsoSalto: activa && f === 0, saltoSostenido: activa && f < accion.sostener, abajo: false };
        if (activa) f++;
        if (!paso(j, entrada)) return false;
        if (activa && !j.enSuelo) enAire = true;
      }
      return !activa && j.enSuelo === meta.enSuelo && Math.abs(j.y - meta.y) < 0.01 && j.vy === meta.vy &&
        j.h === meta.h && j.deslizando === meta.deslizando && j.nubes === meta.nubes && j.muertos === meta.muertos &&
        j.saltosExtra === meta.saltosExtra;
    }

    /* Centra cada salto en su ventana de despegue: el recorrido (y las monedas que
       lo marcan) muestra el salto más cómodo, no el primero que funciona. */
    function centrarSaltos(decisiones) {
      const base = reproducir(decisiones, true);
      if (!base) return decisiones;
      const cuadros = base.cuadros;
      const nuevas = decisiones.map((d) => d.slice());
      for (let i = 0; i < decisiones.length; i++) {
        const accion = ACCIONES[decisiones[i][1]];
        if (accion.tipo !== "saltar") continue;
        const n0 = cuadros.findIndex((c) => c.empieza === i);
        if (n0 < 0) continue;
        const nFin = i + 1 < decisiones.length ? cuadros.findIndex((c) => c.empieza === i + 1) : cuadros.length - 1;
        if (nFin < 0) continue;
        const meta = cuadros[nFin].j;
        const valido = (k) => {
          let s;
          if (k <= 0) {
            const c = cuadros[n0 + k];
            if (!c || (k < 0 && !c.libre) || !c.j.enSuelo) return false;
            s = c.j;
          } else {
            s = F.clonar(cuadros[n0].j);
            for (let n = 0; n < k; n++) if (!paso(s, { pulsoSalto: false, saltoSostenido: false, abajo: false })) return false;
            if (!s.enSuelo) return false;
          }
          const hasta = nFin - (n0 + k);
          return hasta > 0 && saltoEquivalente(s, accion, hasta, meta);
        };
        // Ventana de despegue: avanza de 3 en 3 cuadros y afina el borde
        const borde = (signo) => {
          let k = 0;
          while (k < 36 && valido(signo * (k + 3))) k += 3;
          while (k < 36 && valido(signo * (k + 1))) k++;
          return k;
        };
        const atras = borde(-1), adelante = borde(1);
        const k = Math.round((adelante - atras) / 2);
        if (k === 0) continue;
        const s = k < 0 ? cuadros[n0 + k].j : null;
        let x;
        if (s) x = s.x;
        else { const t = F.clonar(cuadros[n0].j); for (let n = 0; n < k; n++) paso(t, { pulsoSalto: false, saltoSostenido: false, abajo: false }); x = t.x; }
        nuevas[i][0] = x - 1e-7;
      }
      return reproducir(nuevas, false) ? nuevas : decisiones;
    }

    // Búsqueda con coste: correr no cuesta, saltar o deslizarse cuesta 1.
    // Así el recorrido usa los menos saltos posibles (como lo haría una persona).
    const mejor = new Map();
    const frente = [];
    const cola = [{ j: inicio, coste: 0, n: 0 }];
    let cabeza = 0;

    let llegada = null; // mejor final encontrado (se confirma cuando ya no puede haber uno más barato)
    const confirmar = (r) => {
      const decisiones = op.sinCentrar ? r.decisiones : centrarSaltos(r.decisiones);
      const final = reproducir(decisiones, false);
      if (!final) return null;
      return { camino: final.j.camino, decisiones: decisiones, pasos: pasos, salida: limpiar(final.j), entrada: limpiar(inicio) };
    };

    while (frente.length || cabeza < cola.length) {
      const nodo = frente.length ? frente.pop() : cola[cabeza++];
      if (llegada && nodo.coste >= llegada.coste) return confirmar(llegada.j);
      const estado = nodo.j;
      for (let indice = 0; indice < ACCIONES.length; indice++) {
        const accion = ACCIONES[indice];
        if (accion.tipo === "deslizar" && !op.permitirDeslizar && !tramo.deslizar) continue;
        // Mientras corre, se prueba saltar o deslizarse cada dos pasos (unos 10 px):
        // los saltos se centran después en su ventana, que siempre es más ancha
        if (accion.tipo !== "correr" && nodo.n % 2 === 1) continue;
        const r = simular(estado, accion, indice);
        if (pasos > limite) return null;
        if (!r) continue;
        // Tolerancia: la misma acción 1,5 cuadros antes o después también debe funcionar
        if (accion.tipo !== "correr" && !op.sinTolerancia) {
          let tolerante = true;
          for (const desfase of [-1.5, 1.5]) {
            const variante = F.clonar(estado);
            variante.camino = [];
            variante.decisiones = [];
            variante.x += desfase * vel * DT;
            if (!simular(variante, accion, indice)) { tolerante = false; break; }
          }
          if (!tolerante) continue;
        }
        const coste = nodo.coste + (accion.tipo === "correr" ? 0 : 1);
        if (r.fin) {
          if (coste === nodo.coste) return confirmar(r);
          if (!llegada || coste < llegada.coste) llegada = { j: r, coste: coste };
          continue;
        }
        const clave = Math.round(r.x / 4) + "," + Math.round(r.y) + "," + (r.deslizando ? 1 : 0) + "," + r.muertos + "," + r.nubes;
        if (mejor.has(clave) && mejor.get(clave) <= coste) continue;
        mejor.set(clave, coste);
        if (accion.tipo === "correr") frente.push({ j: r, coste: coste, n: nodo.n + 1 });
        else cola.push({ j: r, coste: coste, n: 0 });
      }
    }
    return llegada ? confirmar(llegada.j) : null;
  }

  /* -------------------------------------------------------
     MONEDAS: guías de la ruta, no relleno
     Grupos de 3 a 7 monedas sobre el recorrido validado:
       arco    → la trayectoria de un salto (también hacia nubes)
       subida / bajada → saltos que terminan más arriba o más abajo
       línea   → un camino seguro sobre el suelo
     Entre grupo y grupo hay tramos sin monedas. Como cada moneda
     está sobre el recorrido que el validador comprobó (con margen
     de ±1,5 cuadros), seguir las monedas siempre es posible.
     ------------------------------------------------------- */
  const LADO_MONEDA = 12;

  /* Espacio en metros tras un grupo de n monedas: proporcional al grupo,
     así la cantidad total se mantiene estable aunque los grupos crezcan */
  function espacioMonedas(n, azar) {
    return n * (12 + azar() * 6);
  }

  /* Altura (centro del cuerpo de Monky) del recorrido en la posición x */
  function alturaEn(puntos, x) {
    for (let i = 1; i < puntos.length; i++) {
      const a = puntos[i - 1], b = puntos[i];
      if (x >= a.x && x <= b.x) return b.x === a.x ? a.y : a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x);
    }
    return null;
  }

  function segmentosDeRuta(puntos) {
    const segmentos = [];
    let i = 0;
    while (i < puntos.length) {
      const aire = puntos[i].suelo === 0;
      let k = i;
      if (aire) {
        while (k + 1 < puntos.length && puntos[k + 1].suelo === 0) k++;
        const antes = puntos[i - 1], despues = puntos[k + 1];
        if (antes && despues) {
          segmentos.push({
            tipo: "salto", x0: antes.x, x1: despues.x, puntos: puntos.slice(i - 1, k + 2),
            subida: antes.y - despues.y, nube: despues.suelo === 2
          });
        }
      } else {
        // Suelo: se corta donde cambia la altura
        while (k + 1 < puntos.length && puntos[k + 1].suelo !== 0 && Math.abs(puntos[k + 1].y - puntos[i].y) < 1) k++;
        if (puntos[k].x - puntos[i].x > 0) segmentos.push({ tipo: "suelo", x0: puntos[i].x, x1: puntos[k].x, y: puntos[i].y, puntos: puntos.slice(i, k + 1) });
      }
      i = k + 1;
    }
    return segmentos;
  }

  function colocarMonedas(tramo, camino, azar, plan) {
    const monedas = [];
    if (!camino || camino.length < 2) return monedas;
    const d = dificultad(tramo.x0);
    const vel = tramo.vel || velocidad(tramo.x0);
    const puntos = camino.map(([x, y, suelo, h]) => ({ x: x + 5, y: y + (h || 18) / 2, suelo: suelo }));
    const mundo = mundoDeTramo(tramo);
    const puas = zonasPuas(tramo);
    const xFinTramo = (tramo.x0 + tramo.ancho) * T;

    // ¿Hay suelo debajo de x? (para saber si un salto cruza un abismo)
    const sueloBajo = (x) => {
      const cx = Math.floor(x / T);
      for (let cy = 0; cy < FILAS; cy++) if (mundo.casilla(cx, cy) === "#") return true;
      return false;
    };

    const libre = (m) => {
      const caja = { x: m.x + 1, y: m.y + 1, w: LADO_MONEDA - 2, h: LADO_MONEDA - 2 };
      const esquinas = [[caja.x, caja.y], [caja.x + caja.w, caja.y], [caja.x, caja.y + caja.h], [caja.x + caja.w, caja.y + caja.h]];
      for (const [x, y] of esquinas) {
        const ch = mundo.casilla(Math.floor(x / T), Math.floor(y / T));
        if (mundo.esSolida(ch) || ch === "^") return false;
      }
      if (puas.some((p) => solapan(caja, p))) return false;
      // Ni dentro de un enemigo cuando Monky pasa por ahí, ni encima de uno quieto
      const holgura = { x: m.x - 3, y: m.y - 3, w: LADO_MONEDA + 6, h: LADO_MONEDA + 6 };
      for (const e of tramo.entidades) {
        if (solapan(holgura, posicion(e, m.x + 1, vel))) return false;
        if (solapan(holgura, { x: e.x, y: e.y, w: e.w, h: e.h })) return false;
      }
      return true;
    };

    // Candidatos en orden de avance
    const candidatos = [];
    segmentosDeRuta(puntos).forEach((sg) => {
      const largo = sg.x1 - sg.x0;
      if (sg.tipo === "salto") {
        if (largo < 36) return;
        const abismo = !sueloBajo((sg.x0 + sg.x1) / 2);
        const forma = sg.subida > 8 ? "subida" : sg.subida < -8 ? "bajada" : "arco";
        const maximo = Math.min(7, 4 + Math.round(3 * d));
        const n = Math.max(3, Math.min(maximo, Math.round(largo / 19) + 1));
        candidatos.push({ forma: forma, x0: sg.x0, x1: sg.x1, puntos: sg.puntos, n: n, guia: sg.nube || abismo });
      } else if (largo >= 72) {
        // Línea sobre el suelo; deja libre el final, donde puede empezar un salto
        const n = Math.max(3, Math.min(6 - Math.round(2 * d), Math.floor((largo - 24) / 17)));
        if (n >= 3) candidatos.push({ forma: "linea", x0: sg.x0 + 6, x1: sg.x0 + 6 + (n - 1) * 17, puntos: sg.puntos, n: n, guia: false });
      }
    });

    candidatos.forEach((cand) => {
      const m0 = cand.x0 / T;
      // Las guías (nubes y abismos) pueden adelantarse un poco al turno; el resto espera su turno
      const turno = m0 >= plan.siguiente || (cand.guia && m0 >= plan.ultimo + 22 && azar() < 0.7);
      if (!turno) return;
      // Las líneas son más comunes al principio; luego dominan los arcos
      if (cand.forma === "linea" && azar() > 0.75 - 0.4 * d) return;
      const grupo = [];
      for (let i = 0; i < cand.n; i++) {
        let x;
        if (cand.forma === "linea") x = cand.x0 + i * 17;
        else {
          // Repartidas sobre el salto, sin la primera ni la última muestra (despegue y aterrizaje)
          const f = (i + 1) / (cand.n + 1);
          x = cand.x0 + (cand.x1 - cand.x0) * f;
        }
        const y = alturaEn(cand.puntos, x);
        if (y === null || x > xFinTramo - 4) continue;
        const m = { x: Math.round(x - LADO_MONEDA / 2), y: Math.round(y - LADO_MONEDA / 2) };
        if (libre(m)) grupo.push(m);
      }
      if (grupo.length < 3) return;
      plan.grupos = (plan.grupos || 0) + 1;
      grupo.forEach((m) => { m.forma = cand.forma; m.grupo = plan.grupos; monedas.push(m); });
      plan.ultimo = cand.x1 / T;
      plan.siguiente = plan.ultimo + espacioMonedas(grupo.length, azar);
    });
    return monedas;
  }

  /* -------------------------------------------------------
     GENERACIÓN DE UN TRAMO
     ------------------------------------------------------- */
  function crearGenerador(semilla) {
    const azar = crearAzar(semilla);
    const estado = {
      columna: 0,          // columna global donde empieza el próximo tramo
      h: 0,                // altura del suelo al final del último tramo
      siguientePoder: 18,  // en metros
      salida: null,        // estado exacto de Monky al terminar el tramo anterior
      monedas: { siguiente: 14, ultimo: -99, grupos: 0 }, // plan de grupos de monedas (metros)
      tramos: 0,
      descartados: 0,
      respaldos: 0
    };

    function tramoInicial() {
      // Pista de salida: llana y tranquila
      const k = new Constructor(24, 0);
      k.suelo(0, 23, 0);
      k.poner(3, superficie(0) - 1, "a");
      k.poner(9, superficie(0) - 1, "f");
      k.poner(16, superficie(0) - 1, "g");
      const salida = F.crearCorredor(5 * T, superficie(0) * T);
      const tramo = terminar(k, "llano", [], null);
      const sol = resolver(tramo, tramo.vel, { inicio: salida });
      tramo.xInicio = salida.x;
      tramo.plan = sol ? sol.decisiones : [];
      tramo.monedas = sol ? colocarMonedas(tramo, sol.camino, azar, estado.monedas) : [];
      estado.salida = sol ? sol.salida : null;
      return tramo;
    }

    function terminar(k, nombre, monedasFijas, camino) {
      const x0 = estado.columna;
      const metros = x0;
      const tramo = {
        x0: x0,
        ancho: k.ancho,
        mapa: k.mapa(),
        hEntrada: k.hEntrada,
        hSalida: k.hSalida,
        entidades: k.entidades,
        tema: mundoEn(metros),
        ciclo: cicloEn(metros),
        metros: metros,
        vel: velocidad(metros),
        patron: nombre,
        deslizar: k.deslizar || false,
        monedas: monedasFijas || [],
        poderes: []
      };
      estado.columna += k.ancho;
      estado.h = k.hSalida;
      estado.tramos++;
      return tramo;
    }

    function construir(nombres, h, ctx) {
      // Entrada llana (2), cuerpo con 1-2 patrones, salida llana (3)
      const piezas = [];
      let c = 3, hh = h, deslizar = false;
      const k = new Constructor(64, h);
      k.suelo(0, 2, h);
      for (const nombre of nombres) {
        const r = PATRONES[nombre](k, c, hh, ctx);
        c = r.c; hh = r.h;
        if (r.deslizar) deslizar = true;
        piezas.push(nombre);
        if (nombres.length > 1) { k.suelo(c, c + 1, hh); c += 2; }
      }
      k.suelo(c, c + 2, hh);
      c += 3;
      // Recortar al ancho usado
      k.ancho = c;
      k.filas = k.filas.map((f) => f.slice(0, c));
      k.hSalida = hh;
      k.deslizar = deslizar;
      return k;
    }

    function siguiente() {
      if (estado.tramos === 0) return tramoInicial();

      const metros = estado.columna;
      const tema = mundoEn(metros);
      const vel = velocidad(metros);
      const d = dificultad(metros);
      const ctx = { azar: azar, metros: metros, tema: tema, vel: vel, d: d };

      for (let intento = 0; intento < 6; intento++) {
        const nombres = [elegirPatron(ctx)];
        if (d > 0.35 && azar() < 0.25 + d * 0.35) nombres.push(elegirPatron(ctx));
        const k = construir(nombres, estado.h, ctx);

        const candidato = {
          x0: estado.columna, ancho: k.ancho, mapa: k.mapa(), hEntrada: k.hEntrada, hSalida: k.hSalida,
          entidades: k.entidades.map((e) => Object.assign({}, e, {
            x: e.x + estado.columna * T,
            xmin: e.xmin !== undefined ? e.xmin + estado.columna * T : undefined,
            xmax: e.xmax !== undefined ? e.xmax + estado.columna * T : undefined
          })),
          deslizar: k.deslizar
        };
        const solucion = resolver(candidato, vel, { inicio: estado.salida || undefined });
        if (!solucion) { estado.descartados++; continue; }

        candidato.vel = vel;
        const monedas = colocarMonedas(candidato, solucion.camino, azar, estado.monedas);
        const tramo = terminar(k, nombres.join("+"), monedas, solucion.camino);
        tramo.entidades = candidato.entidades;
        tramo.plan = solucion.decisiones;
        tramo.xInicio = solucion.entrada.x;
        tramo.entrada = solucion.entrada;
        estado.salida = solucion.salida;

        // Poderes: cada cierta distancia, sobre el recorrido seguro
        if (metros >= estado.siguientePoder) {
          // Cerca de la mitad del recorrido, pero sin pisar un grupo de monedas
          const camino = solucion.camino, medio = Math.floor(camino.length * 0.5);
          let punto = null;
          for (let k = 0; k < camino.length && !punto; k++) {
            const q = camino[medio + (k % 2 ? -1 : 1) * Math.ceil(k / 2)];
            if (q && tramo.monedas.every((m) => Math.abs(m.x + 6 - (q[0] + 5)) > 22)) punto = q;
          }
          if (punto) {
            const tipos = ["escudo", "iman", "doble", "impulso"];
            const pesos = [3, 3, 3, 1.6];
            let r = azar() * pesos.reduce((a, b) => a + b, 0);
            let tipo = tipos[0];
            for (let i = 0; i < tipos.length; i++) { if ((r -= pesos[i]) <= 0) { tipo = tipos[i]; break; } }
            tramo.poderes.push({ tipo: tipo, x: punto[0] - 2, y: punto[1] - 2 });
          }
          estado.siguientePoder = metros + 180 + azar() * 140;
        }
        return tramo;
      }

      // Respaldo seguro: tramo llano
      estado.respaldos++;
      const k = construir(["llano"], estado.h, ctx);
      const tramo = terminar(k, "llano (respaldo)", [], null);
      tramo.xInicio = estado.salida ? estado.salida.x : tramo.x0 * T;
      tramo.plan = [];
      estado.salida = null;
      return tramo;
    }

    return { siguiente: siguiente, estado: estado };
  }

  raiz.MonkyGenerador = {
    crearGenerador: crearGenerador,
    resolver: resolver,
    ACCIONES: ACCIONES,
    posicion: posicion,
    mundoEn: mundoEn,
    cicloEn: cicloEn,
    velocidad: velocidad,
    dificultad: dificultad,
    alcanceSalto: alcanceSalto,
    huecoMaximo: huecoMaximo,
    bajadaSalto: bajadaSalto,
    gruposNubes: gruposNubes,
    colocarMonedas: colocarMonedas,
    zonasPuas: zonasPuas,
    MUNDOS: MUNDOS,
    LARGO_MUNDO: LARGO_MUNDO,
    METRO: METRO,
    FILAS: FILAS,
    FILA_BASE: FILA_BASE,
    ACTIVACION: ACTIVACION
  };
})(typeof window !== "undefined" ? window : globalThis);
