/* =========================================================
   MONKY DREAMS — MODO CARRERA INFINITA
   Monky corre solo. El terreno se genera por tramos
   (generador.js) validados con la física real y se
   descartan los tramos que quedan atrás. Cada 500 m cambia
   el mundo: noche → bosque → digital → pesadilla → ...
   ========================================================= */

window.MonkyCarrera = function (deps) {
  "use strict";

  const F = window.MonkyFisica;
  const G = window.MonkyGenerador;
  const ESC = window.MonkyEscenario;
  const Snd = window.MonkySonido;
  const HUD = window.MonkyHUD;
  const S = deps.sprites;
  const E = deps.entrada;
  const T = F.T;
  const FIS = F.FIS;
  const ALTO_MUNDO = G.FILAS * T;
  const VIDAS = 3;
  const DURACION = { escudo: 10, iman: 10, doble: 12, impulso: 5 };
  const NOMBRES_MUNDO = { noche: "Sueño nocturno", bosque: "Bosque mágico", digital: "Mundo digital", pesadilla: "Pesadilla" };
  const NOMBRES_PODER = { escudo: "Escudo", iman: "Imán", doble: "Doble salto", impulso: "Impulso" };

  let ctx = null;
  let W = 320, H = 180;

  const limitar = (v, a, b) => Math.max(a, Math.min(b, v));
  const solapan = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const azar = (a, b) => a + Math.random() * (b - a);
  const texto = (c, x, y, col, sombra, e) => HUD.texto(ctx, c, x, y, col, sombra, e);

  /* -------------------------------------------------------
     ESTADO
     ------------------------------------------------------- */
  let estado = "inactivo";
  let tiempo = 0, tiempoPartida = 0, temporizador = 0, temblor = 0, fundido = 0;
  let generador = null;
  let tramos = [];
  let jugador = null;
  let inicioX = 0;
  let metros = 0, monedas = 0, metrosMax = 0;
  let particulas = [], efectos = [];
  let poderes = { escudo: 0, iman: 0, doble: 0, impulso: 0 };
  let invulPostImpulso = 0;
  let sombra = { activa: false, distancia: 140, anim: 0, alfa: 0, arremetida: 0, reloj: 7 };
  let rescate = null;
  let camX = 0;
  let temaVisible = "noche";
  let cartel = null;
  let avisosVistos = {};
  let piloto = false;
  let accionPiloto = null;
  let motivoFin = "";
  let registroGolpes = [];
  const fondos = {};
  const portales = {};
  const haloPoder = HUD.halo(S.crearCanvas, 12, "rgba(255, 241, 208, 0.22)");

  /* -------------------------------------------------------
     MUNDO: consulta de casillas sobre los tramos vivos
     ------------------------------------------------------- */
  function tramoEnColumna(cx) {
    for (let i = 0; i < tramos.length; i++) {
      const t = tramos[i];
      if (cx >= t.x0 && cx < t.x0 + t.ancho) return t;
    }
    return null;
  }

  const mundo = {
    filas: G.FILAS,
    alto: ALTO_MUNDO,
    esSolida: (ch) => ch === "#" || ch === "B",
    casilla(cx, cy) {
      if (cy < 0) return ".";
      const t = tramoEnColumna(cx);
      if (!t) return tramos.length && cx < tramos[0].x0 ? "#" : ".";
      const fila = t.mapa[Math.min(cy, G.FILAS - 1)];
      const ch = fila[cx - t.x0];
      if (cy >= G.FILAS) return ch === "#" ? "#" : ".";
      return "#B-^".indexOf(ch) >= 0 ? ch : ".";
    }
  };

  function cambiarCasilla(t, cx, cy, ch) {
    const local = cx - t.x0;
    const fila = t.mapa[cy];
    t.mapa[cy] = fila.slice(0, local) + ch + fila.slice(local + 1);
    if (t.lienzo) t.lienzo.getContext("2d").clearRect(local * T, cy * T - 3, T, T + 3);
    t.puas = G.zonasPuas(t);
  }

  /* -------------------------------------------------------
     TRAMOS: generar por delante y descartar los de atrás
     ------------------------------------------------------- */
  function prepararTramo(t) {
    t.mapa = t.mapa.slice();
    t.entidades.forEach((e) => { e.vivo = true; e.aplastado = 0; e.anim = Math.random() * 10; e.pos = null; });
    t.monedas.forEach((m) => { m.tomada = false; m.vx = 0; m.vy = 0; });
    t.poderes.forEach((p) => { p.tomado = false; });
    t.puas = G.zonasPuas(t);
    t.lienzo = ESC.construirCapaNivel(t.mapa, { tema: t.tema, extender: true, semilla: t.x0 });
    t.planHecho = new Set();
  }

  function asegurarTramos(todos) {
    const limite = Math.floor((camX + W + 420) / T);
    let generados = 0;
    while (!tramos.length || tramos[tramos.length - 1].x0 + tramos[tramos.length - 1].ancho < limite) {
      const t = generador.siguiente();
      prepararTramo(t);
      tramos.push(t);
      if (++generados >= (todos ? 20 : 1)) break; // como máximo un tramo por cuadro
    }
    while (tramos.length > 1 && (tramos[0].x0 + tramos[0].ancho) * T < camX - 96) tramos.shift();
  }

  /* -------------------------------------------------------
     INICIO
     ------------------------------------------------------- */
  function iniciar(semilla) {
    generador = G.crearGenerador(semilla || (Date.now() ^ (Math.random() * 1e9)) >>> 0);
    tramos = [];
    camX = 0;
    asegurarTramos(true);
    asegurarTramos(true);
    jugador = Object.assign(F.crearCorredor(5 * T, (G.FILA_BASE) * T), {
      vidas: VIDAS, invul: 0, estirar: 0, aplastar: 0, relojPolvo: 0, distancia: 0, ultimoGolpe: 0
    });
    inicioX = jugador.x;
    metros = 0; monedas = 0; metrosMax = 0;
    registroGolpes = [];
    particulas = []; efectos = [];
    poderes = { escudo: 0, iman: 0, doble: 0, impulso: 0 };
    invulPostImpulso = 0;
    sombra = { activa: false, distancia: 140, anim: 0, alfa: 0, arremetida: 0, reloj: 7 };
    rescate = null;
    temaVisible = "noche";
    cartel = { texto: NOMBRES_MUNDO.noche, t: 2.6 };
    tiempoPartida = 0; temblor = 0; fundido = 1;
    accionPiloto = null;
    estado = "jugando";
    actualizarCamara();
    deps.aviso(document.body.classList.contains("tactil")
      ? "Toca la derecha para saltar · la izquierda para deslizarte"
      : "Espacio o ↑ para saltar (mantén para más alto) · ↓ para deslizarte");
  }

  /* -------------------------------------------------------
     JUGADOR
     ------------------------------------------------------- */
  /* Tramo dueño del recorrido: el último cuyo inicio validado ya pasó.
     Así la velocidad cambia exactamente donde la usó el validador. */
  function tramoDueno() {
    let dueno = tramos[0];
    for (const t of tramos) if (t.xInicio !== undefined && t.xInicio <= jugador.x + 1e-6) dueno = t;
    return dueno;
  }

  function velocidadActual() {
    const t = tramoDueno();
    const base = t ? t.vel : G.velocidad(metros);
    return poderes.impulso > 0 ? base * 1.55 : base;
  }

  /* Piloto automático (pruebas): reproduce el plan del validador */
  function entradaPiloto() {
    const j = jugador;
    const entrada = { pulsoSalto: false, saltoSostenido: false, abajo: false };
    if (accionPiloto) {
      const a = accionPiloto.accion;
      if ((a.tipo === "saltar" && accionPiloto.enAire && j.enSuelo) ||
          (a.tipo === "deslizar" && accionPiloto.f > a.sostener && !j.deslizando && j.enSuelo) ||
          accionPiloto.f > 200) accionPiloto = null;
    }
    if (!accionPiloto) {
      const t = tramoDueno();
      if (t && t.plan) {
        for (const [dx, indice] of t.plan) {
          if (t.planHecho.has(dx)) continue;
          if (j.x >= dx - 1e-6 && j.x < dx + 24) {
            t.planHecho.add(dx);
            accionPiloto = { accion: G.ACCIONES[indice], f: 0, enAire: false };
            break;
          }
        }
      }
    }
    if (accionPiloto) {
      const a = accionPiloto.accion, f = accionPiloto.f++;
      if (a.tipo === "saltar") { entrada.pulsoSalto = f === 0; entrada.saltoSostenido = f < a.sostener; }
      if (a.tipo === "deslizar") entrada.abajo = f < a.sostener;
    }
    E.tomarPulso();
    return entrada;
  }

  function actualizarJugador(dt) {
    const j = jugador;
    if (rescate) return actualizarRescate(dt);
    const vel = velocidadActual();

    if (poderes.impulso > 0) {
      volarConImpulso(dt, vel);
    } else {
      j.dobleSalto = poderes.doble > 0;
      const entrada = piloto ? entradaPiloto() : { pulsoSalto: E.tomarPulso(), saltoSostenido: E.saltar, abajo: E.abajo };
      if (j.forzarDeslizar > 0) { j.forzarDeslizar -= dt; entrada.abajo = true; }
      const ev = F.pasoCorredor(j, entrada, dt, mundo, vel);
      if (accionPiloto && !j.enSuelo) accionPiloto.enAire = true;
      if (ev.salto) { Snd.reproducir("saltar"); j.estirar = 0.14; polvo(j.x + 5, j.y + j.h, 0); }
      if (ev.dobleSalto) {
        Snd.reproducir("saltar");
        j.estirar = 0.14;
        efectos.push({ tipo: "anillo", x: j.x + 5, y: j.y + j.h, vida: 0.35, total: 0.35, color: "#e7dcf6" });
      }
      if (ev.aterrizo && ev.vyAterrizaje > 150) { j.aplastar = 0.12; polvo(j.x, j.y + j.h, -1); polvo(j.x + 10, j.y + j.h, 1); }
      if (ev.deslizo) polvo(j.x + 2, j.y + j.h, -1);
      if (ev.choque) choque();
    }

    j.relojPolvo -= dt;
    if (j.enSuelo && j.relojPolvo <= 0) { polvo(j.x, j.y + j.h, -1); j.relojPolvo = j.deslizando ? 0.07 : 0.24; }
    j.distancia += vel * dt;
    j.invul = Math.max(0, j.invul - dt);
    j.estirar = Math.max(0, j.estirar - dt);
    j.aplastar = Math.max(0, j.aplastar - dt);
    invulPostImpulso = Math.max(0, invulPostImpulso - dt);

    if (j.y > ALTO_MUNDO + 30) caerAlVacio();
  }

  /* Impulso: vuelo rasante seguro, rompe obstáculos y cruza abismos */
  function volarConImpulso(dt, vel) {
    const j = jugador;
    if (j.deslizando) { j.y += j.h - F.ALTO_PIE; j.h = F.ALTO_PIE; j.deslizando = false; }
    j.vx = vel;
    j.x += vel * dt;
    // Altura objetivo: el suelo más alto justo adelante (los abismos se cruzan planeando)
    let suelo = null;
    for (let cx = Math.floor(j.x / T); cx <= Math.floor((j.x + j.w + 10) / T); cx++) {
      for (let cy = 0; cy < G.FILAS; cy++) {
        if (mundo.casilla(cx, cy) === "#") { suelo = suelo === null ? cy * T : Math.min(suelo, cy * T); break; }
      }
    }
    const objetivo = (suelo !== null ? suelo : j.y + j.h) - j.h;
    j.y += (objetivo - j.y) * Math.min(1, dt * 14);
    j.vy = 0;
    j.enSuelo = suelo !== null && Math.abs(j.y - objetivo) < 2;
    // Romper bloques y cristales en el camino
    const x0 = Math.floor(j.x / T), x1 = Math.floor((j.x + j.w + 2) / T);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cy = Math.floor(j.y / T) - 1; cy <= Math.floor((j.y + j.h) / T); cy++) {
        const ch = mundo.casilla(cx, cy);
        if (ch === "B" || ch === "^") {
          const t = tramoEnColumna(cx);
          if (t && cy >= 0 && cy < G.FILAS) {
            cambiarCasilla(t, cx, cy, ".");
            chispas(cx * T + 8, cy * T + 8, ch === "B" ? ["#fff6e6", "#e8792e", "#c9ad85"] : ["#efe6ff", "#b9a7e0"], 10);
            temblor = 0.12;
          }
        }
      }
    }
    if (Math.random() < 0.6) {
      particulas.push({ x: j.x - 2, y: j.y + 4 + Math.random() * 12, vx: -60, vy: azar(-10, 10), vida: 0.3, total: 0.3, color: Math.random() < 0.5 ? "#ffb35a" : "#ffe08a", grav: 0, tam: 2 });
    }
    // Al terminar: seguir planeando hasta tener suelo debajo
    if (poderes.impulso <= dt * 1.5 && suelo === null) poderes.impulso = dt * 2;
    if (poderes.impulso <= dt * 1.5) invulPostImpulso = 1;
  }

  function choque() {
    const j = jugador;
    const cx = Math.floor((j.x + j.w + 1) / T);
    const filaPies = Math.floor((j.y + j.h - 1) / T);
    if (mundo.esSolida(mundo.casilla(cx, filaPies))) {
      let fila = filaPies;
      while (fila > 0 && mundo.esSolida(mundo.casilla(cx, fila - 1))) fila--;
      // Pared de un abismo (más alta que Monky mientras cae): sin daño, solo cae
      if (!j.enSuelo && fila * T < j.y - 4) return;
      herir(j.x + j.w + 8, "choque");
      // Destrabar: subir encima del obstáculo
      j.y = fila * T - j.h;
      j.x += 2;
    } else {
      // Techo bajo: pasar agachado (y seguir agachado un momento para no volver a chocar)
      herir(j.x + j.w + 8, "choque");
      if (!j.deslizando) {
        j.y += j.h - F.ALTO_DESLIZ;
        j.h = F.ALTO_DESLIZ;
        j.deslizando = true;
      }
      j.forzarDeslizar = 0.6;
    }
    j.vy = Math.min(j.vy, 0);
  }

  function herir(origenX, motivo) {
    const j = jugador;
    if (j.invul > 0 || poderes.impulso > 0 || invulPostImpulso > 0 || estado !== "jugando") return;
    if (poderes.escudo > 0) {
      Snd.reproducir("aplastar");
      efectos.push({ tipo: "anillo", x: j.x + 5, y: j.y + j.h / 2, vida: 0.4, total: 0.4, color: "#7aa6cf" });
      j.invul = 0.4;
      return;
    }
    j.vidas--;
    registroGolpes.push({ motivo: motivo || "?", m: metros, x: Math.round(j.x), y: Math.round(j.y), deslizando: j.deslizando, tramo: (tramoDueno() || {}).patron });
    j.invul = 1.5;
    temblor = 0.3;
    Snd.reproducir("dolor");
    chispas(j.x + 5, j.y + j.h / 2, ["#e8473c", "#ff9b8a", "#fff7e8"], 12);
    if (sombra.activa) sombra.distancia -= 55;
    if (j.vidas <= 0) morir("golpe");
  }

  function caerAlVacio() {
    const j = jugador;
    Snd.reproducir("caer");
    if (poderes.escudo <= 0) {
      j.vidas--;
      if (sombra.activa) sombra.distancia -= 55;
      if (j.vidas <= 0) { morir("vacío"); return; }
    }
    iniciarRescate();
  }

  /* Burbuja de sueño: lleva a Monky al próximo suelo seguro */
  function iniciarRescate() {
    const j = jugador;
    let destino = null;
    for (let cx = Math.floor(j.x / T) + 3; cx < Math.floor(j.x / T) + 60 && !destino; cx++) {
      let fila = -1;
      for (let cy = 2; cy < G.FILAS; cy++) if (mundo.casilla(cx, cy) === "#") { fila = cy; break; }
      if (fila < 0) continue;
      let ok = true;
      for (let k = 0; k < 4; k++) {
        const ch = mundo.casilla(cx + k, fila);
        if (ch !== "#" || mundo.casilla(cx + k, fila - 1) !== "." || mundo.casilla(cx + k, fila - 2) !== ".") ok = false;
      }
      if (ok) destino = { x: cx * T + 3, y: fila * T - F.ALTO_PIE };
    }
    if (!destino) destino = { x: j.x + 6 * T, y: G.FILA_BASE * T - F.ALTO_PIE };
    rescate = { t: 0, dur: 0.9, desde: { x: j.x, y: ALTO_MUNDO + 10 }, hasta: destino };
    // Las entidades cercanas al destino desaparecen para no castigar al reaparecer
    tramos.forEach((t) => t.entidades.forEach((e) => { if (e.vivo && Math.abs(e.x - destino.x) < 120) e.vivo = false; }));
  }

  function actualizarRescate(dt) {
    const j = jugador;
    rescate.t += dt;
    const k = Math.min(1, rescate.t / rescate.dur);
    const suave = k * k * (3 - 2 * k);
    j.x = rescate.desde.x + (rescate.hasta.x - rescate.desde.x) * suave;
    j.y = rescate.desde.y + (rescate.hasta.y - rescate.desde.y) * suave - Math.sin(k * Math.PI) * 30;
    if (j.deslizando) { j.h = F.ALTO_PIE; j.deslizando = false; }
    j.vy = 0;
    if (k >= 1) {
      rescate = null;
      j.enSuelo = true;
      j.invul = 1.5;
      accionPiloto = null;
      deps.aviso("¡Una burbuja de sueño te rescató!");
    }
  }

  function morir(motivo) {
    motivoFin = motivo;
    estado = "muerte";
    temporizador = motivo === "atrapado" ? 1.8 : 1.3;
    jugador.vy = -280;
    Snd.reproducir("perder");
    temblor = 0.4;
  }

  /* -------------------------------------------------------
     ENTIDADES, MONEDAS Y PODERES
     ------------------------------------------------------- */
  function actualizarObjetos(dt) {
    const j = jugador;
    const caja = { x: j.x - 1, y: j.y - 1, w: j.w + 2, h: j.h + 2 };

    tramos.forEach((t) => {
      if ((t.x0 * T) > camX + W + 40 || (t.x0 + t.ancho) * T < camX - 40) {
        // Fuera de pantalla: solo actualizar posición si está cerca por delante
      }
      t.entidades.forEach((e) => {
        if (!e.vivo) return;
        e.anim += dt;
        e.pos = G.posicion(e, j.x, t.vel);
        if (e.aplastado > 0) {
          e.aplastado -= dt;
          if (e.aplastado <= 0) { e.vivo = false; polvo(e.pos.x + 4, e.pos.y + e.pos.h, 0); }
          return;
        }
        if (rescate || estado !== "jugando" || !solapan(j, e.pos)) return;
        if (poderes.impulso > 0 || invulPostImpulso > 0) {
          destruir(e, ["#ffb35a", "#ffe08a", "#fff7e8"]);
          return;
        }
        if (e.pisable && j.vy > 0 && j.y + j.h - e.pos.y < 10) {
          e.aplastado = 0.4;
          j.vy = E.saltar || piloto ? FIS.reboteAlto : FIS.rebote;
          j.enSuelo = false;
          j.estirar = 0.12;
          Snd.reproducir("aplastar");
          efectos.push({ tipo: "destello", x: e.pos.x + e.w / 2, y: e.pos.y + 2, vida: 0.3, total: 0.3 });
          chispas(e.pos.x + e.w / 2, e.pos.y + 4, ["#b294f0", "#fff7e8", "#f2c14e"], 10);
        } else if (poderes.escudo > 0) {
          destruir(e, ["#7aa6cf", "#fff7e8"]);
          herir(0);
        } else {
          herir(e.pos.x + e.w / 2, e.tipo);
        }
      });

      if (!rescate && estado === "jugando" && poderes.impulso <= 0) {
        for (const p of t.puas) {
          if (solapan(j, p)) {
            if (j.invul <= 0 && invulPostImpulso <= 0) { herir(p.x + 6, "púas"); if (estado === "jugando") j.vy = -300; }
            break;
          }
        }
      }

      t.monedas.forEach((m) => {
        if (m.tomada) return;
        if (poderes.iman > 0) {
          const dx = j.x + 5 - (m.x + 6), dy = j.y + j.h / 2 - (m.y + 6);
          const d = Math.hypot(dx, dy);
          if (d < 96) { m.x += (dx / d) * Math.min(d, 260 * dt); m.y += (dy / d) * Math.min(d, 260 * dt); }
        }
        if (solapan(caja, { x: m.x, y: m.y, w: 12, h: 12 })) {
          m.tomada = true;
          monedas++;
          Snd.reproducir("recoger");
          efectos.push({ tipo: "destello", x: m.x + 6, y: m.y + 6, vida: 0.3, total: 0.3 });
          if (monedas % 10 === 0) efectos.push({ tipo: "texto", x: m.x - 4, y: m.y - 4, vida: 0.8, total: 0.8, contenido: String(monedas) });
        }
      });

      t.poderes.forEach((p) => {
        if (p.tomado) return;
        if (solapan(caja, { x: p.x - 2, y: p.y - 2, w: 16, h: 16 })) {
          p.tomado = true;
          activarPoder(p.tipo);
        }
      });
    });
  }

  function destruir(e, colores) {
    e.vivo = false;
    chispas(e.pos.x + e.w / 2, e.pos.y + e.h / 2, colores, 12);
    Snd.reproducir("aplastar");
  }

  function activarPoder(tipo) {
    poderes[tipo] = DURACION[tipo];
    Snd.reproducir("control");
    efectos.push({ tipo: "anillo", x: jugador.x + 5, y: jugador.y + 9, vida: 0.5, total: 0.5, color: "#fff1b0" });
    deps.aviso("¡" + NOMBRES_PODER[tipo] + "!");
  }

  /* -------------------------------------------------------
     SOMBRA GIGANTE (solo en la Pesadilla)
     ------------------------------------------------------- */
  function actualizarSombra(dt) {
    const enPesadilla = temaVisible === "pesadilla";
    if (enPesadilla && !sombra.activa) {
      sombra.activa = true;
      sombra.distancia = 150;
      sombra.reloj = 6;
      deps.aviso("¡Una sombra gigante te persigue! No te detengas");
    }
    if (!enPesadilla && sombra.activa) sombra.activa = false;
    sombra.alfa = limitar(sombra.alfa + (sombra.activa ? dt : -dt) * 1.5, 0, 1);
    sombra.anim += dt;
    if (!sombra.activa) { sombra.distancia = Math.min(150, sombra.distancia + 40 * dt); return; }

    // Se acerca en arremetidas y se aleja si Monky corre sin tropezar
    sombra.reloj -= dt;
    if (sombra.reloj <= 0) { sombra.arremetida = 1.2; sombra.reloj = 7 + Math.random() * 4; temblor = 0.2; }
    if (sombra.arremetida > 0) { sombra.arremetida -= dt; sombra.distancia -= 22 * dt; }
    else sombra.distancia = Math.min(150, sombra.distancia + 7 * dt);
    if (poderes.impulso > 0) sombra.distancia = Math.min(150, sombra.distancia + 30 * dt);

    if (sombra.distancia <= 0 && estado === "jugando" && !rescate) {
      if (poderes.escudo > 0) {
        poderes.escudo = 0;
        sombra.distancia = 90;
        efectos.push({ tipo: "anillo", x: jugador.x + 5, y: jugador.y + 9, vida: 0.5, total: 0.5, color: "#7aa6cf" });
        deps.aviso("¡El escudo te salvó de la sombra!");
      } else {
        morir("atrapado");
      }
    }
  }

  /* -------------------------------------------------------
     PARTÍCULAS
     ------------------------------------------------------- */
  function chispas(x, y, colores, n) {
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n + Math.random() * 0.5, v = 40 + Math.random() * 70;
      particulas.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, vida: 0.5 + Math.random() * 0.4, total: 0.9, color: colores[i % colores.length], grav: 170, tam: Math.random() < 0.3 ? 2 : 1 });
    }
  }

  function polvo(x, y, dir) {
    efectos.push({ tipo: "polvo", x: x - 4 + dir * 2, y: y - 7, vx: dir * 18 - 20, vida: 0.32, total: 0.32 });
  }

  function actualizarParticulas(dt) {
    for (const p of particulas) { p.vida -= dt; p.vy += p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    particulas = particulas.filter((p) => p.vida > 0);
    if (particulas.length > 260) particulas.splice(0, particulas.length - 260);
    for (const e of efectos) { e.vida -= dt; if (e.vx) e.x += e.vx * dt; if (e.tipo === "texto") e.y -= 18 * dt; }
    efectos = efectos.filter((e) => e.vida > 0);
  }

  /* -------------------------------------------------------
     CÁMARA Y MUNDOS
     ------------------------------------------------------- */
  function actualizarCamara() {
    camX = jugador.x - Math.round(W * 0.3);
  }

  function actualizarMundo() {
    const enCamara = G.mundoEn(Math.max(0, (camX + W * 0.5) / T));
    if (enCamara !== temaVisible) {
      temaVisible = enCamara;
      cartel = { texto: NOMBRES_MUNDO[enCamara], t: 2.6 };
      Snd.reproducir("control");
    }
  }

  function fondoDe(tema, ciclo) {
    const clave = tema + ciclo;
    if (!fondos[clave]) fondos[clave] = ESC.construirFondo(tema, ciclo);
    return fondos[clave];
  }

  /* -------------------------------------------------------
     ACTUALIZAR
     ------------------------------------------------------- */
  function actualizar(dt) {
    tiempo += dt;
    temblor = Math.max(0, temblor - dt);
    fundido = Math.max(0, fundido - dt * 2.5);
    if (cartel) { cartel.t -= dt; if (cartel.t <= 0) cartel = null; }

    if (estado === "jugando") {
      tiempoPartida += dt;
      for (const k in poderes) poderes[k] = Math.max(0, poderes[k] - dt);
      actualizarJugador(dt);
      if (estado !== "jugando") return;
      actualizarCamara();
      asegurarTramos(false);
      actualizarObjetos(dt);
      actualizarMundo();
      actualizarSombra(dt);
      metros = Math.max(metros, Math.floor((jugador.x - inicioX) / T));

      // Aviso la primera vez que aparece un techo bajo
      const proximo = tramos.find((t) => t.deslizar && t.x0 * T > jugador.x && t.x0 * T < jugador.x + W);
      if (proximo && !avisosVistos.deslizar) {
        avisosVistos.deslizar = true;
        deps.aviso(document.body.classList.contains("tactil") ? "Techo bajo: toca la izquierda para deslizarte" : "Techo bajo: ↓ para deslizarte");
      }
    } else if (estado === "muerte") {
      temporizador -= dt;
      jugador.vy = Math.min(FIS.caidaMax, jugador.vy + FIS.grav * dt);
      jugador.y += jugador.vy * dt;
      if (motivoFin === "atrapado") sombra.distancia = Math.max(-60, sombra.distancia - 60 * dt);
      if (temporizador <= 0) {
        estado = "fin";
        deps.fin({ tipo: "carrera", metros: metros, monedas: monedas, motivo: motivoFin, tiempo: tiempoPartida });
      }
    }
    actualizarParticulas(dt);
  }

  /* -------------------------------------------------------
     DIBUJO
     ------------------------------------------------------- */
  function dibujarFondo(cx) {
    const mCentro = (cx + W * 0.5) / T;
    const LARGO = G.LARGO_MUNDO;
    const idx = Math.floor(mCentro / LARGO);
    const local = mCentro - idx * LARGO;
    const actual = G.MUNDOS[((idx % 4) + 4) % 4];
    const ciclo = Math.floor(idx / 4);
    fondoDe(actual, ciclo).dibujar(ctx, cx, tiempo, W, H);
    // Transición suave hacia el siguiente mundo
    const zona = 36;
    if (local > LARGO - zona) {
      const sig = G.MUNDOS[(idx + 1) % 4];
      ctx.globalAlpha = (local - (LARGO - zona)) / zona;
      fondoDe(sig, Math.floor((idx + 1) / 4)).dibujar(ctx, cx, tiempo, W, H);
      ctx.globalAlpha = 1;
    }
    return { actual: actual, ciclo: ciclo };
  }

  function dibujarTramos(cx, cy) {
    tramos.forEach((t) => {
      const x = t.x0 * T - cx;
      if (x > W || x + t.ancho * T < 0) return;
      ctx.drawImage(t.lienzo, Math.round(x), -cy);
    });
    // Portales de sueño en cada cambio de mundo
    const primero = Math.ceil((cx - 40) / T / G.LARGO_MUNDO), ultimo = Math.floor((cx + W + 40) / T / G.LARGO_MUNDO);
    for (let k = Math.max(1, primero); k <= ultimo; k++) {
      const col = k * G.LARGO_MUNDO;
      let fila = -1;
      for (let cyy = 2; cyy < G.FILAS; cyy++) if (mundo.casilla(col, cyy) === "#") { fila = cyy; break; }
      if (fila < 0) continue;
      const tema = G.MUNDOS[k % 4];
      if (!portales[tema]) portales[tema] = ESC.portal(tema);
      ctx.drawImage(portales[tema], Math.round(col * T - cx - 6), fila * T - cy - 44);
    }
  }

  function dibujarObjetos(cx, cy) {
    tramos.forEach((t) => {
      const x0 = t.x0 * T - cx;
      if (x0 > W + 40 || x0 + t.ancho * T < -40) return;

      t.monedas.forEach((m) => {
        if (m.tomada) return;
        const x = Math.round(m.x - cx), y = Math.round(m.y - cy + Math.sin(tiempo * 3 + m.x * 0.05) * 1.2);
        if (x < -12 || x > W) return;
        ctx.drawImage(S.moneda[Math.floor(tiempo * 9 + m.x * 0.03) % 8].der, x, y);
      });

      t.poderes.forEach((p) => {
        if (p.tomado) return;
        const x = Math.round(p.x - cx), y = Math.round(p.y - cy + Math.sin(tiempo * 2.5) * 2);
        ctx.drawImage(haloPoder, x + 6 - 12, y + 6 - 12);
        ctx.drawImage(S.poderes[p.tipo].der, x - 2, y - 2);
      });

      t.entidades.forEach((e) => {
        if (!e.vivo) return;
        const p = e.pos || G.posicion(e, jugador.x, t.vel);
        const x = Math.round(p.x - cx), y = Math.round(p.y - cy);
        if (x < -40 || x > W + 40) return;
        const f = Math.floor(e.anim * 8);
        switch (e.tipo) {
          case "bicho": {
            const lista = t.tema === "digital" ? S.bichoDigital : S.bicho;
            if (e.aplastado > 0) ctx.drawImage(lista[0].der, x - 2, y + 5, 18, 6);
            else ctx.drawImage(lista[f % 3].izq, x - 1, y + e.h - 13);
            break;
          }
          case "hongo": {
            const cuadro = S.hongo[t.tema === "pesadilla" ? 1 : 0];
            if (e.aplastado > 0) ctx.drawImage(cuadro.der, x - 1, y + 8, 16, 6);
            else ctx.drawImage(cuadro.der, x - 1, y);
            break;
          }
          case "tronco":
            ctx.drawImage(S.tronco[Math.floor(p.t * 10) % 4].der, x - 1, y);
            break;
          case "polilla":
            if (e.aplastado > 0) ctx.drawImage(S.polilla[1].der, x - 2, y + 4, 16, 6);
            else ctx.drawImage(S.polilla[Math.floor(e.anim * 10) % 2].izq, x - 2, y - 1);
            break;
          case "dron":
            ctx.drawImage(S.dron[f % 2].izq, x - 1, y - 1);
            break;
          case "cuervo":
            ctx.drawImage(S.cuervo[Math.floor(e.anim * 9) % 2].izq, x - 2, y - 1);
            break;
          case "laser": {
            const brillo = Math.floor(tiempo * 20) % 3;
            ctx.fillStyle = "#16152a"; ctx.fillRect(x - 3, y - 3, 4, 9); ctx.fillRect(x + e.w - 1, y - 3, 4, 9);
            ctx.fillStyle = "#33456a"; ctx.fillRect(x - 2, y - 2, 2, 7); ctx.fillRect(x + e.w, y - 2, 2, 7);
            ctx.fillStyle = brillo ? "rgba(255, 107, 213, 0.35)" : "rgba(255, 107, 213, 0.2)";
            ctx.fillRect(x, y - 2, e.w, e.h + 4);
            ctx.fillStyle = brillo === 1 ? "#ffffff" : "#ff6bd5";
            ctx.fillRect(x, y, e.w, e.h);
            ctx.fillStyle = "#ffd6f4"; ctx.fillRect(x, y + 1, e.w, 1);
            break;
          }
        }
      });
    });
  }

  function cuadroJugador() {
    const j = jugador, m = S.mono;
    if (estado === "muerte" || j.dolor > 0) return m.dolor;
    if (rescate) return m.dormido[0];
    if (j.deslizando) return m.deslizar[Math.floor(tiempo * 12) % 2];
    if (!j.enSuelo && poderes.impulso <= 0) return j.vy < -30 ? m.saltar : m.caer;
    return m.correr[Math.floor(j.distancia / 7) % 6];
  }

  function dibujarJugador(cx, cy) {
    const j = jugador;
    const cuadro = cuadroJugador();
    if (j.invul > 0 && !rescate && Math.floor(j.invul * 16) % 2 === 0 && estado === "jugando") return;
    let w = cuadro.der.width, h = cuadro.der.height;
    if (j.estirar > 0) { w -= 2; h += 2; } else if (j.aplastar > 0) { w += 3; h -= 3; }
    const base = Math.round(j.y + j.h - cy);
    const centro = Math.round(j.x + j.w / 2 - cx - 1);

    // Estela del impulso
    if (poderes.impulso > 0) {
      for (let k = 3; k >= 1; k--) {
        ctx.globalAlpha = 0.18 * (4 - k);
        ctx.drawImage(cuadro.blanco || cuadro.der, centro - Math.floor(w / 2) - k * 7, base - h, w, h);
      }
      ctx.globalAlpha = 1;
    }
    // Alitas del doble salto
    if (poderes.doble > 0) ctx.drawImage(S.alas[Math.floor(tiempo * 10) % 2].der, centro - 11, base - h + 9);

    ctx.drawImage(cuadro.der, centro - Math.floor(w / 2), base - h, w, h);

    if (rescate) dibujarBurbuja(centro, base - 10, 15, "#a9d8ec");
    if (poderes.escudo > 0 && (poderes.escudo > 2 || Math.floor(tiempo * 8) % 2)) dibujarBurbuja(centro, base - j.h / 2 - 1, 14, "#7aa6cf");
    if (poderes.iman > 0 && Math.floor(tiempo * 6) % 2) {
      ctx.fillStyle = "rgba(255, 107, 107, 0.6)";
      ctx.fillRect(centro + 8, base - 14, 2, 1); ctx.fillRect(centro + 11, base - 12, 2, 1); ctx.fillRect(centro + 8, base - 10, 2, 1);
    }
  }

  function dibujarBurbuja(x, y, r, color) {
    for (let a = 0; a < Math.PI * 2; a += 0.12) {
      const px = Math.round(x + Math.cos(a) * r), py = Math.round(y + Math.sin(a) * r);
      ctx.fillStyle = (Math.floor(a * 8 + tiempo * 10) % 3) ? color : "#ffffff";
      ctx.fillRect(px, py, 1, 1);
    }
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillRect(Math.round(x - r * 0.5), Math.round(y - r * 0.6), 2, 1);
  }

  function dibujarSombra(cx, cy) {
    if (sombra.alfa <= 0) return;
    const jx = jugador.x - cx;
    // Siempre asoma por la izquierda y se acerca a Monky cuando la distancia baja
    // Siempre asoma (con sus ojos) y llega a Monky cuando la distancia es 0, en cualquier ancho de pantalla
    const frente = Math.round(jx - 8 - (sombra.distancia / 150) * (jx - 40));
    const suelo = G.FILA_BASE * T - cy;
    ctx.globalAlpha = sombra.alfa;
    // Oscuridad que trae detrás
    if (estado === "muerte" && motivoFin === "atrapado") {
      ctx.fillStyle = "rgba(5, 2, 8, 0.6)";
      ctx.fillRect(0, 0, W, H);
    }
    if (frente - 50 > 0) {
      ctx.fillStyle = "rgba(5, 2, 8, 0.85)";
      ctx.fillRect(0, 0, frente - 50, H);
    }
    for (let x = Math.max(0, frente - 50); x < frente - 30; x += 2) {
      ctx.fillStyle = "rgba(5, 2, 8, " + ((frente - 30 - x) / 20 * 0.8).toFixed(2) + ")";
      ctx.fillRect(x, 0, 2, H);
    }
    const sprite = S.sombra[Math.floor(sombra.anim * 6) % 4].der;
    ctx.drawImage(sprite, frente - 54, suelo - 90 + Math.round(Math.sin(sombra.anim * 2) * 2));
    // Viñeta roja cuando está muy cerca
    if (sombra.distancia < 50 && Math.floor(tiempo * 4) % 2) {
      ctx.fillStyle = "rgba(255, 40, 70, 0.10)";
      ctx.fillRect(0, 0, W, 3); ctx.fillRect(0, H - 3, W, 3); ctx.fillRect(0, 0, 3, H); ctx.fillRect(W - 3, 0, 3, H);
    }
    ctx.globalAlpha = 1;
  }

  function dibujarParticulas(cx, cy) {
    for (const p of particulas) {
      ctx.globalAlpha = p.total ? Math.min(1, p.vida / p.total * 1.5) : 1;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x - cx), Math.round(p.y - cy), p.tam, p.tam);
    }
    ctx.globalAlpha = 1;
    for (const e of efectos) {
      const avance = 1 - e.vida / e.total;
      const x = Math.round(e.x - cx), y = Math.round(e.y - cy);
      if (e.tipo === "polvo") ctx.drawImage(S.polvo[Math.min(3, Math.floor(avance * 4))].der, x, y);
      else if (e.tipo === "destello") {
        const f = avance < 0.5 ? Math.floor(avance * 6) : 2 - Math.floor((avance - 0.5) * 6);
        const img = S.destello[limitar(f, 0, 2)].der;
        ctx.drawImage(img, x - Math.floor(img.width / 2), y - Math.floor(img.height / 2));
      } else if (e.tipo === "anillo") {
        const r = 4 + avance * 14;
        ctx.globalAlpha = 1 - avance;
        for (let a = 0; a < Math.PI * 2; a += 0.3) {
          ctx.fillStyle = e.color;
          ctx.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r * 0.6), 1, 1);
        }
        ctx.globalAlpha = 1;
      } else if (e.tipo === "texto") {
        texto(e.contenido, x, y, "#ffe08a", "#16152a");
      }
    }
  }

  function dibujarHUD(record) {
    // Vidas
    HUD.panel(ctx, 3, 3, 33, 13);
    for (let i = 0; i < VIDAS; i++) ctx.drawImage((i < jugador.vidas ? S.corazon : S.corazonVacio).der, 6 + i * 9, 6);
    // Monedas
    const etiqueta = String(monedas);
    const anchoM = 12 + 4 + HUD.anchoTexto(etiqueta) + 5;
    HUD.panel(ctx, 39, 3, anchoM, 13);
    ctx.drawImage(S.moneda[Math.floor(tiempo * 8) % 8].der, 40, 3);
    texto(etiqueta, 55, 7, "#fff7e8", "#16152a");
    // Distancia (centro)
    const dist = metros + " M";
    const ancho = HUD.anchoTexto(dist, 2);
    texto(dist, Math.round(W / 2 - ancho / 2), 5, "#fff7e8", "#16152a", 2);
    if (record > 0) {
      const r = "RECORD " + record;
      texto(r, Math.round(W / 2 - HUD.anchoTexto(r) / 2), 18, metros > record ? "#ffe08a" : "#9aa6dc", "#16152a");
    }
    // Poderes activos con su tiempo
    let y = 19;
    ["escudo", "iman", "doble", "impulso"].forEach((tipo) => {
      if (poderes[tipo] <= 0) return;
      HUD.panel(ctx, 3, y, 44, 14);
      ctx.drawImage(S.iconos[tipo], 4, y + 1);
      const frac = poderes[tipo] / DURACION[tipo];
      ctx.fillStyle = "#16152a"; ctx.fillRect(18, y + 5, 26, 4);
      ctx.fillStyle = frac < 0.25 && Math.floor(tiempo * 6) % 2 ? "#ff6b6b" : "#ffe08a";
      ctx.fillRect(19, y + 6, Math.max(1, Math.round(24 * frac)), 2);
      y += 15;
    });
    // Cartel de mundo nuevo
    if (cartel) {
      const t = cartel.texto.toUpperCase();
      const a = HUD.anchoTexto(t, 2);
      const alfa = Math.min(1, cartel.t * 2, (2.6 - cartel.t) * 4);
      ctx.globalAlpha = alfa;
      HUD.panel(ctx, Math.round(W / 2 - a / 2 - 8), 40, a + 16, 20);
      texto(t, Math.round(W / 2 - a / 2), 45, "#ffe08a", "#16152a", 2);
      ctx.globalAlpha = 1;
    }
  }

  function dibujar(record) {
    let sx = 0, sy = 0;
    if (temblor > 0) { sx = Math.round((Math.random() - 0.5) * 4); sy = Math.round((Math.random() - 0.5) * 3); }
    const cx = Math.round(camX) + sx;
    const cy = ALTO_MUNDO - H + sy;
    const f = dibujarFondo(cx);
    dibujarTramos(cx, cy);
    dibujarObjetos(cx, cy);
    dibujarJugador(cx, cy);
    dibujarParticulas(cx, cy);
    dibujarSombra(cx, cy);
    fondoDe(f.actual, f.ciclo).dibujarFrente(ctx, cx, tiempo, W, H);
    dibujarHUD(record);
    if (fundido > 0) { ctx.fillStyle = "rgba(13, 15, 38, " + fundido.toFixed(2) + ")"; ctx.fillRect(0, 0, W, H); }
  }

  /* -------------------------------------------------------
     INTERFAZ DEL MODO
     ------------------------------------------------------- */
  return {
    nombre: "carrera",
    iniciar: iniciar,
    actualizar: actualizar,
    dibujar(c, ancho, alto, record) { ctx = c; W = ancho; H = alto; if (jugador) dibujar(record); },
    redimensionar(ancho, alto) { W = ancho; H = alto; if (jugador) actualizarCamara(); },
    estado: () => estado,
    depuracion: {
      estado: () => estado,
      jugador: () => jugador && ({ x: jugador.x, y: jugador.y, vy: jugador.vy, h: jugador.h, enSuelo: jugador.enSuelo, deslizando: jugador.deslizando, vidas: jugador.vidas, invul: jugador.invul }),
      metros: () => metros,
      monedas: () => monedas,
      tramos: () => tramos.length,
      tramosInfo: () => tramos.map((t) => ({ x0: t.x0, ancho: t.ancho, patron: t.patron, tema: t.tema, vel: Math.round(t.vel) })),
      entidades: () => tramos.reduce((s, t) => s + t.entidades.length, 0),
      particulas: () => particulas.length + efectos.length,
      poderes: () => Object.assign({}, poderes),
      sombra: () => ({ activa: sombra.activa, distancia: Math.round(sombra.distancia) }),
      mundo: () => temaVisible,
      generador: () => Object.assign({}, generador.estado),
      piloto(valor) { piloto = !!valor; },
      activarPoder(tipo) { activarPoder(tipo); },
      quitarVida() { jugador.invul = 0; herir(0, "prueba"); },
      golpes: () => registroGolpes.slice(),
      saltarMetros(m) {
        // Avanza el mundo sin jugar (para probar mundos lejanos)
        jugador.x += m * T;
        camX = jugador.x - Math.round(W * 0.3);
        tramos = [];
        generador.estado.columna = Math.floor(jugador.x / T) - 8;
        asegurarTramos(true); asegurarTramos(true);
        const t = tramoEnColumna(Math.floor(jugador.x / T));
        if (t) {
          let fila = G.FILA_BASE - t.hEntrada;
          for (let cy = 2; cy < G.FILAS; cy++) if (mundo.casilla(Math.floor((jugador.x + 5) / T), cy) === "#") { fila = cy; break; }
          jugador.y = fila * T - jugador.h;
          jugador.vy = 0;
        }
        metros = Math.floor((jugador.x - inicioX) / T);
      }
    }
  };
};
