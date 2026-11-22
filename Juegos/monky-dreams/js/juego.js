/* =========================================================
   MONKY RUN: EL GRAN BORRADOR — ESQUELETO DEL JUEGO
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
  const D = window.MonkyDatos;
  const PJ = window.MonkyPersonajes;
  // El personaje equipado reemplaza a Monky en todos los modos
  function aplicarEquipo() { S.mono = PJ.construir(D.equipado()); }
  aplicarEquipo();

  /* Íconos pixel para la interfaz HTML (moneda, bandera y rayo) */
  (function () {
    const raiz = document.documentElement.style;
    raiz.setProperty("--img-moneda", "url(" + S.moneda[0].der.toDataURL() + ")");
    const icono = (filas, colores) => {
      const c = S.crearCanvas(filas[0].length, filas.length), g = c.getContext("2d");
      filas.forEach((f, y) => { for (let x = 0; x < f.length; x++) if (colores[f[x]]) { g.fillStyle = colores[f[x]]; g.fillRect(x, y, 1, 1); } });
      return "url(" + c.toDataURL() + ")";
    };
    raiz.setProperty("--img-bandera", icono([
      ".kkkkkk..", ".kooooak.", ".kooaaak.", ".koooook.", ".kkkkkk..", ".k.......", ".k.......", ".k.......", "kkk......"
    ], { k: "#16152a", o: "#e8792e", a: "#ffe08a" }));
    raiz.setProperty("--img-rayo", icono([
      "....kkkk.", "...kyyk..", "..kyyk...", ".kyyykkk.", ".kkkyyyk.", "...kyyk..", "..kyyk...", "..kyk....", "..kk....."
    ], { k: "#16152a", y: "#ffe08a" }));
  })();

  const lienzo = document.getElementById("juego");
  const ctx = lienzo.getContext("2d");

  /* -------------------------------------------------------
     RÉCORD: vive en datos.js (que también lee el récord de
     versiones anteriores). Se guarda una copia para dibujar.
     ------------------------------------------------------- */
  let record = D.record();

  /* -------------------------------------------------------
     MODOS
     ------------------------------------------------------- */
  const deps = {
    sprites: S, entrada: E, aviso: mostrarAviso, fin: alTerminar, botones: P.zonaBotones,
    mejoras: () => D.mejoras(),
    misiones: () => D.misiones(),
    // Próximo artículo que se podría comprar con lo que se junte en la partida
    metaCompra: () => {
      const d = D.leer();
      const pendientes = D.CATALOGO.filter((a) => d.comprados.indexOf(a.id) < 0 && a.precio > d.saldo).sort((a, b) => a.precio - b.precio);
      return pendientes.length ? { nombre: pendientes[0].nombre, precio: pendientes[0].precio, saldo: d.saldo } : null;
    }
  };
  const modos = {
    carrera: window.MonkyCarrera(deps),
    aventura: window.MonkyAventura(deps)
  };
  let modo = null;
  let estado = "menu";
  let tiempo = 0;
  let partida = null; // partida de la Carrera en curso (se cobra una sola vez)
  const tienda = window.MonkyTienda({ sprites: S, alCambiarEquipo: () => { aplicarEquipo(); actualizarMenu(); } });

  /* -------------------------------------------------------
     PORTADA (dibujada en el lienzo): Monky huye del Gran
     Borrador sobre una hoja de cuaderno
     ------------------------------------------------------- */
  const fondoMenu = ESC.construirFondo("cuaderno", 0);
  const logoMonky = HUD.construirPalabra(S.crearCanvas, "MONKY", ["#fffaf0", "#fff1d6", "#f3e4c8", "#e0c9a2"]);
  const logoRun = HUD.construirPalabra(S.crearCanvas, "RUN", ["#ffe08a", "#ffb35a", "#e8792e", "#c95f1f"]);
  let migasMenu = [];

  function animarMenu(dt) {
    if (estado === "tienda") tienda.dibujar(dt);
    if (Math.random() < 0.4) migasMenu.push({ x: 0, y: 0, vx: -20 - Math.random() * 30, vy: -10 - Math.random() * 30, vida: 0.7, color: Math.random() < 0.5 ? "#ff8fab" : "#c9b8b0" });
    migasMenu.forEach((m) => { m.vida -= dt; m.vy += 150 * dt; m.x += m.vx * dt; m.y += m.vy * dt; });
    migasMenu = migasMenu.filter((m) => m.vida > 0);
  }

  function dibujarMenu(W, H) {
    const camX = tiempo * 30;
    fondoMenu.dibujar(ctx, camX, tiempo, W, H);
    // Suelo: borde de hojas sobre cartón
    const suelo = H - 26;
    ctx.fillStyle = "#16152a"; ctx.fillRect(0, suelo - 1, W, 1);
    ctx.fillStyle = "#f6efe0"; ctx.fillRect(0, suelo, W, 5);
    ctx.fillStyle = "#9cc3e6"; ctx.fillRect(0, suelo + 2, W, 1);
    ctx.fillStyle = "#9a7650"; ctx.fillRect(0, suelo + 5, W, H - suelo - 5);
    for (let x = -Math.floor(camX % 12); x < W; x += 12) { ctx.fillStyle = "#b8946a"; ctx.fillRect(x, suelo + 10, 4, 1); }

    const arriba = Math.max(6, Math.round((H - 180) / 2) + 4);
    const flota = Math.round(Math.sin(tiempo * 1.3) * 1.5);
    const anchoLogo = logoMonky.width + 10 + logoRun.width;
    const lx = Math.round(W / 2 - anchoLogo / 2);
    ctx.drawImage(logoMonky, lx, arriba + flota);
    ctx.drawImage(logoRun, lx + logoMonky.width + 10, arriba + flota);
    const sub = "EL GRAN BORRADOR";
    const anchoSub = HUD.anchoTexto(sub, 2);
    HUD.panel(ctx, Math.round(W / 2 - anchoSub / 2 - 6), arriba + 29, anchoSub + 12, 16);
    HUD.texto(ctx, sub, Math.round(W / 2 - anchoSub / 2), arriba + 32, "#ff8fab", "#16152a", 2);
    const firma = "UN JUEGO DE MONCADAART";
    HUD.texto(ctx, firma, Math.round(W / 2 - HUD.anchoTexto(firma) / 2), arriba + 49, "#5a5f73", "#fff7e8");

    // El Gran Borrador persigue al personaje elegido
    const mx = Math.round(Math.min(W - 26, W * 0.5 + 118));
    const bx = mx - 116 + Math.round(Math.sin(tiempo * 0.9) * 6);
    const sprite = S.borrador[Math.floor(tiempo * 9) % 4].der;
    ctx.drawImage(sprite, bx, suelo - 82);
    for (let k = 0; k < 4; k++) {
      const f = ((tiempo * 0.6 + k / 4) % 1), r = 2 + Math.round(f * 4);
      ctx.fillStyle = "rgba(60, 64, 80, " + (0.6 - f * 0.55).toFixed(2) + ")";
      ctx.fillRect(Math.round(bx + 16 - r - f * 14), Math.round(suelo - 80 - f * 24), r * 2, r * 2);
    }
    migasMenu.forEach((m) => { ctx.fillStyle = m.color; ctx.fillRect(Math.round(bx + 96 + m.x), Math.round(suelo - 20 + m.y), 1, 1); });
    const monky = S.mono.correr[Math.floor(tiempo * 12) % 6].der;
    ctx.drawImage(monky, mx - 9, suelo - monky.height);
    fondoMenu.dibujarFrente(ctx, camX, tiempo, W, H);
  }

  /* -------------------------------------------------------
     INTERFAZ HTML
     ------------------------------------------------------- */
  const $ = (id) => document.getElementById(id);
  const ui = {
    inicio: $("pantalla-inicio"),
    tienda: $("pantalla-tienda"),
    misiones: $("pantalla-misiones"),
    pausa: $("pantalla-pausa"),
    finCarrera: $("pantalla-fin-carrera"),
    victoria: $("pantalla-victoria"),
    derrota: $("pantalla-derrota"),
    aviso: $("aviso"),
    sonido: $("btn-sonido"),
    pausar: $("btn-pausa"),
    pantalla: $("btn-pantalla")
  };
  const pantallas = [ui.inicio, ui.tienda, ui.misiones, ui.pausa, ui.finCarrera, ui.victoria, ui.derrota];

  function mostrarPantalla(pantalla) {
    pantallas.forEach((p) => { p.hidden = p !== pantalla; });
    ui.pausar.hidden = !(estado === "jugando" || estado === "pausa");
    document.body.classList.toggle("en-juego", estado === "jugando");
    document.body.classList.toggle("en-titulo", estado === "menu");
    document.body.classList.toggle("en-tienda", estado === "tienda");
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

  function actualizarMenu() {
    record = D.record();
    $("record-menu").textContent = record.metros > 0
      ? "Récord: " + record.metros + " m · " + record.monedas + " monedas"
      : "¡Todavía no hay récord! Corre lo más lejos que puedas.";
    document.querySelectorAll("[data-saldo]").forEach((el) => { el.textContent = D.saldo(); });
    $("insignia-tienda").hidden = !tienda.hayNovedad();
    $("nombre-personaje").textContent = D.articulo(D.equipado().personaje).nombre;
  }

  /* Cobra la partida en curso (una sola vez) */
  function cerrarPartida(r) {
    if (!partida) return null;
    const resultado = D.cerrarPartida({ id: partida, metros: r.metros, monedas: r.monedas, poderes: r.poderes });
    partida = null;
    return resultado;
  }

  /* Si se abandona una Carrera (reiniciar o ir al menú), igual se cobra lo recogido */
  function abandonarCarrera() {
    if (partida && modo && modo.nombre === "carrera" && modo.resumen) cerrarPartida(modo.resumen());
  }

  const formatoTiempo = (s) => Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");

  function alTerminar(r) {
    estado = "fin";
    if (r.tipo === "carrera") {
      const alcanzablesAntes = tienda.alcanzables().map((a) => a.id);
      const g = cerrarPartida(r) || { ganadas: 0, premios: [], saldo: D.saldo(), record: D.record(), nuevoRecord: false };
      record = g.record;
      $("fc-titulo").textContent = r.motivo === "borrado" ? "¡El Gran Borrador te alcanzó!" : "Fin de la carrera";
      $("fc-metros").textContent = r.metros + " m";
      $("fc-monedas").textContent = r.monedas;
      $("fc-record").textContent = record.metros + " m";
      $("fc-nuevo").hidden = !g.nuevoRecord;
      $("fc-ganadas").textContent = "+" + (g.ganadas + (g.extra || 0));
      $("fc-saldo").textContent = g.saldo;
      const premios = $("fc-premios");
      premios.innerHTML = "";
      (g.premios || []).forEach((p) => {
        const li = document.createElement("li");
        li.innerHTML = '<span class="sello">¡Misión cumplida!</span> <span class="premio-texto"></span> <strong>+' + p.premio + "</strong>";
        li.querySelector(".premio-texto").textContent = p.texto;
        premios.appendChild(li);
      });
      // Indicador de recompensas desbloqueadas: artículos que ahora alcanza el saldo
      const nuevos = tienda.alcanzables().filter((a) => alcanzablesAntes.indexOf(a.id) < 0);
      const aviso = $("fc-desbloqueo");
      aviso.hidden = !nuevos.length;
      if (nuevos.length) aviso.textContent = "¡Ya puedes comprar " + nuevos.slice(0, 2).map((a) => a.nombre).join(" y ") + (nuevos.length > 2 ? " y más" : "") + " en la tienda!";
      if ((g.premios || []).length || nuevos.length) Snd.reproducir("mision");
      mostrarPantalla(ui.finCarrera);
    } else if (r.tipo === "victoria") {
      $("res-monedas").textContent = r.monedas + "/" + r.total;
      $("res-tiempo").textContent = formatoTiempo(r.tiempo);
      $("res-vidas").textContent = r.vidas + "/" + r.vidasMax;
      $("res-mensaje").textContent = r.monedas === r.total
        ? "¡Obra perfecta! Reuniste todas las monedas."
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
    abandonarCarrera();
    aplicarEquipo();
    record = D.record();
    modo = modos[nombre];
    estado = "jugando";
    partida = nombre === "carrera" ? D.nuevaPartida() : null;
    modo.iniciar();
    mostrarPantalla(null);
    requestAnimationFrame(P.medir);
  }

  function irAlMenu() {
    abandonarCarrera();
    estado = "menu";
    modo = null;
    E.soltarTodo();
    actualizarMenu();
    mostrarPantalla(ui.inicio);
  }

  function abrirTienda(categoria, titulo) {
    abandonarCarrera();
    estado = "tienda";
    modo = null;
    E.soltarTodo();
    Snd.activar();
    Snd.reproducir("boton");
    tienda.abrir(categoria, titulo);
    mostrarPantalla(ui.tienda);
  }

  function abrirMisiones() {
    abandonarCarrera();
    estado = "misiones";
    modo = null;
    E.soltarTodo();
    Snd.activar();
    Snd.reproducir("boton");
    tienda.pintarMisiones(D.misiones(), $("lista-misiones"));
    mostrarPantalla(ui.misiones);
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
      else if (accion === "tienda") abrirTienda("personajes");
      else if (accion === "personaje") abrirTienda("personajes", "Personajes");
      else if (accion === "misiones") abrirMisiones();
    });
  });

  E.on("pausa", () => { if (estado === "tienda" || estado === "misiones") irAlMenu(); else alternarPausa(); });
  E.on("sonido", alternarSonido);
  E.on("pantalla", alternarPantallaCompleta);
  E.on("enter", () => {
    if (estado === "menu" || estado === "misiones") empezar("carrera");
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
      if (estado === "menu" || estado === "tienda" || estado === "misiones") animarMenu(PASO);
      else if (modo && (estado === "jugando" || estado === "fin")) modo.actualizar(PASO);
      acumulado -= PASO;
      pasos++;
    }
    if (pasos >= maxPasos) acumulado = 0;

    const { W, H } = P.estado;
    if (estado === "menu" || !modo) dibujarMenu(W, H);
    else modo.dibujar(ctx, W, H, record.metros);
    if (estado === "tienda" || estado === "misiones") { ctx.fillStyle = "rgba(13, 15, 38, 0.55)"; ctx.fillRect(0, 0, W, H); }
    requestAnimationFrame(bucle);
  }

  P.alCambiar((W, H) => { if (modos.carrera.redimensionar) modos.carrera.redimensionar(W, H); });
  P.medir();
  actualizarMenu();
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
    datos: () => D.leer(),
    partida: () => partida,
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
      empezar: (nombre) => empezar(nombre),
      tienda: (cat) => abrirTienda(cat),
      // Solo pruebas: termina la carrera actual como si Monky perdiera
      terminar: () => modos.carrera.depuracion.terminar && modos.carrera.depuracion.terminar()
    };
  }
})();
