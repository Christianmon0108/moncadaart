/* =========================================================
   MONKY RUN — PRUEBA DE ALCANCE DEL NIVEL
   Usa la misma física del juego (js/fisica.js) para comprobar
   que la meta y todas las monedas se pueden alcanzar sin
   morir. Ejecutar con:  node Juegos/monky-dreams/pruebas/alcance.js
   ========================================================= */

"use strict";
const path = require("path");
globalThis.window = globalThis;
require(path.join(__dirname, "../js/fisica.js"));
require(path.join(__dirname, "../js/nivel.js"));

const { T, FIS, crearMundo, crearJugador, pasoJugador, JUGADOR } = window.MonkyFisica;
const mapa = window.MonkyNivel.mapa;
const mundo = crearMundo(mapa);
const DT = 1 / 60;

const monedas = [];
const puas = [];
let inicio = null;
let meta = null;
const plataformas = [];

mapa.forEach((fila, cy) => {
  for (let cx = 0; cx < fila.length; cx++) {
    const ch = fila[cx];
    if (ch === "O") monedas.push({ cx, cy, x: cx * T + 2, y: cy * T + 2, w: 12, h: 12 });
    if (ch === "^") puas.push({ x: cx * T + 2, y: cy * T + 9, w: 12, h: 7 });
    if (ch === "M") inicio = { x: cx * T + 3, y: (cy + 1) * T - JUGADOR.h };
    if (ch === "Z") meta = { x: cx * T - 2, y: -64, w: 20, h: cy * T + 16 + 64 }; // igual que en el juego
    if (ch === "~") {
      // La plataforma móvil recorre 8 casillas: se modela como una franja
      // y además se exige que haya una moneda o meta alcanzable al otro lado.
      plataformas.push({ x: (cx - 1) * T, y: cy * T, w: 48 + 8 * T, h: 8, dx: 0 });
    }
  }
});

const solapan = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

function simular(x, y, accion) {
  const j = crearJugador(x, y);
  j.enSuelo = true;
  j.coyote = FIS.coyote;
  const tocadas = new Set();
  let enAire = false;
  let metaTocada = false;
  for (let f = 0; f < 200; f++) {
    let dir = accion.dir;
    let sostenido = false;
    if (accion.salta) {
      if (f === accion.carrera) j.buffer = FIS.buffer;
      sostenido = f >= accion.carrera && f < accion.carrera + accion.sostener;
      if (f >= accion.carrera && f < accion.carrera + accion.retraso) dir = 0;
    }
    pasoJugador(j, { dir, saltoSostenido: sostenido }, DT, mundo, plataformas);
    monedas.forEach((m, i) => { if (solapan(j, m)) tocadas.add(i); });
    if (meta && solapan(j, meta)) metaTocada = true;
    if (puas.some((p) => solapan(j, p))) return { muerte: "púas", tocadas };
    if (j.y > mundo.alto + 24) return { muerte: "vacío", tocadas };
    if (!j.enSuelo) enAire = true;
    else if (enAire) return { x: j.x, y: j.y, tocadas, metaTocada };
    if (metaTocada && j.enSuelo) return { x: j.x, y: j.y, tocadas, metaTocada };
  }
  return { x: j.x, y: j.y, tocadas, metaTocada, sinAterrizar: !j.enSuelo };
}

const acciones = [];
for (const dir of [-1, 0, 1]) {
  if (dir !== 0) acciones.push({ dir, salta: false });
  for (const carrera of [0, 4, 10, 20]) {
    for (const sostener of [3, 7, 12, 18, 40]) {
      for (const retraso of dir === 0 ? [0] : [0, 8, 16]) {
        acciones.push({ dir, salta: true, carrera, sostener, retraso });
      }
    }
  }
}

const seguras = new Set();
const peligrosas = new Set();
const toquesSeguros = new Map();
const toquesMortales = new Map();
const sumar = (mapa, i) => mapa.set(i, (mapa.get(i) || 0) + 1);
const visitados = new Map();
const cola = [];
let metaAlcanzada = false;

function agregar(x, y) {
  const clave = Math.round(x / 3) + "," + Math.round(y);
  if (visitados.has(clave)) return;
  visitados.set(clave, { x, y });
  cola.push({ x, y });
}

agregar(inicio.x, inicio.y);
while (cola.length) {
  const { x, y } = cola.shift();
  monedas.forEach((m, i) => { if (solapan({ x, y, w: JUGADOR.w, h: JUGADOR.h }, m)) seguras.add(i); });
  for (const accion of acciones) {
    const r = simular(x, y, accion);
    if (r.muerte) { r.tocadas.forEach((i) => { peligrosas.add(i); sumar(toquesMortales, i); }); continue; }
    r.tocadas.forEach((i) => { seguras.add(i); sumar(toquesSeguros, i); });
    if (r.metaTocada) metaAlcanzada = true;
    if (!r.sinAterrizar) agregar(r.x, r.y);
  }
}

const noAlcanzables = monedas.map((m, i) => i).filter((i) => !seguras.has(i) && !peligrosas.has(i));
const injustas = monedas.map((m, i) => i).filter((i) => !seguras.has(i) && peligrosas.has(i));
const desc = (i) => `col ${monedas[i].cx}, fila ${monedas[i].cy}`;

console.log(`Posiciones visitadas: ${visitados.size}`);
console.log(`Meta alcanzable: ${metaAlcanzada ? "sí" : "NO"}`);
console.log(`Monedas seguras: ${seguras.size}/${monedas.length}`);
console.log(`Monedas que solo se alcanzan cayendo o tocando púas (injustas): ${injustas.length ? injustas.map(desc).join(" · ") : "ninguna"}`);
console.log(`Monedas inalcanzables: ${noAlcanzables.length ? noAlcanzables.map(desc).join(" · ") : "ninguna"}`);

// Riesgo: proporción de intentos que tocan la moneda y terminan en muerte
const UMBRAL = 0.5;
const riesgosas = monedas.map((m, i) => i).filter((i) => {
  const s = toquesSeguros.get(i) || 0, mo = toquesMortales.get(i) || 0;
  return s + mo > 0 && mo / (s + mo) > UMBRAL;
});
console.log(`Monedas riesgosas (más del ${UMBRAL * 100}% de los intentos termina en caída): ${riesgosas.length ? riesgosas.map((i) => desc(i) + ` (${Math.round(100 * (toquesMortales.get(i) || 0) / ((toquesSeguros.get(i) || 0) + (toquesMortales.get(i) || 0)))}%)`).join(" · ") : "ninguna"}`);

// Pasillos bajos: un bloque sólido justo una casilla sobre el suelo (Monky mide 18 px)
const bajos = [];
for (let cy = 1; cy < mundo.filas; cy++) {
  for (let cx = 0; cx < mundo.columnas; cx++) {
    const suelo = mundo.esSolida(mundo.casilla(cx, cy)) && !mundo.esSolida(mundo.casilla(cx, cy - 1));
    if (suelo && cy >= 2 && mundo.casilla(cx, cy - 1) === "." && mundo.esSolida(mundo.casilla(cx, cy - 2))) bajos.push(`col ${cx}, fila ${cy - 1}`);
  }
}
console.log(`Pasillos de 1 casilla de alto: ${bajos.length ? bajos.join(" · ") : "ninguno"}`);

const ok = bajos.length === 0 && metaAlcanzada && injustas.length === 0 && noAlcanzables.length === 0 && riesgosas.length === 0;
console.log(ok ? "RESULTADO: OK" : "RESULTADO: HAY PROBLEMAS");
process.exitCode = ok ? 0 : 1;
