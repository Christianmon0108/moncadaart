/* =========================================================
   MONKY RUN — DATOS GUARDADOS (economía, tienda y misiones)
   Todo vive en localStorage bajo una sola clave, validado al
   leer: si algo está dañado o es inválido se corrige o se
   descarta en lugar de romper el juego. No hay pagos reales:
   las monedas son virtuales y se ganan jugando.

   Cada partida de la Carrera recibe un identificador. Sus
   monedas se cobran UNA sola vez (aunque se recargue la
   página, se repita el aviso o haya dos pestañas abiertas).
   ========================================================= */

(function (raiz) {
  "use strict";

  const CLAVE = "monky-dreams-datos";
  const CLAVE_RECORD = "monky-dreams-record"; // formato anterior (se mantiene)
  const VERSION = 1;
  const MAX_SALDO = 9999999;
  const MAX_COBRADAS = 40;

  /* -------------------------------------------------------
     CATÁLOGO DE LA TIENDA
     ------------------------------------------------------- */
  const CATALOGO = [
    { id: "monky", cat: "personajes", nombre: "Monky", precio: 0,
      desc: "El artista original de MoncadaArt, con su gorra hacia atrás." },
    { id: "explorador", cat: "personajes", nombre: "Monky Explorador", precio: 120,
      desc: "Casco de safari y chaleco de mil bolsillos para dibujar selvas." },
    { id: "cyber", cat: "personajes", nombre: "Monky Cyber", precio: 280,
      desc: "Visor de neón, antena de señal y tenis luminosos." },
    { id: "nubi", cat: "personajes", nombre: "Nubi", precio: 450,
      desc: "Una ovejita de nube que se escapó de un dibujo. Al deslizarse se hace bolita." },
    { id: "pijama", cat: "vestimentas", ranura: "vestimenta", nombre: "Traje estelar", precio: 90, para: ["monky"],
      desc: "Traje azul con estrellas doradas. Solo para Monky." },
    { id: "sudadera", cat: "vestimentas", ranura: "vestimenta", nombre: "Sudadera atardecer", precio: 150, para: ["monky"],
      desc: "La sudadera naranja de MoncadaArt. Solo para Monky." },
    { id: "gorro", cat: "accesorios", ranura: "cabeza", nombre: "Gorro de borla", precio: 80, para: ["monky"],
      desc: "Gorro lila con borla. Reemplaza la gorra de Monky." },
    { id: "bufanda", cat: "accesorios", ranura: "cuello", nombre: "Bufanda cometa", precio: 110,
      para: ["monky", "explorador", "cyber", "nubi"],
      desc: "Una bufanda roja que ondea al correr. Le queda a todos." },
    { id: "iman2", cat: "mejoras", nombre: "Imán potente", precio: 200,
      desc: "El imán dura 15 s (antes 10) y atrae monedas desde más lejos." },
    { id: "escudo2", cat: "mejoras", nombre: "Escudo reforzado", precio: 300,
      desc: "El escudo dura 15 s (antes 10) y al terminar te protege 1 s más." }
  ];
  const POR_ID = {};
  CATALOGO.forEach((a) => { POR_ID[a.id] = a; });
  const CATEGORIAS = ["personajes", "vestimentas", "accesorios", "mejoras"];

  /* -------------------------------------------------------
     MISIONES (repetibles, cada nivel pide un poco más)
     ------------------------------------------------------- */
  const MISIONES = {
    distancia: {
      meta: (n) => Math.min(5000, [300, 600, 1000, 1500][n] || 1500 + (n - 3) * 500),
      premio: (n) => Math.min(90, 25 + n * 10),
      texto: (m) => "Recorre " + m + " m en una partida",
      porPartida: true
    },
    monedas: {
      meta: (n) => Math.min(400, 40 + n * 30),
      premio: (n) => Math.min(80, 20 + n * 10),
      texto: (m) => "Reúne " + m + " monedas (en total)",
      porPartida: false
    },
    poderes: {
      meta: (n) => Math.min(5, [1, 2, 3][n] || 3 + Math.floor((n - 3) / 2)),
      premio: (n) => Math.min(80, 25 + n * 10),
      texto: (m) => "Usa " + m + (m === 1 ? " poder" : " poderes") + " en una partida",
      porPartida: true
    }
  };
  const TIPOS_MISION = Object.keys(MISIONES);

  /* -------------------------------------------------------
     VALIDACIÓN
     ------------------------------------------------------- */
  const entero = (v, min, max) => {
    const n = Math.floor(Number(v));
    return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : min;
  };

  function compatible(id, personaje) {
    const a = POR_ID[id];
    return !!a && (!a.para || a.para.indexOf(personaje) >= 0);
  }

  function base() {
    return {
      version: VERSION,
      saldo: 0,
      comprados: ["monky"],
      equipado: { personaje: "monky", vestimenta: null, cabeza: null, cuello: null },
      record: { metros: 0, monedas: 0 },
      estadisticas: { partidas: 0, metros: 0, monedas: 0, poderes: 0, gastado: 0 },
      misiones: { distancia: { nivel: 0, progreso: 0 }, monedas: { nivel: 0, progreso: 0 }, poderes: { nivel: 0, progreso: 0 } },
      cobradas: []
    };
  }

  function sanear(crudo) {
    const d = base();
    const c = crudo && typeof crudo === "object" ? crudo : {};
    d.saldo = entero(c.saldo, 0, MAX_SALDO);
    if (Array.isArray(c.comprados)) {
      c.comprados.forEach((id) => { if (typeof id === "string" && POR_ID[id] && d.comprados.indexOf(id) < 0) d.comprados.push(id); });
    }
    const eq = c.equipado && typeof c.equipado === "object" ? c.equipado : {};
    const tiene = (id) => d.comprados.indexOf(id) >= 0;
    if (typeof eq.personaje === "string" && POR_ID[eq.personaje] && POR_ID[eq.personaje].cat === "personajes" && tiene(eq.personaje)) {
      d.equipado.personaje = eq.personaje;
    }
    ["vestimenta", "cabeza", "cuello"].forEach((ranura) => {
      const id = eq[ranura];
      if (typeof id === "string" && POR_ID[id] && POR_ID[id].ranura === ranura && tiene(id) && compatible(id, d.equipado.personaje)) {
        d.equipado[ranura] = id;
      }
    });
    const r = c.record && typeof c.record === "object" ? c.record : {};
    d.record.metros = entero(r.metros, 0, 1e7);
    d.record.monedas = entero(r.monedas, 0, 1e7);
    const e = c.estadisticas && typeof c.estadisticas === "object" ? c.estadisticas : {};
    Object.keys(d.estadisticas).forEach((k) => { d.estadisticas[k] = entero(e[k], 0, 1e9); });
    const m = c.misiones && typeof c.misiones === "object" ? c.misiones : {};
    TIPOS_MISION.forEach((tipo) => {
      const x = m[tipo] && typeof m[tipo] === "object" ? m[tipo] : {};
      d.misiones[tipo].nivel = entero(x.nivel, 0, 999);
      d.misiones[tipo].progreso = MISIONES[tipo].porPartida ? 0 : entero(x.progreso, 0, MISIONES[tipo].meta(d.misiones[tipo].nivel));
    });
    if (Array.isArray(c.cobradas)) d.cobradas = c.cobradas.filter((x) => typeof x === "string" && x.length < 40).slice(-MAX_COBRADAS);
    return d;
  }

  /* -------------------------------------------------------
     ALMACENAMIENTO
     ------------------------------------------------------- */
  let almacen = null;
  try { almacen = raiz.localStorage || null; } catch (error) { almacen = null; }
  let memoria = null; // respaldo si localStorage no está disponible
  const oyentes = [];

  function leerCrudo() {
    try {
      const t = almacen ? almacen.getItem(CLAVE) : memoria;
      return t ? JSON.parse(t) : null;
    } catch (error) { return null; }
  }

  /* Lee siempre lo último guardado (otra pestaña pudo cambiarlo) */
  function cargar() {
    const crudo = leerCrudo();
    const d = sanear(crudo);
    if (!crudo) {
      // Compatibilidad: récord guardado por versiones anteriores
      try {
        const viejo = JSON.parse((almacen && almacen.getItem(CLAVE_RECORD)) || "null");
        if (viejo) {
          d.record.metros = entero(viejo.metros, 0, 1e7);
          d.record.monedas = entero(viejo.monedas, 0, 1e7);
        }
      } catch (error) { /* récord viejo ilegible: se ignora */ }
    }
    return d;
  }

  function guardar(d) {
    const limpio = sanear(d);
    const texto = JSON.stringify(limpio);
    try {
      if (almacen) {
        almacen.setItem(CLAVE, texto);
        almacen.setItem(CLAVE_RECORD, JSON.stringify(limpio.record));
      } else memoria = texto;
    } catch (error) { memoria = texto; }
    oyentes.forEach((f) => { try { f(limpio); } catch (e) { /* nada */ } });
    return limpio;
  }

  function cambiar(fn) {
    const d = cargar();
    const r = fn(d);
    guardar(d);
    return r;
  }

  /* -------------------------------------------------------
     TIENDA
     ------------------------------------------------------- */
  function comprar(id) {
    return cambiar((d) => {
      const a = POR_ID[id];
      if (!a) return { ok: false, motivo: "no existe" };
      if (d.comprados.indexOf(id) >= 0) return { ok: false, motivo: "ya comprado" };
      if (d.saldo < a.precio) return { ok: false, motivo: "saldo insuficiente", faltan: a.precio - d.saldo };
      d.saldo -= a.precio;
      d.estadisticas.gastado += a.precio;
      d.comprados.push(id);
      // Lo comprado se equipa de inmediato si se puede
      if (a.cat === "personajes") equiparEn(d, id);
      else if (a.ranura && compatible(id, d.equipado.personaje)) d.equipado[a.ranura] = id;
      return { ok: true, saldo: d.saldo };
    });
  }

  function equiparEn(d, id) {
    const a = POR_ID[id];
    if (!a || d.comprados.indexOf(id) < 0) return { ok: false, motivo: "bloqueado" };
    if (a.cat === "personajes") {
      d.equipado.personaje = id;
      // Quita lo que el nuevo personaje no puede usar (sigue comprado)
      ["vestimenta", "cabeza", "cuello"].forEach((r) => { if (d.equipado[r] && !compatible(d.equipado[r], id)) d.equipado[r] = null; });
      return { ok: true };
    }
    if (!a.ranura) return { ok: false, motivo: "no se equipa" };
    if (!compatible(id, d.equipado.personaje)) return { ok: false, motivo: "incompatible" };
    d.equipado[a.ranura] = id;
    return { ok: true };
  }

  const equipar = (id) => cambiar((d) => equiparEn(d, id));
  const quitar = (ranura) => cambiar((d) => {
    if (["vestimenta", "cabeza", "cuello"].indexOf(ranura) < 0) return { ok: false };
    d.equipado[ranura] = null;
    return { ok: true };
  });

  /* -------------------------------------------------------
     PARTIDAS: cobro único al terminar
     ------------------------------------------------------- */
  function nuevaPartida() {
    return "p" + Date.now().toString(36) + Math.floor(Math.random() * 1e9).toString(36);
  }

  /* Estado de las misiones con el avance de la partida en curso */
  function misionesCon(d, partida) {
    const p = partida || { metros: 0, monedas: 0, poderes: 0 };
    return TIPOS_MISION.map((tipo) => {
      const M = MISIONES[tipo], m = d.misiones[tipo];
      const meta = M.meta(m.nivel);
      const actual = tipo === "distancia" ? p.metros : tipo === "poderes" ? p.poderes : m.progreso + p.monedas;
      return { tipo: tipo, nivel: m.nivel, meta: meta, progreso: Math.min(meta, actual), premio: M.premio(m.nivel), texto: M.texto(meta), lista: actual >= meta };
    });
  }

  /* resumen: { id, metros, monedas, poderes } — devuelve qué se ganó */
  function cerrarPartida(resumen) {
    return cambiar((d) => {
      const id = String(resumen && resumen.id || "");
      const metros = entero(resumen && resumen.metros, 0, 1e7);
      const monedas = entero(resumen && resumen.monedas, 0, 1e6);
      const poderes = entero(resumen && resumen.poderes, 0, 1000);
      if (!id || d.cobradas.indexOf(id) >= 0) {
        return { repetida: true, ganadas: 0, premios: [], saldo: d.saldo, record: Object.assign({}, d.record), nuevoRecord: false, misiones: misionesCon(d) };
      }
      d.cobradas.push(id);
      d.cobradas = d.cobradas.slice(-MAX_COBRADAS);

      const nuevoRecord = metros > d.record.metros;
      if (nuevoRecord) d.record.metros = metros;
      if (monedas > d.record.monedas) d.record.monedas = monedas;
      d.estadisticas.partidas++;
      d.estadisticas.metros += metros;
      d.estadisticas.monedas += monedas;
      d.estadisticas.poderes += poderes;

      // Misiones
      const premios = [];
      TIPOS_MISION.forEach((tipo) => {
        const M = MISIONES[tipo], m = d.misiones[tipo];
        if (M.porPartida) {
          const valor = tipo === "distancia" ? metros : poderes;
          if (valor >= M.meta(m.nivel)) {
            premios.push({ tipo: tipo, texto: M.texto(M.meta(m.nivel)), premio: M.premio(m.nivel) });
            m.nivel++;
          }
        } else {
          let resto = m.progreso + monedas;
          while (resto >= M.meta(m.nivel)) {
            resto -= M.meta(m.nivel);
            premios.push({ tipo: tipo, texto: M.texto(M.meta(m.nivel)), premio: M.premio(m.nivel) });
            m.nivel++;
          }
          m.progreso = resto;
        }
      });
      const extra = premios.reduce((s, p) => s + p.premio, 0);
      d.saldo = Math.min(MAX_SALDO, d.saldo + monedas + extra);
      return { repetida: false, ganadas: monedas, premios: premios, extra: extra, saldo: d.saldo, record: Object.assign({}, d.record), nuevoRecord: nuevoRecord, misiones: misionesCon(d) };
    });
  }

  /* -------------------------------------------------------
     CONSULTAS
     ------------------------------------------------------- */
  const api = {
    CATALOGO: CATALOGO,
    CATEGORIAS: CATEGORIAS,
    articulo: (id) => POR_ID[id] || null,
    cargar: cargar,
    leer: () => cargar(),
    saldo: () => cargar().saldo,
    tiene: (id) => cargar().comprados.indexOf(id) >= 0,
    equipado: () => Object.assign({}, cargar().equipado),
    record: () => Object.assign({}, cargar().record),
    mejoras: () => { const d = cargar(); return { iman: d.comprados.indexOf("iman2") >= 0, escudo: d.comprados.indexOf("escudo2") >= 0 }; },
    compatible: compatible,
    comprar: comprar,
    equipar: equipar,
    quitar: quitar,
    nuevaPartida: nuevaPartida,
    cerrarPartida: cerrarPartida,
    misiones: (partida) => misionesCon(cargar(), partida),
    alCambiar: (f) => oyentes.push(f),
    _sanear: sanear,
    _usarAlmacen: (a) => { almacen = a; memoria = null; }
  };
  raiz.MonkyDatos = api;
})(typeof window !== "undefined" ? window : globalThis);
