/* =========================================================
   MONKY RUN — PRUEBA DEL GENERADOR (Carrera infinita)

   1. Genera muchos kilómetros de terreno con varias semillas
      y revalida cada tramo con la física real de Monky,
      partiendo del estado exacto en que termina el anterior.
   2. Recorre esos tramos ENCADENADOS con un piloto que repite
      las decisiones del validador, igual que el juego: si
      validador y juego coinciden, no debe recibir ni un golpe.
   3. Monedas: cuántas hay por cada 500 m, tamaño de los grupos,
      ninguna dentro de bloques o púas, y el piloto (que sigue la
      ruta marcada) debe poder recogerlas.
   4. Nubes: el piloto debe pararse en cada nube, y el salto a
      cada nube debe tener una ventana de despegue cómoda.

   Ejecutar:  node Juegos/monky-dreams/pruebas/carrera.js [metros] [semillas]
   ========================================================= */
"use strict";
const path = require("path");
globalThis.window = globalThis;
require(path.join(__dirname, "../js/fisica.js"));
require(path.join(__dirname, "../js/generador.js"));
const F = window.MonkyFisica;
const G = window.MonkyGenerador;
const T = F.T, DT = 1 / 60;

const METROS = Number(process.argv[2] || 3000);
const SEMILLAS = Number(process.argv[3] || 4);
const solapan = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/* ---------- 1. Generación y revalidación ---------- */
let tramos = 0, respaldos = 0, descartados = 0, sinValidar = 0, maxMs = 0, totalMs = 0, monedas = 0;
const porVentana = {};          // monedas por cada 500 m: ventana → [por semilla]
const grupos = {};              // tamaño de grupo → cantidad
const formas = {};
let monedasMalas = 0;
const solida = (t, cx, cy) => { const f = t.mapa[cy]; const ch = f && f[cx - t.x0]; return ch === "#" || ch === "B" || ch === "^"; };
const patrones = {}, mundos = {}, entidades = {}, poderes = {};

for (let s = 1; s <= SEMILLAS; s++) {
  const gen = G.crearGenerador(s * 7919);
  while (gen.estado.columna < METROS) {
    const t0 = process.hrtime.bigint();
    const tramo = gen.siguiente();
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    maxMs = Math.max(maxMs, ms); totalMs += ms; tramos++;
    patrones[tramo.patron] = (patrones[tramo.patron] || 0) + 1;
    mundos[tramo.tema] = (mundos[tramo.tema] || 0) + 1;
    tramo.entidades.forEach((e) => { entidades[e.tipo] = (entidades[e.tipo] || 0) + 1; });
    tramo.poderes.forEach((p) => { poderes[p.tipo] = (poderes[p.tipo] || 0) + 1; });
    monedas += tramo.monedas.length;
    const tam = {};
    tramo.monedas.forEach((m) => {
      const v = Math.floor(m.x / T / 500);
      (porVentana[v] = porVentana[v] || {})[s] = (porVentana[v][s] || 0) + 1;
      tam[m.grupo] = (tam[m.grupo] || 0) + 1;
      formas[m.forma] = (formas[m.forma] || 0) + 1;
      for (const [x, y] of [[m.x + 1, m.y + 1], [m.x + 11, m.y + 1], [m.x + 1, m.y + 11], [m.x + 11, m.y + 11]]) {
        if (solida(tramo, Math.floor(x / T), Math.floor(y / T))) { monedasMalas++; break; }
      }
    });
    Object.values(tam).forEach((n) => { grupos[n] = (grupos[n] || 0) + 1; });
    if (tramo.entrada && !G.resolver(tramo, tramo.vel, { inicio: tramo.entrada })) sinValidar++;
  }
  respaldos += gen.estado.respaldos;
  descartados += gen.estado.descartados;
}

/* ---------- 2. Recorrido encadenado con piloto ---------- */
function recorrer(semilla, metros) {
  const gen = G.crearGenerador(semilla);
  let vivos = [];
  const tramoEn = (cx) => vivos.find((t) => cx >= t.x0 && cx < t.x0 + t.ancho) || null;
  const mundo = {
    filas: 12, alto: 192, esSolida: (c) => c === "#" || c === "B",
    casilla(cx, cy) {
      if (cy < 0) return ".";
      const t = tramoEn(cx);
      if (!t) return vivos.length && cx < vivos[0].x0 ? "#" : ".";
      const ch = t.mapa[Math.min(cy, 11)][cx - t.x0];
      if (cy >= 12) return ch === "#" ? "#" : ".";
      return "#B-^".includes(ch) ? ch : ".";
    }
  };
  const preparar = (t) => {
    t.entidades.forEach((e) => { e.vivo = true; });
    t.puas = G.zonasPuas(t); t.hecho = new Set();
    t.monedas.forEach((m) => { m.tomada = false; });
    t.nubes = G.gruposNubes(t); t.nubes.forEach((g) => { g.pisada = false; });
    todos.push(t);
    return t;
  };
  const todos = [];
  const j = F.crearCorredor(5 * T, 10 * T);
  let accion = null, invul = 0;
  const golpes = [];
  const historia = [];   // estados recientes (para medir ventanas de despegue)
  const ventanas = [];   // cuadros de margen para despegar hacia cada nube
  const sinGolpe = (k, t) => {
    if (k.y > 230) return false;
    for (const tt of vivos) {
      if (tt.puas.some((p) => solapan(k, p))) return false;
      for (const e of tt.entidades) {
        if (!e.vivo) continue;
        const p = G.posicion(e, k.x, tt.vel);
        if (solapan(k, p) && !(e.pisable && k.vy > 0 && k.y + k.h - p.y < 10)) return false;
      }
    }
    return true;
  };
  const sobreNube = (k) => {
    if (!k.enSuelo) return null;
    for (const tt of vivos) for (const g of tt.nubes) {
      if (Math.abs(k.y + k.h - g.cy * T) < 0.01 && k.x + k.w + 2 > g.c0 * T && k.x - 2 < (g.c1 + 1) * T) return g;
    }
    return null;
  };
  // ¿Saltar con la acción a desde el estado s aterriza en la nube g sin daño?
  const llegaANube = (s, a, g, t) => {
    const k = F.clonar(s); let aire = false;
    for (let f = 0; f < 200; f++) {
      const ev = F.pasoCorredor(k, { pulsoSalto: f === 0, saltoSostenido: f < a.sostener, abajo: false }, DT, mundo, t.vel);
      if (ev.choque || !sinGolpe(k, t)) return false;
      if (!k.enSuelo) aire = true;
      else if (aire) return sobreNube(k) === g;
    }
    return false;
  };
  const medirVentana = (inicio, a, g, t) => {
    // atrás: estados guardados (corriendo en el suelo); adelante: seguir corriendo sin saltar
    let atras = 0, adelante = 0;
    for (let k = 1; k <= 40; k++) {
      const h = historia[historia.length - 1 - k];
      if (!h || !h.enSuelo || !llegaANube(h, a, g, t)) break;
      atras = k;
    }
    const s = F.clonar(inicio);
    for (let k = 1; k <= 40; k++) {
      F.pasoCorredor(s, { pulsoSalto: false, saltoSostenido: false, abajo: false }, DT, mundo, t.vel);
      if (!sinGolpe(s, t) || !llegaANube(s, a, g, t)) break;
      adelante = k;
    }
    return atras + adelante + 1;
  };
  for (let f = 0; f < 60 * 1200 && j.x / T < metros; f++) {
    while (!vivos.length || (vivos[vivos.length - 1].x0 + vivos[vivos.length - 1].ancho) * T < j.x + 800) vivos.push(preparar(gen.siguiente()));
    while (vivos.length > 2 && (vivos[0].x0 + vivos[0].ancho) * T < j.x - 200) vivos.shift();
    let t = vivos[0];
    for (const tt of vivos) if (tt.xInicio !== undefined && tt.xInicio <= j.x + 1e-6) t = tt;
    const entrada = { pulsoSalto: false, saltoSostenido: false, abajo: false };
    if (accion) {
      const a = accion.a;
      if ((a.tipo === "saltar" && accion.enAire && j.enSuelo) || (a.tipo === "deslizar" && accion.f > a.sostener && !j.deslizando && j.enSuelo) || accion.f > 200) accion = null;
    }
    if (!accion && t.plan) {
      for (const [dx, idx] of t.plan) {
        if (t.hecho.has(dx)) continue;
        if (j.x >= dx - 1e-6 && j.x < dx + 24) { t.hecho.add(dx); accion = { a: G.ACCIONES[idx], f: 0, enAire: false }; break; }
      }
    }
    if (accion && accion.f === 0) accion.inicio = F.clonar(j);
    if (accion) {
      const a = accion.a, k = accion.f++;
      if (a.tipo === "saltar") { entrada.pulsoSalto = k === 0; entrada.saltoSostenido = k < a.sostener; }
      if (a.tipo === "deslizar") entrada.abajo = k < a.sostener;
    }
    historia.push(F.clonar(j)); if (historia.length > 60) historia.shift();
    const ev = F.pasoCorredor(j, entrada, DT, mundo, t.vel);
    if (accion && !j.enSuelo) accion.enAire = true;
    const nube = sobreNube(j);
    if (nube && !nube.pisada) {
      nube.pisada = true;
      if (accion && accion.a.tipo === "saltar" && accion.enAire && accion.inicio) {
        historia.pop();
        ventanas.push(medirVentana(accion.inicio, accion.a, nube, t));
      }
    }
    for (const tt of vivos) for (const m of tt.monedas) if (!m.tomada && solapan(j, { x: m.x, y: m.y, w: 12, h: 12 })) m.tomada = true;
    invul = Math.max(0, invul - DT);
    const golpe = (motivo) => { if (invul > 0) return; invul = 1.5; golpes.push({ motivo, m: Math.round(j.x / T), patron: t.patron }); };
    if (ev.choque) golpe("choque");
    for (const tt of vivos) {
      for (const p of tt.puas) if (solapan(j, p)) golpe("púas");
      tt.entidades.forEach((e) => {
        if (!e.vivo) return;
        const p = G.posicion(e, j.x, tt.vel);
        if (!solapan(j, p)) return;
        if (e.pisable && j.vy > 0 && j.y + j.h - p.y < 10) { e.vivo = false; j.vy = F.FIS.rebote; j.enSuelo = false; }
        else golpe(e.tipo);
      });
    }
    if (j.y > 230) { golpes.push({ motivo: "vacío", m: Math.round(j.x / T), patron: t.patron }); break; }
  }
  const pasados = todos.filter((t) => (t.x0 + t.ancho) * T < j.x - 32);
  const lista = pasados.flatMap((t) => t.monedas);
  const nubes = pasados.flatMap((t) => t.nubes);
  return {
    metros: Math.round(j.x / T), golpes,
    monedas: lista.length, tomadas: lista.filter((m) => m.tomada).length,
    nubes: nubes.length, pisadas: nubes.filter((g) => g.pisada).length, ventanas
  };
}

const recorridos = [];
for (let s = 1; s <= SEMILLAS; s++) recorridos.push(recorrer(s * 104729, METROS));
const golpesTotales = recorridos.reduce((n, r) => n + r.golpes.length, 0);

/* ---------- Informe ---------- */
const top = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join("  ");
console.log(`Generación: ${SEMILLAS} semillas × ${METROS} m → ${tramos} tramos`);
console.log(`  Tiempo por tramo: promedio ${(totalMs / tramos).toFixed(1)} ms · máximo ${maxMs.toFixed(1)} ms`);
console.log(`  Intentos descartados: ${descartados} · tramos de respaldo: ${respaldos} · sin revalidar: ${sinValidar}`);
console.log(`  Mundos: ${top(mundos)}`);
console.log(`  Patrones: ${top(patrones).slice(0, 300)}…`);
console.log(`  Entidades: ${top(entidades)}`);
console.log(`  Poderes: ${top(poderes)} · Monedas: ${monedas}`);
console.log(`  Velocidad: 0 m ${G.velocidad(0).toFixed(0)} px/s · 1000 m ${G.velocidad(1000).toFixed(0)} · 3000 m ${G.velocidad(3000).toFixed(0)} · 6000 m ${G.velocidad(6000).toFixed(0)}`);
console.log(`Recorrido encadenado con piloto:`);
recorridos.forEach((r, i) => console.log(`  semilla ${i + 1}: ${r.metros} m · golpes ${r.golpes.length}${r.golpes.length ? " " + JSON.stringify(r.golpes.slice(0, 3)) : ""}`));

console.log(`Monedas por cada 500 m (promedio de ${SEMILLAS} semillas, mín–máx):`);
const promedios = [];
Object.keys(porVentana).map(Number).sort((a, b) => a - b).forEach((v) => {
  if ((v + 1) * 500 > METROS) return; // ventana incompleta
  const lista = []; for (let s = 1; s <= SEMILLAS; s++) lista.push(porVentana[v][s] || 0);
  const prom = lista.reduce((a, b) => a + b, 0) / lista.length;
  promedios.push(prom);
  console.log(`  ${v * 500}–${v * 500 + 500} m: ${prom.toFixed(1)} (${Math.min(...lista)}–${Math.max(...lista)})`);
});
console.log(`  Grupos por tamaño: ${Object.entries(grupos).map(([n, c]) => n + ":" + c).join("  ")} · formas: ${top(formas)}`);
console.log(`  Monedas dentro de bloques o púas: ${monedasMalas}`);
const tomadas = recorridos.reduce((n, r) => n + r.tomadas, 0), totalM = recorridos.reduce((n, r) => n + r.monedas, 0);
console.log(`  El piloto, siguiendo la ruta, recogió ${tomadas} de ${totalM} monedas (${(100 * tomadas / totalM).toFixed(1)} %)`);
const nubesT = recorridos.reduce((n, r) => n + r.nubes, 0), pisadas = recorridos.reduce((n, r) => n + r.pisadas, 0);
const ventanas = recorridos.flatMap((r) => r.ventanas).sort((a, b) => a - b);
console.log(`Nubes: el piloto se paró en ${pisadas} de ${nubesT}`);
if (ventanas.length) console.log(`  Ventana para despegar hacia una nube: mínimo ${ventanas[0]} cuadros · mediana ${ventanas[Math.floor(ventanas.length / 2)]} · (${ventanas.length} saltos medidos)`);

const tamanosOk = Object.keys(grupos).every((n) => n >= 3 && n <= 7);
const densidadOk = promedios.every((p) => p >= 25 && p <= 50);
const ok = sinValidar === 0 && respaldos / tramos < 0.03 && golpesTotales === 0 &&
  monedasMalas === 0 && tamanosOk && densidadOk && tomadas / totalM > 0.98 && pisadas === nubesT && (!ventanas.length || ventanas[0] >= 3);
console.log(ok ? "RESULTADO: OK" : "RESULTADO: HAY PROBLEMAS");
process.exitCode = ok ? 0 : 1;
