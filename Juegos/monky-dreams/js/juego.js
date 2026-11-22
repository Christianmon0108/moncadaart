/* =========================================================
   MONKY DREAMS — ESQUELETO DEL JUEGO
   Menú principal, modos (Carrera infinita y Aventura),
   pausa, sonido, pantalla completa, récord y bucle a paso
   fijo de 1/60 s.
   ========================================================= */

(function () {
  "use strict";

  const PASO = 1 / 60;
  const P = window.MonkyPantalla;
  const E = window.MonkyEntrada;
  const Snd = window.MonkySonido;
  const HUD = window.MonkyHUD;
  const ESC = window.MonkyEscenario;
  const S = window.MonkySprites.construir();

  const lienzo = document.getElementById("juego");
  const ctx = lienzo.getContext("2d");

  /* -------------------------------------------------------
     RÉCORD (localStorage, con respaldo si no está disponible)
     ------------------------------------------------------- */
  const CLAVE_RECORD = "monky-dreams-record";
  let record = { metros: 0, monedas: 0 };
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_RECORD) || "null");
    if (guardado && typeof guardado.metros === "number") record = guardado;
  } catch (error) { /* sin almacenamiento: el récord dura esta visita */ }

  function guardarRecord() {
    try { localStorage.setItem(CLAVE_RECORD, JSON.stringify(record)); } catch (error) { /* nada */ }
  }

  /* -------------------------------------------------------
     MODOS
     ------------------------------------------------------- */
  const deps = { sprites: S, entrada: E, aviso: mostrarAviso, fin: alTerminar };
  const modos = {
    carrera: window.MonkyCarrera(deps),
    aventura: window.MonkyAventura(deps)
  };
  let modo = null;
  let estado = "menu";
  let tiempo = 0;

  /* -------------------------------------------------------
     PORTADA (dibujada en el lienzo)
     ------------------------------------------------------- */
  const fondoMenu = ESC.construirFondo("noche", 0);
  const logoMonky = HUD.construirPalabra(S.crearCanvas, "MONKY", ["#fffaf0", "#fff1d6", "#f3e4c8", "#e0c9a2"]);
  const logoDreams = HUD.construirPalabra(S.crearCanvas, "DREAMS", ["#ffe08a", "#ffb35a", "#e8792e", "#c95f1f"]);
  const nubeTitulo = (function () {
    const w = 84, h = 22, c = S.crearCanvas(w, h), g = c.getContext("2d");
    const dentro = (x, y) => x >= 0 && y >= 0 && x < w && y < h && (Math.hypot(x - 14, y - 13) < 8 || Math.hypot(x - 30, y - 9) < 9 ||
      Math.hypot(x - 42, y - 8) < 8.5 || Math.hypot(x - 54, y - 9) < 8 || Math.hypot(x - 69, y - 13) < 8 || (y > 10 && y < 20 && x > 8 && x < 76));
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!dentro(x, y)) continue;
      const borde = !dentro(x - 1, y) || !dentro(x + 1, y) || !dentro(x, y - 1) || !dentro(x, y + 1);
      g.fillStyle = borde ? "#16152a" : !dentro(x, y - 2) ? "#ffffff" : y > h - 5 ? "#c9b8ea" : y > h - 7 ? "#e7dcf6" : "#fff4de";
      g.fillRect(x, y, 1, 1);
    }
    return c;
  })();
  let zetas = [];
  let relojZetas = 0;

  function actualizarMenu(dt) {
    relojZetas -= dt;
    if (relojZetas <= 0) { relojZetas = 0.9; zetas.push({ x: 10, y: 0, vida: 2.6, fase: Math.random() * 6 }); }
    zetas.forEach((z) => { z.vida -= dt; z.y -= 11 * dt; z.x += (6 + Math.sin(tiempo * 2 + z.fase) * 8) * dt; });
    zetas = zetas.filter((z) => z.vida > 0);
  }

  function dibujarMenu(W, H) {
    const camX = 300 + Math.sin(tiempo * 0.05) * 300;
    fondoMenu.dibujar(ctx, camX, tiempo, W, H);
    const arriba = Math.max(8, Math.round((H - 180) / 2) + 6);
    const flota = Math.round(Math.sin(tiempo * 1.3) * 1.5);
    ctx.drawImage(logoMonky, Math.round(W / 2 - logoMonky.width / 2), arriba + flota);
    ctx.drawImage(logoDreams, Math.round(W / 2 - logoDreams.width / 2), arriba + 26 + flota);
    const sub = "UN JUEGO DE MONCADAART";
    HUD.texto(ctx, sub, Math.round(W / 2 - HUD.anchoTexto(sub) / 2), arriba + 56, "#ffb35a", "#16152a");
    const ny = arriba + 84 + Math.round(Math.sin(tiempo * 1.1) * 2);
    const nx = Math.round(W * 0.78 - nubeTitulo.width / 2);
    ctx.drawImage(nubeTitulo, nx, ny);
    ctx.drawImage(S.mono.dormido[Math.floor(tiempo * 1.2) % 2].der, nx + 33, ny - 15);
    zetas.forEach((z) => {
      ctx.globalAlpha = Math.min(1, z.vida / 2.6);
      HUD.texto(ctx, "Z", nx + 52 + z.x, ny - 18 + z.y, "#fff1d0", "#16152a");
    });
    ctx.globalAlpha = 1;
    fondoMenu.dibujarFrente(ctx, camX, tiempo, W, H);
  }

  /* -------------------------------------------------------
     INTERFAZ HTML
     ------------------------------------------------------- */
  const $ = (id) => document.getElementById(id);
  const ui = {
    inicio: $("pantalla-inicio"),
    pausa: $("pantalla-pausa"),
    finCarrera: $("pantalla-fin-carrera"),
    victoria: $("pantalla-victoria"),
    derrota: $("pantalla-derrota"),
    aviso: $("aviso"),
    sonido: $("btn-sonido"),
    pausar: $("btn-pausa"),
    pantalla: $("btn-pantalla")
  };
  const pantallas = [ui.inicio, ui.pausa, ui.finCarrera, ui.victoria, ui.derrota];

  function mostrarPantalla(pantalla) {
    pantallas.forEach((p) => { p.hidden = p !== pantalla; });
    ui.pausar.hidden = !(estado === "jugando" || estado === "pausa");
    document.body.classList.toggle("en-juego", estado === "jugando");
    document.body.classList.toggle("en-titulo", estado === "menu");
    document.body.classList.toggle("modo-carrera", !!modo && modo.nombre === "carrera" && estado !== "menu");
    document.body.classList.toggle("modo-aventura", !!modo && modo.nombre === "aventura" && estado !== "menu");
    E.fijarJugando(estado === "jugando");
    if (pantalla) {
      const principal = pantalla.querySelector("[data-principal]");
      if (principal) principal.focus({ preventScroll: true });
    } else {
      lienzo.focus({ preventScroll: true });
    }
  }

  let relojAviso = null;
  function mostrarAviso(mensaje) {
    ui.aviso.textContent = mensaje;
    ui.aviso.classList.add("visible");
    clearTimeout(relojAviso);
    relojAviso = setTimeout(() => ui.aviso.classList.remove("visible"), 2800);
  }

  function actualizarRecordMenu() {
    $("record-menu").textContent = record.metros > 0
      ? "Récord: " + record.metros + " m · " + record.monedas + " monedas"
      : "¡Todavía no hay récord! Corre lo más lejos que puedas.";
  }

  const formatoTiempo = (s) => Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");

  function alTerminar(r) {
    estado = "fin";
    if (r.tipo === "carrera") {
      const nuevo = r.metros > record.metros;
      if (nuevo) record.metros = r.metros;
      if (r.monedas > record.monedas) record.monedas = r.monedas;
      guardarRecord();
      $("fc-titulo").textContent = r.motivo === "atrapado" ? "¡La sombra te atrapó!" : "Fin de la carrera";
      $("fc-metros").textContent = r.metros + " m";
      $("fc-monedas").textContent = r.monedas;
      $("fc-record").textContent = record.metros + " m";
      $("fc-nuevo").hidden = !nuevo;
      mostrarPantalla(ui.finCarrera);
    } else if (r.tipo === "victoria") {
      $("res-monedas").textContent = r.monedas + "/" + r.total;
      $("res-tiempo").textContent = formatoTiempo(r.tiempo);
      $("res-vidas").textContent = r.vidas + "/" + r.vidasMax;
      $("res-mensaje").textContent = r.monedas === r.total
        ? "¡Sueño perfecto! Reuniste todas las monedas."
        : "Reuniste " + r.monedas + " de " + r.total + " monedas. Aún quedan algunas por descubrir.";
      mostrarPantalla(ui.victoria);
    } else {
      mostrarPantalla(ui.derrota);
    }
  }

  function empezar(nombre) {
    Snd.activar();
    Snd.reproducir("boton");
    E.soltarTodo();
    modo = modos[nombre];
    estado = "jugando";
    modo.iniciar();
    mostrarPantalla(null);
    requestAnimationFrame(P.medir);
  }

  function irAlMenu() {
    estado = "menu";
    modo = null;
    E.soltarTodo();
    actualizarRecordMenu();
    mostrarPantalla(ui.inicio);
  }

  function alternarPausa() {
    if (estado === "jugando") {
      estado = "pausa";
      E.soltarTodo();
      mostrarPantalla(ui.pausa);
    } else if (estado === "pausa") {
      estado = "jugando";
      mostrarPantalla(null);
    }
  }

  function alternarSonido() {
    Snd.activar();
    const silencio = Snd.alternarSilencio();
    ui.sonido.setAttribute("aria-pressed", String(silencio));
    ui.sonido.setAttribute("aria-label", silencio ? "Activar sonido" : "Silenciar sonido");
    ui.sonido.classList.toggle("apagado", silencio);
  }

  function alternarPantallaCompleta() {
    if (!P.pantallaCompletaDisponible) {
      mostrarAviso(P.esIOS ? "En iPhone: Compartir → Agregar a pantalla de inicio" : "Tu navegador no permite pantalla completa");
      return;
    }
    P.alternarPantallaCompleta().then((ok) => {
      if (!ok && !P.pantallaCompletaActiva()) mostrarAviso("No se pudo activar la pantalla completa");
    });
  }

  function actualizarBotonPantalla() {
    ui.pantalla.classList.toggle("activa", P.pantallaCompletaActiva());
    ui.pantalla.setAttribute("aria-label", P.pantallaCompletaActiva() ? "Salir de pantalla completa" : "Pantalla completa");
  }
  ["fullscreenchange", "webkitfullscreenchange"].forEach((e) => document.addEventListener(e, actualizarBotonPantalla));

  // El botón se muestra si hay pantalla completa o si hay una alternativa que explicar (iPhone)
  ui.pantalla.hidden = !(P.pantallaCompletaDisponible || (P.esIOS && !P.instalada));
  $("consejo-ios").hidden = !(P.esIOS && !P.instalada);

  document.querySelectorAll("[data-accion]").forEach((boton) => {
    boton.addEventListener("click", () => {
      const accion = boton.getAttribute("data-accion");
      if (accion === "carrera" || accion === "aventura") {
        // En celulares, pedir pantalla completa horizontal aprovechando el toque
        if (accion === "carrera" && document.body.classList.contains("tactil") &&
            P.pantallaCompletaDisponible && !P.pantallaCompletaActiva()) {
          P.alternarPantallaCompleta();
        }
        empezar(accion);
      } else if (accion === "reintentar") empezar(modo ? modo.nombre : "carrera");
      else if (accion === "pausa" || accion === "continuar") alternarPausa();
      else if (accion === "sonido") alternarSonido();
      else if (accion === "pantalla") alternarPantallaCompleta();
      else if (accion === "menu") irAlMenu();
    });
  });

  E.on("pausa", alternarPausa);
  E.on("sonido", alternarSonido);
  E.on("pantalla", alternarPantallaCompleta);
  E.on("enter", () => {
    if (estado === "menu") empezar("carrera");
    else if (estado === "fin") empezar(modo ? modo.nombre : "carrera");
    else if (estado === "pausa") alternarPausa();
  });
  E.on("tactil", () => requestAnimationFrame(P.medir));

  window.addEventListener("blur", () => { E.soltarTodo(); if (estado === "jugando") alternarPausa(); });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { E.soltarTodo(); if (estado === "jugando") alternarPausa(); }
  });

  if (Snd.estaSilenciado()) {
    ui.sonido.classList.add("apagado");
    ui.sonido.setAttribute("aria-pressed", "true");
  }

  /* Retrato en celular: el juego arriba y un aviso para girar */
  function actualizarOrientacion() {
    const retrato = window.innerHeight > window.innerWidth * 1.05;
    document.body.classList.toggle("retrato", retrato);
    requestAnimationFrame(P.medir);
  }
  window.addEventListener("resize", actualizarOrientacion);
  actualizarOrientacion();

  /* -------------------------------------------------------
     BUCLE PRINCIPAL
     ------------------------------------------------------- */
  let ultimo = performance.now();
  let acumulado = 0;
  let turbo = 1;

  function bucle(ahora) {
    let dt = (ahora - ultimo) / 1000;
    ultimo = ahora;
    if (dt > 0.25) dt = 0.25;
    acumulado += dt * turbo;
    let pasos = 0;
    const maxPasos = 6 * turbo;
    while (acumulado >= PASO && pasos < maxPasos) {
      tiempo += PASO;
      if (estado === "menu") actualizarMenu(PASO);
      else if (modo && (estado === "jugando" || estado === "fin")) modo.actualizar(PASO);
      acumulado -= PASO;
      pasos++;
    }
    if (pasos >= maxPasos) acumulado = 0;

    const { W, H } = P.estado;
    if (estado === "menu" || !modo) dibujarMenu(W, H);
    else modo.dibujar(ctx, W, H, record.metros);
    requestAnimationFrame(bucle);
  }

  P.alCambiar((W, H) => { if (modos.carrera.redimensionar) modos.carrera.redimensionar(W, H); });
  P.medir();
  actualizarRecordMenu();
  mostrarPantalla(ui.inicio);
  requestAnimationFrame(bucle);

  /* -------------------------------------------------------
     API DE DEPURACIÓN (solo lectura salvo con ?depurar)
     ------------------------------------------------------- */
  const actual = () => (modo ? modo.depuracion : null);
  window.MonkyDreams = {
    estado: () => (estado === "jugando" && modo ? modo.estado() : estado),
    modo: () => (modo ? modo.nombre : null),
    pantalla: () => Object.assign({}, P.estado),
    record: () => Object.assign({}, record),
    pantallaCompletaDisponible: P.pantallaCompletaDisponible,
    jugador: () => actual() && actual().jugador(),
    recogidos: () => actual() && actual().recogidos && actual().recogidos(),
    totales: () => actual() && actual().totales && actual().totales(),
    plataformas: () => actual() && actual().plataformas && actual().plataformas(),
    enemigos: () => actual() && actual().enemigos && actual().enemigos(),
    entrada: () => E.estado(),
    carrera: modos.carrera.depuracion,
    aventura: modos.aventura.depuracion
  };
  if (new URLSearchParams(window.location.search).has("depurar")) {
    window.MonkyDreams.depurar = {
      teletransportar: (c, f) => modos.aventura.depuracion.teletransportar(c, f),
      quitarVida: () => actual() && actual().quitarVida(),
      turbo: (n) => { turbo = Math.max(1, n | 0); },
      empezar: (nombre) => empezar(nombre)
    };
  }
})();
