# Monky Dreams 🐒💤

Videojuego 2D en **pixel art** para **MoncadaArt**. Monky, la mascota que duerme en la portada
del portafolio, sueña que corre por un mundo que se genera solo y nunca termina.

> **Versión 3.1 — Carrera infinita.** Incluye también el modo **Aventura** de la versión 2.0.
> La 3.1 corrige la cantidad de monedas, las nubes en las que no se podía aterrizar y el HUD de ambos modos.

## Dónde se juega

GitHub Pages publica MoncadaArt desde la rama `main` del repositorio `moncadaart`:

- Apartado Juegos: <https://christianmon0108.github.io/moncadaart/juegos.html> → tarjeta **Monky Dreams** → **Jugar / Abrir proyecto →**
- Juego directo: <https://christianmon0108.github.io/moncadaart/Juegos/monky-dreams/>

### Respaldo de la versión anterior

La versión 2.0 publicada se conserva en la rama **`claude/monky-dreams-v2-respaldo`**
(y en el historial de `main`). Para recuperarla, basta con restaurar la carpeta
`Juegos/monky-dreams/` desde esa rama.

---

## Modos de juego

### Carrera infinita (principal)

- Monky corre solo hacia la derecha; tú controlas el **salto** (mantener = más alto) y el
  **deslizamiento** (para pasar bajo techos bajos y enemigos a la altura de la cabeza).
- El terreno se genera por **tramos** conforme avanzas y los tramos que quedan atrás se
  descartan (en memoria nunca hay más de unos 6 tramos).
- **Dificultad progresiva:** la velocidad sube de 118 a ~205 px/s; aparecen nuevos patrones
  (nubes, vallas, techos bajos, voladores, combinaciones) y los huecos crecen, siempre dentro
  de lo que el salto de Monky puede cruzar con margen.
- **Cuatro mundos** que cambian cada 500 m con transición suave y un portal de sueño:
  1. **Sueño nocturno** — luna, estrellas, montañas e islas flotantes.
  2. **Bosque mágico** — musgo, hongos luminosos y plataformas de hongo.
  3. **Mundo digital** — circuitos, torres de datos, lluvia de datos y láseres.
  4. **Pesadilla** — sombras, niebla, ojos en la oscuridad y una **sombra gigante** que persigue a Monky.
  Después vuelve a empezar con variaciones (por ejemplo, aurora en la noche).
- **Enemigos:** bichos y hongos saltarines (se aplastan saltando encima), troncos rodantes,
  polillas, drones, cuervos de sombra y láseres.
- **Poderes** (con su tiempo en el HUD): **escudo** (10 s, protege de todo), **imán** (10 s, atrae
  monedas), **doble salto** (12 s) e **impulso** (5 s: vuelo rasante que rompe obstáculos y cruza abismos).
- **3 vidas.** Al caer a un abismo, una **burbuja de sueño** te lleva al siguiente suelo seguro.
  En la Pesadilla, cada golpe acerca a la sombra; si te alcanza, termina la carrera.
- **Monedas como guía:** aparecen en grupos de 3 a 7 (unas 30–45 por cada 500 m) con tramos
  vacíos entre grupo y grupo. Dibujan la trayectoria de un salto (arco), una subida o bajada, o
  una línea sobre un camino seguro. Están sobre el recorrido comprobado, así que seguirlas
  siempre es posible.
- **Nubes y plataformas:** todas son sólidas desde arriba. Se colocan donde el salto real de Monky
  baja a su altura a la velocidad actual, y el validador exige pararse en cada una.
- **HUD:** distancia y récord arriba al centro; corazones y monedas arriba a la izquierda; debajo,
  los poderes activos con barra y segundos restantes. Nada queda bajo los botones.
- **Récord personal** guardado en el navegador (`localStorage`): distancia y monedas.

### Aventura

El nivel "El primer sueño" de la versión 2.0: un nivel completo con monedas, lámpara de punto de
control y el despertador como meta.

---

## Controles

| Acción | Teclado | Celular (Carrera) | Celular (Aventura) |
|---|---|---|---|
| Saltar | `Espacio`, `↑`, `W`, `Z`, `K` | Tocar la **mitad derecha** | Botón de salto |
| Deslizarse / caer rápido | `↓` o `S` | Mantener la **mitad izquierda** | — |
| Moverse | (automático) | (automático) | Flechas ◀ ▶ |
| Pausa · sonido · pantalla completa | `P` · `M` · `F` | Botones de arriba | Botones de arriba |

## Pantalla completa en el celular

- El juego **llena toda la pantalla** en cualquier proporción (16:9, 19.5:9, 4:3…): el área
  visible crece en lugar de dejar bandas negras, y cada pixel del juego ocupa un número entero de
  pixeles físicos (sin suavizado ni pixeles desparejos).
- **Android y computadora:** al tocar *Carrera infinita* (o el botón ⛶) se pide pantalla completa
  y, si el navegador lo permite, se fija la orientación horizontal.
- **iPhone:** Safari no permite pantalla completa en páginas web. El juego usa todo el espacio
  disponible y muestra la alternativa: **Compartir → Agregar a pantalla de inicio**, que abre el
  juego como app a pantalla completa (`app.webmanifest`).
- En vertical, el juego queda arriba con un aviso para girar el teléfono.

---

## Cómo probarlo localmente

```bash
python3 -m http.server 8000
# abrir http://localhost:8000/Juegos/monky-dreams/
```

| Parámetro | Para qué sirve |
|---|---|
| `?tactil` | Fuerza los controles táctiles en la computadora. |
| `?depurar` | Herramientas de prueba en la consola (`MonkyDreams.depurar` y `MonkyDreams.carrera`: piloto automático, saltar metros, activar poderes, turbo). |

### Pruebas automáticas (Node)

```bash
node Juegos/monky-dreams/pruebas/carrera.js 6000 10   # generador + recorrido encadenado
node Juegos/monky-dreams/pruebas/alcance.js           # nivel del modo Aventura
```

`pruebas/carrera.js` genera kilómetros de terreno con varias semillas, revalida cada tramo con
la física real (partiendo del estado exacto en que termina el anterior) y luego los recorre
encadenados con un piloto que repite las decisiones del validador: si el validador y el juego
coinciden, el piloto no recibe ningún golpe. Además informa las monedas por cada 500 m, el
tamaño de los grupos, comprueba que ninguna esté dentro de bloques o púas, que el piloto
(siguiendo la ruta marcada) las recoja todas, que se pare en cada nube y que cada salto a una
nube tenga una ventana de despegue cómoda.

---

## Cómo se garantiza que cada tramo sea superable

1. Cada tramo se arma con **patrones** (hueco, escalón, púas, nubes, valla, techo bajo, enemigo
   terrestre, volador, láser…) cuyos tamaños dependen del alcance real del salto a la velocidad actual.
2. Un **validador** (en `js/generador.js`) busca un recorrido sin daño usando `js/fisica.js`, la
   misma física del juego: correr, saltos de 4 alturas y deslizamientos. Prefiere correr y usa
   la menor cantidad de saltos; después centra cada salto en su ventana de despegue.
3. Cada salto o deslizamiento del recorrido debe funcionar también **1,5 cuadros antes o después**:
   ningún tramo exige precisión de cuadro exacto.
4. Los enemigos se mueven según el avance de Monky, así se comportan igual en el validador y en el juego.
5. Si un tramo no es superable se descarta; si ninguno sirve, se usa un tramo llano de respaldo.
6. Cada nube o plataforma del tramo debe formar parte del recorrido: ninguna es decorado.
7. Las monedas se colocan sobre el recorrido encontrado: siempre guían un salto posible.

## Estructura

```
Juegos/monky-dreams/
├── index.html        Página, menús e íconos pixel
├── estilos.css       Interfaz pixel art, pantalla completa y controles táctiles
├── app.webmanifest   Abrir a pantalla completa desde la pantalla de inicio
├── media/            Portada, capturas e íconos
├── pruebas/          alcance.js (Aventura) y carrera.js (Carrera infinita)
└── js/
    ├── fisica.js     Física de Monky (plataformas y corredor), compartida con las pruebas
    ├── generador.js  Tramos, mundos, dificultad y validador
    ├── carrera.js    Modo Carrera infinita
    ├── aventura.js   Modo Aventura
    ├── sprites.js    Monky, enemigos, poderes, monedas y efectos
    ├── escenario.js  Casillas y fondos con parallax de los 4 mundos
    ├── hud.js        Texto pixel, logotipo y paneles
    ├── pantalla.js   Resolución dinámica, pantalla completa y orientación
    ├── entrada.js    Teclado y táctil
    ├── nivel.js      Mapa del modo Aventura
    ├── sonido.js     Efectos de sonido (Web Audio)
    └── juego.js      Menú, modos, pausa, récord y bucle principal
```

Sin dependencias ni compilación. El único recurso externo es la fuente **Pixelify Sans**
(Google Fonts); si no carga, se usa una fuente monoespaciada del sistema.
