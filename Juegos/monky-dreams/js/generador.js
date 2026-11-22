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
      const hueco = ctx.azar.entre(5, 8);
      const filaNube = superficie(h) - ctx.azar.entre(2, 3);
      k.suelo(c, c + 1, h);
      // 1 o 2 nubes para cruzar el abismo
      if (hueco >= 7) {
        for (let i = 0; i < 2; i++) k.poner(c + 3 + i, filaNube, "-");
        for (let i = 0; i < 2; i++) k.poner(c + 6 + i, filaNube - (ctx.azar() < 0.5 ? 1 : 0), "-");
      } else {
        for (let i = 0; i < 3; i++) k.poner(c + 3 + i, filaNube, "-");
      }
      k.suelo(c + 2 + hueco, c + hueco + 5, h);
      return { c: c + hueco + 6, h: h };
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
    const inicio = op.inicio ? F.clonar(op.inicio) : F.crearCorredor(tramo.x0 * T + 4, superficie(tramo.hEntrada) * T);
    inicio.muertos = 0;
    inicio.camino = [];
    inicio.decisiones = [];

    const visitados = new Set();
    const cola = [inicio];
    let pasos = 0;
    const limite = op.limitePasos || 60000;

    function simular(estado, accion, indice) {
      const j = F.clonar(estado);
      j.camino = estado.camino.slice();
      j.decisiones = indice === 0 ? estado.decisiones : estado.decisiones.concat([[estado.x, indice]]);
      let enAire = false;
      const marcos = accion.tipo === "correr" ? Math.max(2, Math.round(5 / (vel * DT))) : 200;
      for (let f = 0; f < marcos; f++) {
        pasos++;
        const entrada = {
          pulsoSalto: accion.tipo === "saltar" && f === 0,
          saltoSostenido: accion.tipo === "saltar" && f < accion.sostener,
          abajo: accion.tipo === "deslizar" && f < accion.sostener
        };
        const ev = F.pasoCorredor(j, entrada, DT, mundo, vel);
        if (ev.choque) return null;
        if (j.y > mundo.alto + 8) return null;
        if (puas.some((p) => solapan(j, p))) return null;

        // Entidades
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
            return null;
          }
        }

        if (f % 3 === 0) j.camino.push([Math.round(j.x), Math.round(j.y), j.enSuelo ? 1 : 0]);
        if (j.x >= xFin && j.enSuelo && !j.deslizando) { j.fin = true; return j; }
        if (!j.enSuelo) enAire = true;
        if (accion.tipo !== "correr" && accion.tipo !== "deslizar" && enAire && j.enSuelo) return j;
        if (accion.tipo === "deslizar" && f >= accion.sostener && !j.deslizando && j.enSuelo) return j;
      }
      return j.enSuelo ? j : null;
    }

    while (cola.length) {
      const estado = cola.shift();
      for (let indice = 0; indice < ACCIONES.length; indice++) {
        const accion = ACCIONES[indice];
        if (accion.tipo === "deslizar" && !op.permitirDeslizar && !tramo.deslizar) continue;
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
        if (r.fin) return { camino: r.camino, decisiones: r.decisiones, pasos: pasos, salida: limpiar(r), entrada: limpiar(inicio) };
        const clave = Math.round(r.x / 4) + "," + Math.round(r.y) + "," + (r.deslizando ? 1 : 0) + "," + r.muertos;
        if (visitados.has(clave)) continue;
        visitados.add(clave);
        cola.push(r);
      }
    }
    return null;
  }

  /* -------------------------------------------------------
     MONEDAS sobre el recorrido encontrado
     ------------------------------------------------------- */
  function colocarMonedas(tramo, camino, azar) {
    const monedas = [];
    let ultimoX = -999;
    let enArco = 0;
    camino.forEach(([x, y, suelo]) => {
      const cx = x + 5, cy = y + 4;
      if (suelo) {
        enArco = 0;
        if (azar() < 0.02 && cx - ultimoX > 56) { monedas.push({ x: cx - 6, y: cy - 6 }); ultimoX = cx; }
      } else if (cx - ultimoX >= 22) {
        enArco++;
        monedas.push({ x: cx - 6, y: cy - 6 });
        ultimoX = cx;
      }
    });
    // Evita monedas dentro de bloques
    const mundo = mundoDeTramo(tramo);
    return monedas.filter((m) => !mundo.esSolida(mundo.casilla(Math.floor((m.x + 6) / T), Math.floor((m.y + 6) / T))));
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

        const monedas = colocarMonedas(candidato, solucion.camino, azar);
        const tramo = terminar(k, nombres.join("+"), monedas, solucion.camino);
        tramo.entidades = candidato.entidades;
        tramo.plan = solucion.decisiones;
        tramo.xInicio = solucion.entrada.x;
        tramo.entrada = solucion.entrada;
        estado.salida = solucion.salida;

        // Poderes: cada cierta distancia, sobre el recorrido seguro
        if (metros >= estado.siguientePoder) {
          const punto = solucion.camino[Math.floor(solucion.camino.length * 0.5)];
          if (punto) {
            const tipos = ["escudo", "iman", "doble", "impulso"];
            const pesos = [3, 3, 3, 1.6];
            let r = azar() * pesos.reduce((a, b) => a + b, 0);
            let tipo = tipos[0];
            for (let i = 0; i < tipos.length; i++) { if ((r -= pesos[i]) <= 0) { tipo = tipos[i]; break; } }
            tramo.poderes.push({ tipo: tipo, x: punto[0] - 2, y: punto[1] - 2 });
            tramo.monedas = tramo.monedas.filter((m) => Math.abs(m.x - punto[0]) > 20);
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
    zonasPuas: zonasPuas,
    MUNDOS: MUNDOS,
    LARGO_MUNDO: LARGO_MUNDO,
    METRO: METRO,
    FILAS: FILAS,
    FILA_BASE: FILA_BASE,
    ACTIVACION: ACTIVACION
  };
})(typeof window !== "undefined" ? window : globalThis);
