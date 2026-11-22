/* =========================================================
   MONKY DREAMS — PANTALLA
   Adapta la resolución interna al espacio disponible:
   - la altura mínima es 180 px de juego y el ancho mínimo 320,
   - cada pixel del juego ocupa un número ENTERO de pixeles
     físicos (nada de suavizado ni pixeles desparejos),
   - el área visible crece para llenar toda la pantalla en
     cualquier proporción (16:9, 19.5:9, 4:3...).
   También gestiona la pantalla completa y la orientación.
   ========================================================= */

window.MonkyPantalla = (function () {
  "use strict";

  const MIN_W = 320, MIN_H = 180, MAX_W = 480, MAX_H = 272;

  const lienzo = document.getElementById("juego");
  const caja = document.querySelector(".escenario");
  const raiz = document.documentElement;
  const oyentes = [];

  const estado = { W: MIN_W, H: MIN_H, escala: 1, pxCss: 1, dpr: 1 };

  function medir() {
    const dpr = window.devicePixelRatio || 1;
    const r = caja.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const dw = Math.round(r.width * dpr);
    const dh = Math.round(r.height * dpr);

    // Escala entera más grande que respete el tamaño mínimo
    const s = Math.max(1, Math.floor(Math.min(dw / MIN_W, dh / MIN_H)));
    const W = Math.min(MAX_W, Math.ceil(dw / s));
    const H = Math.min(MAX_H, Math.ceil(dh / s));

    const cambio = W !== estado.W || H !== estado.H || s !== estado.escala || dpr !== estado.dpr;
    Object.assign(estado, { W: W, H: H, escala: s, pxCss: s / dpr, dpr: dpr });

    lienzo.style.width = (W * s) / dpr + "px";
    lienzo.style.height = (H * s) / dpr + "px";
    raiz.style.setProperty("--px", Math.max(1.5, s / dpr) + "px");

    if (lienzo.width !== W || lienzo.height !== H) {
      lienzo.width = W;
      lienzo.height = H;
    }
    lienzo.getContext("2d").imageSmoothingEnabled = false;
    if (cambio) oyentes.forEach((f) => f(W, H));
  }

  window.addEventListener("resize", () => requestAnimationFrame(medir));
  window.addEventListener("orientationchange", () => setTimeout(medir, 250));
  if (window.visualViewport) window.visualViewport.addEventListener("resize", () => requestAnimationFrame(medir));
  if (window.ResizeObserver) new ResizeObserver(() => medir()).observe(caja);

  /* ---------- Pantalla completa ---------- */
  const disponible = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled) &&
    !!(raiz.requestFullscreen || raiz.webkitRequestFullscreen);

  const activa = () => !!(document.fullscreenElement || document.webkitFullscreenElement);

  /* Debe llamarse desde un toque o clic del usuario */
  function alternarPantallaCompleta() {
    if (!disponible) return Promise.resolve(false);
    try {
      if (activa()) {
        const salir = document.exitFullscreen || document.webkitExitFullscreen;
        return Promise.resolve(salir.call(document)).then(() => false).catch(() => false);
      }
      const pedir = raiz.requestFullscreen || raiz.webkitRequestFullscreen;
      return Promise.resolve(pedir.call(raiz, { navigationUI: "hide" }))
        .then(() => {
          // Fijar horizontal solo si el navegador lo permite
          if (screen.orientation && typeof screen.orientation.lock === "function") {
            return screen.orientation.lock("landscape").then(() => true).catch(() => true);
          }
          return true;
        })
        .catch(() => false);
    } catch (error) {
      return Promise.resolve(false);
    }
  }

  ["fullscreenchange", "webkitfullscreenchange"].forEach((e) =>
    document.addEventListener(e, () => setTimeout(medir, 60)));

  /* iPhone/iPad no permiten pantalla completa en páginas: se ofrece
     agregar el juego a la pantalla de inicio (abre a pantalla completa) */
  const esIOS = /iP(hone|ad|od)/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const instalada = window.matchMedia && (window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;

  /* Zona ocupada por los botones de arriba (pausa, sonido, pantalla completa),
     en pixeles del juego: el HUD dibujado en el lienzo nunca se mete debajo */
  const botones = document.getElementById("hud-botones");
  function zonaBotones() {
    const r = lienzo.getBoundingClientRect();
    const visibles = botones ? [...botones.children].filter((b) => !b.hidden) : [];
    if (!visibles.length || !r.width) return { x: estado.W, alto: 0 };
    let izq = Infinity, abajo = 0;
    visibles.forEach((b) => { const q = b.getBoundingClientRect(); izq = Math.min(izq, q.left); abajo = Math.max(abajo, q.bottom); });
    const k = estado.W / r.width;
    return { x: Math.floor((izq - r.left) * k) - 2, alto: Math.ceil((abajo - r.top) * k) + 2 };
  }

  return {
    estado: estado,
    medir: medir,
    zonaBotones: zonaBotones,
    alCambiar: (f) => oyentes.push(f),
    pantallaCompletaDisponible: disponible,
    pantallaCompletaActiva: activa,
    alternarPantallaCompleta: alternarPantallaCompleta,
    esIOS: esIOS,
    instalada: instalada
  };
})();
