/* =========================================================
   MONKY DREAMS — PRUEBA DE LA ECONOMÍA (datos.js)
   Saldo, compras, equipamiento, cobro único de partidas,
   misiones, datos dañados y compatibilidad con el récord
   de versiones anteriores.

   Ejecutar:  node Juegos/monky-dreams/pruebas/tienda.js
   ========================================================= */
"use strict";
const path = require("path");

// localStorage simulado
function almacenNuevo(inicial) {
  const datos = Object.assign({}, inicial || {});
  return {
    getItem: (k) => (k in datos ? datos[k] : null),
    setItem: (k, v) => { datos[k] = String(v); },
    removeItem: (k) => { delete datos[k]; },
    _datos: datos
  };
}
globalThis.window = globalThis;
globalThis.localStorage = almacenNuevo();
require(path.join(__dirname, "../js/datos.js"));
const D = window.MonkyDatos;

let fallos = 0, total = 0;
function ok(cond, nombre, extra) {
  total++;
  if (!cond) fallos++;
  console.log((cond ? "OK    " : "FALLO ") + nombre + (extra !== undefined ? "  " + JSON.stringify(extra) : ""));
}
const nuevo = (inicial) => { const a = almacenNuevo(inicial); D._usarAlmacen(a); return a; };

/* 1. Estado inicial */
nuevo();
let d = D.cargar();
ok(d.saldo === 0 && d.comprados.join() === "monky" && d.equipado.personaje === "monky", "estado inicial: saldo 0, Monky gratis y equipado");

/* 2. Compatibilidad con el récord de versiones anteriores */
nuevo({ "monky-dreams-record": JSON.stringify({ metros: 1581, monedas: 10 }) });
ok(D.record().metros === 1581 && D.record().monedas === 10, "migra el récord guardado por la versión anterior", D.record());

/* 3. Partida: las monedas se suman al saldo una sola vez */
let a = nuevo();
const id = D.nuevaPartida();
let r = D.cerrarPartida({ id: id, metros: 320, monedas: 45, poderes: 1 });
ok(!r.repetida && r.ganadas === 45, "al terminar, las monedas de la partida se suman", r.ganadas);
const saldo1 = D.saldo();
ok(saldo1 === 45 + r.extra, "saldo = monedas + premios de misiones", { saldo: saldo1, extra: r.extra });
r = D.cerrarPartida({ id: id, metros: 320, monedas: 45, poderes: 1 });
ok(r.repetida && D.saldo() === saldo1, "cerrar dos veces la misma partida no duplica monedas");
// Otra "pestaña" con datos recargados tampoco puede cobrarla
D._usarAlmacen(almacenNuevo(a._datos));
r = D.cerrarPartida({ id: id, metros: 320, monedas: 45, poderes: 1 });
ok(r.repetida, "recargar la página y repetir el cobro no duplica");
D._usarAlmacen(a);
ok(D.record().metros === 320, "el récord se guarda", D.record());
ok(JSON.parse(a.getItem("monky-dreams-record")).metros === 320, "el récord también se guarda en la clave anterior");

/* 4. Compras */
nuevo();
D.cerrarPartida({ id: D.nuevaPartida(), metros: 10, monedas: 50, poderes: 0 });
const poco = D.saldo();
r = D.comprar("explorador");
ok(poco < 120 && !r.ok && r.motivo === "saldo insuficiente" && D.saldo() === poco, "no se puede comprar sin saldo suficiente", { saldo: poco, r: r });
D.cerrarPartida({ id: D.nuevaPartida(), metros: 10, monedas: 100, poderes: 0 });
const antes = D.saldo();
r = D.comprar("explorador");
ok(r.ok && D.saldo() === antes - 120, "comprar descuenta el precio", { antes: antes, despues: D.saldo() });
ok(D.tiene("explorador") && D.equipado().personaje === "explorador", "lo comprado queda desbloqueado y equipado");
r = D.comprar("explorador");
ok(!r.ok && r.motivo === "ya comprado" && D.saldo() === antes - 120, "no se puede comprar dos veces");
ok(!D.comprar("no-existe").ok, "un artículo inexistente no se compra");

/* 5. Equipamiento y compatibilidad */
a = nuevo();
D.cerrarPartida({ id: D.nuevaPartida(), metros: 10, monedas: 2000, poderes: 0 });
["gorro", "bufanda", "pijama", "nubi", "iman2"].forEach((x) => D.comprar(x));
ok(D.equipado().personaje === "nubi", "comprar un personaje lo equipa");
ok(D.equipado().cabeza === null && D.equipado().vestimenta === null, "Nubi no puede usar el gorro ni el pijama (se quitan)", D.equipado());
ok(D.equipado().cuello === "bufanda", "la bufanda le queda a Nubi", D.equipado());
ok(!D.equipar("gorro").ok, "no se puede equipar algo incompatible");
D.equipar("monky"); D.equipar("gorro"); D.equipar("pijama");
ok(D.equipado().cabeza === "gorro" && D.equipado().vestimenta === "pijama" && D.equipado().cuello === "bufanda", "Monky con gorro, pijama y bufanda", D.equipado());
D.equipar("sudadera");
ok(D.equipado().vestimenta === "pijama", "no se equipa lo que no está comprado");
D.quitar("cabeza");
ok(D.equipado().cabeza === null && D.tiene("gorro"), "quitar un accesorio no lo borra");
ok(D.mejoras().iman === true && D.mejoras().escudo === false, "las mejoras compradas se reportan", D.mejoras());
ok(!D.equipar("iman2").ok, "las mejoras no se equipan: siempre están activas");

/* 6. Datos dañados o manipulados */
nuevo({ "monky-dreams-datos": "{esto no es json" });
ok(D.saldo() === 0 && D.equipado().personaje === "monky", "JSON dañado: se empieza de cero sin romperse");
nuevo({ "monky-dreams-datos": JSON.stringify({ saldo: "999999999999", comprados: ["cyber", 5, "hack", "nubi"], equipado: { personaje: "dragon", cuello: "bufanda" }, record: { metros: -50, monedas: "x" }, misiones: { distancia: { nivel: -3 } }, cobradas: "nada" }) });
d = D.cargar();
ok(d.saldo === 9999999, "saldo gigante se limita", d.saldo);
ok(d.comprados.join() === "monky,cyber,nubi", "se descartan artículos inexistentes", d.comprados);
ok(d.equipado.personaje === "monky" && d.equipado.cuello === null, "equipo inválido o no comprado vuelve a Monky", d.equipado);
ok(d.record.metros === 0 && d.record.monedas === 0 && d.misiones.distancia.nivel === 0, "números inválidos se corrigen");
nuevo({ "monky-dreams-datos": JSON.stringify({ saldo: NaN, comprados: null, equipado: { personaje: "cyber" } }) });
ok(D.saldo() === 0 && D.equipado().personaje === "monky", "personaje no comprado no se puede equipar");
nuevo();
r = D.cerrarPartida({ id: D.nuevaPartida(), metros: -10, monedas: -500, poderes: "x" });
ok(D.saldo() >= 0 && r.ganadas === 0, "una partida con valores negativos no resta saldo", D.saldo());
r = D.cerrarPartida({ metros: 100, monedas: 100 });
ok(r.repetida && r.ganadas === 0, "una partida sin identificador no se cobra");

/* 7. Misiones */
nuevo();
let m = D.misiones();
ok(m.length === 3 && m.map((x) => x.tipo).join() === "distancia,monedas,poderes", "hay 3 misiones", m.map((x) => x.texto));
r = D.cerrarPartida({ id: D.nuevaPartida(), metros: 350, monedas: 30, poderes: 1 });
const tipos = r.premios.map((p) => p.tipo).join();
ok(tipos === "distancia,poderes", "distancia y poderes se cumplen en la partida", r.premios);
ok(D.saldo() === 30 + r.extra && r.extra > 0, "los premios se suman al saldo", { saldo: D.saldo(), extra: r.extra });
m = D.misiones();
ok(m[0].meta === 600 && m[2].meta === 2 && m[1].progreso === 30, "las misiones suben de nivel y el progreso de monedas se acumula", m.map((x) => x.meta + ":" + x.progreso));
r = D.cerrarPartida({ id: D.nuevaPartida(), metros: 100, monedas: 50, poderes: 0 });
ok(r.premios.some((p) => p.tipo === "monedas"), "la misión de monedas se cumple al acumular", D.misiones()[1]);
ok(D.misiones()[1].progreso === 40 && D.misiones()[1].meta === 70, "lo que sobra (30 + 50 - 40) cuenta para el siguiente nivel", D.misiones()[1]);
ok(D.misiones({ metros: 700, monedas: 0, poderes: 0 })[0].lista === true, "seguimiento en vivo durante la partida");

/* 8. Sin localStorage disponible */
D._usarAlmacen(null);
r = D.cerrarPartida({ id: D.nuevaPartida(), metros: 10, monedas: 5, poderes: 0 });
ok(D.saldo() === 5, "sin localStorage funciona en memoria durante la visita");

console.log(fallos ? `RESULTADO: ${fallos} de ${total} fallaron` : `RESULTADO: OK (${total} comprobaciones)`);
process.exitCode = fallos ? 1 : 0;
