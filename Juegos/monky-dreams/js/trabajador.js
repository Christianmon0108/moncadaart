/* =========================================================
   MONKY DREAMS — GENERADOR EN SEGUNDO PLANO (Web Worker)
   Crea y valida los tramos fuera del hilo principal, así el
   juego no se traba en celulares lentos. Es el mismo
   generador (misma semilla, mismos tramos) que en las pruebas.
   ========================================================= */
/* global importScripts, MonkyGenerador */
importScripts("fisica.js", "generador.js");

let gen = null;

self.onmessage = function (e) {
  const m = e.data || {};
  if (m.tipo === "iniciar") {
    gen = MonkyGenerador.crearGenerador(m.semilla);
    // Saltea los tramos que el hilo principal ya generó por su cuenta
    for (let i = 0; i < (m.saltar || 0); i++) gen.siguiente();
  } else if (m.tipo === "pedir" && gen) {
    const lista = [];
    for (let i = 0; i < (m.cantidad || 1); i++) lista.push(gen.siguiente());
    self.postMessage({ tipo: "tramos", partida: m.partida, lista: lista });
  } else if (m.tipo === "estrella" && gen) {
    gen.pedirEstrella();
  }
};
