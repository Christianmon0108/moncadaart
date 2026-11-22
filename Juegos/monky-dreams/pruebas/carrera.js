/* =========================================================
   MONKY DREAMS — PRUEBA DEL GENERADOR (Carrera infinita)

   1. Genera muchos kilómetros de terreno con varias semillas
      y revalida cada tramo con la física real de Monky,
      partiendo del estado exacto en que termina el anterior.
   2. Recorre esos tramos ENCADENADOS con un piloto que repite
      las decisiones del validador, igual que el juego: si
      validador y juego coinciden, no debe recibir ni un golpe.

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
  const preparar = (t) => { t.entidades.forEach((e) => { e.vivo = true; }); t.puas = G.zonasPuas(t); t.hecho = new Set(); return t; };
  const j = F.crearCorredor(5 * T, 10 * T);
  let accion = null, invul = 0;
  const golpes = [];
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
    if (accion) {
      const a = accion.a, k = accion.f++;
      if (a.tipo === "saltar") { entrada.pulsoSalto = k === 0; entrada.saltoSostenido = k < a.sostener; }
      if (a.tipo === "deslizar") entrada.abajo = k < a.sostener;
    }
    const ev = F.pasoCorredor(j, entrada, DT, mundo, t.vel);
    if (accion && !j.enSuelo) accion.enAire = true;
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
  return { metros: Math.round(j.x / T), golpes };
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
const ok = sinValidar === 0 && respaldos / tramos < 0.03 && golpesTotales === 0;
console.log(ok ? "RESULTADO: OK" : "RESULTADO: HAY PROBLEMAS");
process.exitCode = ok ? 0 : 1;
