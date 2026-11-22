/* =========================================================
   MONKY DREAMS — TIENDA Y MISIONES (interfaz)
   La tienda también es la selección de personaje: cada
   artículo tiene vista previa animada, precio, estado
   (bloqueado, tuyo, equipado) y la acción que corresponde.
   ========================================================= */

window.MonkyTienda = function (deps) {
  "use strict";

  const D = window.MonkyDatos;
  const PJ = window.MonkyPersonajes;
  const S = deps.sprites;
  const Snd = window.MonkySonido;
  const $ = (id) => document.getElementById(id);

  const ui = {
    pestanas: Array.from(document.querySelectorAll(".pestana")),
    lista: $("articulos"),
    vitrina: $("vitrina"),
    nombre: $("vitrina-nombre"),
    desc: $("vitrina-desc"),
    accion: $("vitrina-accion"),
    nota: $("vitrina-nota"),
    titulo: $("titulo-tienda")
  };
  const vctx = ui.vitrina.getContext("2d");
  vctx.imageSmoothingEnabled = false;

  let categoria = "personajes";
  let elegido = "monky";
  let confeti = [];
  let tiempo = 0;
  const NOMBRE_RANURA = { vestimenta: "la ropa", cabeza: "la cabeza", cuello: "el cuello" };

  /* ---------- Equipo que se ve en la vista previa ---------- */
  function equipoDePrueba(a) {
    const eq = D.equipado();
    if (a.cat === "personajes") return PJ.normalizar(Object.assign({}, eq, { personaje: a.id }));
    if (a.ranura) {
      const base = D.compatible(a.id, eq.personaje) ? eq : { personaje: (a.para && a.para[0]) || "monky" };
      return PJ.normalizar(Object.assign({}, base, { [a.ranura]: a.id }));
    }
    return PJ.normalizar(eq);
  }

  /* ---------- Miniaturas de las tarjetas ---------- */
  function miniatura(a) {
    const c = S.crearCanvas(26, 24), g = c.getContext("2d");
    if (a.cat === "mejoras") {
      const icono = S.iconos[a.id === "iman2" ? "iman" : "escudo"];
      g.drawImage(icono, 6, 5);
      mas(g, 17, 3);
    } else {
      const f = PJ.construir(equipoDePrueba(a)).quieto[0].der;
      g.drawImage(f, 4, 24 - f.height);
    }
    return c;
  }

  /* "+" pixel de las mejoras */
  function mas(g, x, y) {
    g.fillStyle = "#16152a"; g.fillRect(x - 1, y + 1, 7, 3); g.fillRect(x + 1, y - 1, 3, 7);
    g.fillStyle = "#ffe08a"; g.fillRect(x, y + 2, 5, 1); g.fillRect(x + 2, y, 1, 5);
  }

  /* ---------- Estado de cada artículo ---------- */
  function estadoDe(a, d) {
    const tuyo = d.comprados.indexOf(a.id) >= 0;
    const eq = d.equipado;
    const puesto = a.cat === "personajes" ? eq.personaje === a.id : a.ranura ? eq[a.ranura] === a.id : false;
    return { tuyo: tuyo, puesto: puesto, alcanza: d.saldo >= a.precio, compatible: !a.para || a.para.indexOf(eq.personaje) >= 0 };
  }

  function etiqueta(a, e) {
    if (a.cat === "mejoras" && e.tuyo) return { texto: "Activa", clase: "activa" };
    if (e.puesto) return { texto: "Equipado", clase: "equipado" };
    if (e.tuyo) return { texto: "Tuyo", clase: "tuyo" };
    return { texto: String(a.precio), clase: e.alcanza ? "precio" : "precio caro", moneda: true };
  }

  /* ---------- Pintar la lista ---------- */
  function pintarLista() {
    const d = D.leer();
    document.querySelectorAll("[data-saldo]").forEach((el) => { el.textContent = d.saldo; });
    ui.pestanas.forEach((p) => {
      const activa = p.dataset.categoria === categoria;
      p.classList.toggle("activa", activa);
      p.setAttribute("aria-selected", String(activa));
    });
    ui.lista.innerHTML = "";
    D.CATALOGO.filter((a) => a.cat === categoria).forEach((a) => {
      const e = estadoDe(a, d);
      const et = etiqueta(a, e);
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button";
      b.className = "articulo" + (a.id === elegido ? " elegido" : "") + (e.tuyo ? "" : " bloqueado");
      b.setAttribute("aria-label", a.nombre + ", " + (e.tuyo ? (e.puesto ? "equipado" : "comprado") : a.precio + " monedas"));
      b.appendChild(miniatura(a));
      const n = document.createElement("span"); n.className = "articulo-nombre"; n.textContent = a.nombre;
      const s = document.createElement("span"); s.className = "articulo-estado " + et.clase;
      if (et.moneda) { const i = document.createElement("span"); i.className = "icono-moneda"; s.appendChild(i); }
      s.appendChild(document.createTextNode(et.texto));
      b.appendChild(n); b.appendChild(s);
      b.addEventListener("click", () => { elegido = a.id; ui.nota.textContent = ""; Snd.reproducir("boton"); pintar(); });
      li.appendChild(b);
      ui.lista.appendChild(li);
    });
  }

  /* ---------- Vitrina: nombre, descripción y acción ---------- */
  function pintarVitrina() {
    const a = D.articulo(elegido);
    const d = D.leer();
    const e = estadoDe(a, d);
    ui.nombre.textContent = a.nombre;
    ui.desc.textContent = a.desc;
    const btn = ui.accion;
    btn.disabled = false;
    btn.classList.remove("apagado");
    btn.dataset.accionTienda = "";
    if (!e.tuyo) {
      btn.textContent = "Comprar · " + a.precio;
      btn.dataset.accionTienda = "comprar";
      if (!e.alcanza) btn.classList.add("apagado");
    } else if (a.cat === "mejoras") {
      btn.textContent = "Mejora activa";
      btn.disabled = true;
    } else if (e.puesto) {
      if (a.cat === "personajes") { btn.textContent = "Equipado"; btn.disabled = true; }
      else { btn.textContent = "Quitar"; btn.dataset.accionTienda = "quitar"; }
    } else if (!e.compatible) {
      btn.textContent = "Solo para " + a.para.map((p) => D.articulo(p).nombre).join(", ");
      btn.disabled = true;
    } else {
      btn.textContent = "Equipar";
      btn.dataset.accionTienda = "equipar";
    }
  }

  function pintar() { pintarLista(); pintarVitrina(); }

  ui.accion.addEventListener("click", () => {
    const a = D.articulo(elegido);
    const que = ui.accion.dataset.accionTienda;
    if (que === "comprar") {
      const r = D.comprar(a.id);
      if (r.ok) {
        Snd.reproducir("comprar");
        ui.nota.textContent = a.cat === "mejoras" ? "¡Mejora comprada! Ya funciona en la Carrera." : "¡Comprado y equipado!";
        lanzarConfeti();
        deps.alCambiarEquipo();
      } else if (r.motivo === "saldo insuficiente") {
        Snd.reproducir("error");
        ui.nota.textContent = "Te faltan " + r.faltan + " monedas. ¡Corre un poco más!";
        ui.accion.classList.add("sacude");
        setTimeout(() => ui.accion.classList.remove("sacude"), 300);
      }
    } else if (que === "equipar") {
      const r = D.equipar(a.id);
      if (r.ok) { Snd.reproducir("equipar"); ui.nota.textContent = a.cat === "personajes" ? "¡" + a.nombre + " está listo para correr!" : "Equipado en " + NOMBRE_RANURA[a.ranura] + "."; deps.alCambiarEquipo(); }
    } else if (que === "quitar") {
      D.quitar(a.ranura);
      Snd.reproducir("boton");
      ui.nota.textContent = "Lo guardamos en tu colección.";
      deps.alCambiarEquipo();
    }
    pintar();
  });

  ui.pestanas.forEach((p) => p.addEventListener("click", () => {
    categoria = p.dataset.categoria;
    const d = D.leer();
    const lista = D.CATALOGO.filter((a) => a.cat === categoria);
    // Elegir lo equipado de esa categoría o el primero
    const puesto = lista.find((a) => estadoDe(a, d).puesto);
    elegido = (puesto || lista[0]).id;
    ui.nota.textContent = "";
    Snd.reproducir("boton");
    pintar();
  }));

  /* ---------- Animación de la vitrina ---------- */
  function lanzarConfeti() {
    const colores = ["#ffe08a", "#ff6b6b", "#5ff0ff", "#b9a7e0", "#fff7e8", "#e8792e"];
    for (let i = 0; i < 40; i++) {
      confeti.push({ x: 32, y: 26, vx: (Math.random() - 0.5) * 70, vy: -30 - Math.random() * 50, vida: 1 + Math.random() * 0.6, color: colores[i % colores.length] });
    }
  }

  function dibujar(dt) {
    tiempo += dt;
    const g = vctx, W = 64, H = 48;
    // Cielo con estrellas y suelo
    g.fillStyle = "#0d0f26"; g.fillRect(0, 0, W, H);
    g.fillStyle = "#151a3e"; g.fillRect(0, 16, W, 24);
    g.fillStyle = "#1d2452"; g.fillRect(0, 28, W, 12);
    for (let i = 0; i < 9; i++) {
      const x = (i * 23 + 7) % W, y = (i * 11 + 3) % 30;
      g.fillStyle = (Math.floor(tiempo * 2 + i) % 3) ? "#cfc6e6" : "#3b4478";
      g.fillRect(x, y, 1, 1);
    }
    g.fillStyle = "#16152a"; g.fillRect(0, 40, W, 8);
    g.fillStyle = "#e8792e"; g.fillRect(0, 40, W, 1);
    for (let x = -(Math.floor(tiempo * 40) % 8); x < W; x += 8) { g.fillStyle = "#7a3a1f"; g.fillRect(x, 43, 3, 1); }

    const a = D.articulo(elegido);
    if (a.cat === "mejoras") {
      const tipo = a.id === "iman2" ? "iman" : "escudo";
      const m = PJ.construir(D.equipado()).correr[Math.floor(tiempo * 9) % 6].der;
      g.drawImage(m, 23, 40 - m.height);
      if (tipo === "escudo") {
        const r = 13 + Math.round(Math.sin(tiempo * 4));
        g.strokeStyle = "rgba(122, 166, 207, 0.9)"; g.lineWidth = 1;
        for (let k = 0; k < 32; k++) { const ang = (k / 32) * Math.PI * 2 + tiempo; if (k % 3) g.fillStyle = "#7aa6cf", g.fillRect(Math.round(32 + Math.cos(ang) * r), Math.round(30 + Math.sin(ang) * r), 1, 1); }
      } else {
        for (let k = 0; k < 4; k++) {
          const f = ((tiempo * 0.8 + k / 4) % 1);
          const x = Math.round(60 - f * 26), y = Math.round(12 + k * 6 + f * (20 - k * 6) * 0.6);
          g.drawImage(S.moneda[Math.floor(tiempo * 8 + k) % 8].der, x - 6, y - 6);
        }
      }
      g.drawImage(S.iconos[tipo], 3, 3);
      mas(g, 15, 2);
    } else {
      const m = PJ.construir(equipoDePrueba(a));
      const corre = Math.floor(tiempo / 2.4) % 2 === 1;
      const f = corre ? m.correr[Math.floor(tiempo * 9) % 6] : (tiempo % 3 < 0.12 ? m.parpadeo : m.quieto[Math.floor(tiempo * 1.8) % 2]);
      g.drawImage(f.der, 23, 40 - f.der.height);
    }
    // Confeti de compra
    confeti.forEach((p) => { p.vida -= dt; p.vy += 90 * dt; p.x += p.vx * dt; p.y += p.vy * dt; g.fillStyle = p.color; g.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); });
    confeti = confeti.filter((p) => p.vida > 0);
  }

  /* ---------- Misiones ---------- */
  const ICONOS_MISION = { distancia: "bandera", monedas: "moneda", poderes: "rayo" };
  function pintarMisiones(lista, contenedor) {
    contenedor.innerHTML = "";
    lista.forEach((m) => {
      const li = document.createElement("li");
      li.className = "mision" + (m.lista ? " cumplida" : "");
      const pct = Math.round((100 * m.progreso) / m.meta);
      li.innerHTML =
        '<span class="mision-icono icono-' + ICONOS_MISION[m.tipo] + '" aria-hidden="true"></span>' +
        '<span class="mision-texto"></span>' +
        '<span class="mision-barra" role="progressbar" aria-valuemin="0" aria-valuemax="' + m.meta + '" aria-valuenow="' + m.progreso + '"><span style="width:' + pct + '%"></span></span>' +
        '<span class="mision-cuenta">' + m.progreso + "/" + m.meta + "</span>" +
        '<span class="mision-premio"><span class="icono-moneda"></span>+' + m.premio + "</span>";
      li.querySelector(".mision-texto").textContent = m.texto;
      contenedor.appendChild(li);
    });
  }

  return {
    abrir(cat, titulo) {
      categoria = cat || "personajes";
      const d = D.leer();
      const lista = D.CATALOGO.filter((a) => a.cat === categoria);
      const puesto = lista.find((a) => estadoDe(a, d).puesto);
      elegido = (puesto || lista[0]).id;
      ui.titulo.textContent = titulo || "Tienda";
      ui.nota.textContent = "";
      pintar();
    },
    dibujar: dibujar,
    pintarMisiones: pintarMisiones,
    /* ¿Hay algo nuevo que ya se puede comprar? */
    hayNovedad() {
      const d = D.leer();
      return D.CATALOGO.some((a) => d.comprados.indexOf(a.id) < 0 && d.saldo >= a.precio);
    },
    alcanzables() {
      const d = D.leer();
      return D.CATALOGO.filter((a) => d.comprados.indexOf(a.id) < 0 && d.saldo >= a.precio);
    }
  };
};
