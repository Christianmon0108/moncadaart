/* =========================================================
   MONKY RUN — ENTRADA (teclado y táctil)
   Aventura: flechas ◀ ▶ y botón de salto.
   Carrera:  mitad derecha de la pantalla = saltar,
             mitad izquierda = deslizarse.
   ========================================================= */

window.MonkyEntrada = (function () {
  "use strict";

  const teclas = { izq: false, der: false, saltar: false, abajo: false };
  const tactil = { izq: false, der: false, saltar: false, abajo: false };
  let pulso = false;
  let jugando = false;
  const oyentes = {};

  const emitir = (nombre) => (oyentes[nombre] || []).forEach((f) => f());

  const MAPA = {
    ArrowLeft: "izq", KeyA: "izq",
    ArrowRight: "der", KeyD: "der",
    ArrowUp: "saltar", KeyW: "saltar", Space: "saltar", KeyZ: "saltar", KeyK: "saltar",
    ArrowDown: "abajo", KeyS: "abajo"
  };

  function presionarSalto(fuente) {
    if (!fuente.saltar && jugando) pulso = true;
    fuente.saltar = true;
  }

  window.addEventListener("keydown", (e) => {
    const accion = MAPA[e.code];
    const enBoton = document.activeElement && document.activeElement.tagName === "BUTTON";
    if (accion) {
      if (jugando || !enBoton) e.preventDefault();
      if (accion === "saltar") presionarSalto(teclas);
      else teclas[accion] = true;
      return;
    }
    if (e.code === "KeyP" || e.code === "Escape") {
      if (e.code === "Escape" && (document.fullscreenElement || document.webkitFullscreenElement)) return;
      e.preventDefault();
      emitir("pausa");
    } else if (e.code === "KeyM") emitir("sonido");
    else if (e.code === "KeyF") emitir("pantalla");
    else if (e.code === "Enter" && !enBoton) emitir("enter");
  });

  window.addEventListener("keyup", (e) => {
    const accion = MAPA[e.code];
    if (accion) teclas[accion] = false;
  });

  /* ---------- Táctil ---------- */
  const el = (id) => document.getElementById(id);
  const cruceta = el("cruceta"), btnIzq = el("btn-izq"), btnDer = el("btn-der"), btnSaltar = el("btn-saltar");
  const zonaSaltar = el("zona-saltar"), zonaAbajo = el("zona-abajo");
  const punterosCruceta = new Map();

  function marcar() {
    btnIzq.classList.toggle("activo", tactil.izq);
    btnDer.classList.toggle("activo", tactil.der);
    btnSaltar.classList.toggle("activo", tactil.saltar);
    zonaSaltar.classList.toggle("activo", tactil.saltar);
    zonaAbajo.classList.toggle("activo", tactil.abajo);
  }

  function activarTactil() {
    if (!document.body.classList.contains("tactil")) {
      document.body.classList.add("tactil");
      emitir("tactil");
    }
  }

  function ladoCruceta(e) {
    const d = (b) => { const r = b.getBoundingClientRect(); return Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)); };
    return d(btnIzq) <= d(btnDer) ? "izq" : "der";
  }

  function actualizarCruceta() {
    const lados = Array.from(punterosCruceta.values());
    tactil.izq = lados.includes("izq");
    tactil.der = lados.includes("der");
    marcar();
  }

  cruceta.addEventListener("pointerdown", (e) => {
    e.preventDefault(); activarTactil();
    cruceta.setPointerCapture(e.pointerId);
    punterosCruceta.set(e.pointerId, ladoCruceta(e));
    actualizarCruceta();
  });
  cruceta.addEventListener("pointermove", (e) => {
    if (!punterosCruceta.has(e.pointerId)) return;
    punterosCruceta.set(e.pointerId, ladoCruceta(e));
    actualizarCruceta();
  });
  ["pointerup", "pointercancel", "lostpointercapture"].forEach((t) => cruceta.addEventListener(t, (e) => {
    punterosCruceta.delete(e.pointerId);
    actualizarCruceta();
  }));

  /* Botones de mantener presionado (salto de Aventura y zonas de Carrera) */
  function botonSostenido(elemento, campo) {
    const punteros = new Set();
    elemento.addEventListener("pointerdown", (e) => {
      e.preventDefault(); activarTactil();
      elemento.setPointerCapture(e.pointerId);
      punteros.add(e.pointerId);
      if (campo === "saltar") presionarSalto(tactil); else tactil[campo] = true;
      marcar();
    });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach((t) => elemento.addEventListener(t, (e) => {
      punteros.delete(e.pointerId);
      if (!punteros.size) { tactil[campo] = false; marcar(); }
    }));
    elemento.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  botonSostenido(btnSaltar, "saltar");
  botonSostenido(zonaSaltar, "saltar");
  botonSostenido(zonaAbajo, "abajo");
  cruceta.addEventListener("contextmenu", (e) => e.preventDefault());

  if ((window.matchMedia && window.matchMedia("(pointer: coarse)").matches) ||
      new URLSearchParams(window.location.search).has("tactil")) {
    activarTactil();
  }
  window.addEventListener("touchstart", activarTactil, { passive: true, once: true });

  function soltarTodo() {
    Object.keys(teclas).forEach((k) => { teclas[k] = false; });
    Object.keys(tactil).forEach((k) => { tactil[k] = false; });
    punterosCruceta.clear();
    pulso = false;
    marcar();
  }

  return {
    get izq() { return teclas.izq || tactil.izq; },
    get der() { return teclas.der || tactil.der; },
    get saltar() { return teclas.saltar || tactil.saltar; },
    get abajo() { return teclas.abajo || tactil.abajo; },
    tomarPulso() { const p = pulso; pulso = false; return p; },
    soltarTodo: soltarTodo,
    fijarJugando(valor) { jugando = valor; if (!valor) pulso = false; },
    on(nombre, f) { (oyentes[nombre] = oyentes[nombre] || []).push(f); },
    estado() { return { izq: this.izq, der: this.der, saltar: this.saltar, abajo: this.abajo }; }
  };
})();
