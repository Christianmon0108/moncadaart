# Monky Dreams 🐒💤

Videojuego 2D en **pixel art** para **MoncadaArt**. Monky, la mascota que duerme en la portada
del portafolio, sueña que corre por un mundo que se genera solo y nunca termina.

> **Versión 4.0 — Más divertido.** Tienda, personajes, misiones, eventos y rutas dobles en la
> Carrera infinita. Incluye también el modo **Aventura**.

## Dónde se juega

GitHub Pages publica MoncadaArt desde la rama `main` del repositorio `moncadaart`:

- Apartado Juegos: <https://christianmon0108.github.io/moncadaart/juegos.html> → tarjeta **Monky Dreams** → **Jugar / Abrir proyecto →**
- Juego directo: <https://christianmon0108.github.io/moncadaart/Juegos/monky-dreams/>

### Respaldos de versiones anteriores

- Versión 3.1 (antes de la tienda): rama **`claude/monky-dreams-v3.1-respaldo`**.
- Versión 2.0: rama **`claude/monky-dreams-v2-respaldo`**.

Ambas siguen también en el historial de `main`. Para recuperar una, basta con restaurar la carpeta
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

### Novedades de la 4.0 en la Carrera

- **Rutas dobles:** *autopista de nubes* (arriba, con monedas; abajo, púas que se saltan) y
  *túnel* (subir a los bloques o pasar deslizándose). Las dos rutas se validan con la física real.
- **Gota de tinta:** cae del cielo cuando Monky se acerca; su sombra en el suelo avisa antes y
  queda un charco que hay que saltar.
- **Avisos:** un "!" en el borde derecho anuncia troncos y cuervos que todavía no se ven.
- **Eventos aleatorios** (breves, anunciados y justos):
  - *Pesadilla de tinta:* una ola de tinta persigue a Monky unos 13 s. Si escapa sin tropezar,
    gana 15 monedas; si lo alcanza, pierde una vida (no la partida, salvo la última).
  - *Monedas dobles:* durante 10 s cada moneda vale 2 (indicador ×2 en el HUD).
  - *Estrella fugaz:* aparece sobre la ruta y vale 15 monedas.
- **Recompensas:** cada moneda de una racha suena más aguda; completar un grupo de monedas da +2;
  pisar varios enemigos sin tocar el suelo da un combo con monedas extra.
- **Cambio de mundo:** destello y partículas con los colores del mundo nuevo y un sonido de portal.
- Los tramos se generan en un **Web Worker** (`js/trabajador.js`): el juego no se traba en celulares lentos.

### Tienda, economía y misiones

- Las monedas de cada Carrera se suman al **saldo** al terminar (también si se reinicia o se vuelve
  al menú). Cada partida se cobra **una sola vez**: recargar o repetir no duplica monedas.
- **Tienda** (botón *Tienda* o el nombre del personaje en el menú). Cada artículo tiene vista previa
  animada, precio, estado (bloqueado, tuyo o equipado) y el botón que corresponde:

  | Categoría | Artículo | Precio | Notas |
  |---|---|---|---|
  | Personajes | Monky | gratis | El original |
  | Personajes | Monky Explorador | 120 | Casco de safari y chaleco |
  | Personajes | Monky Cyber | 280 | Visor de neón y antena |
  | Personajes | Nubi | 450 | Ovejita de nube; al deslizarse se hace bolita |
  | Vestimentas | Pijama estelar | 90 | Solo Monky |
  | Vestimentas | Sudadera atardecer | 150 | Solo Monky |
  | Accesorios | Gorro de dormir | 80 | Solo Monky (reemplaza la gorra) |
  | Accesorios | Bufanda cometa | 110 | Todos los personajes |
  | Mejoras | Imán potente | 200 | Imán de 15 s (antes 10) y mayor alcance |
  | Mejoras | Escudo reforzado | 300 | Escudo de 15 s (antes 10) y 1 s extra de protección al terminar |

  Solo se equipa un personaje y lo que ese personaje puede usar; al cambiar de personaje lo
  incompatible se quita, pero sigue comprado. El personaje elegido también juega la Aventura.
- **Misiones** (se renuevan al cumplirlas, cada vez un poco más difíciles): recorrer cierta distancia
  en una partida, reunir monedas en total y usar poderes en una partida. Se ven en el menú
  *Misiones*, se avisan en la carrera al cumplirse y su premio se cobra al terminar.
- **Resultados:** distancia, monedas, récord, monedas ganadas, saldo, misiones cumplidas y aviso de
  lo que ya alcanza para comprar.
- Todo se guarda en `localStorage` (`monky-dreams-datos`): saldo, compras, equipo, récord,
  estadísticas y misiones. Los datos se validan al leerlos (valores inválidos o manipulados se
  corrigen) y se conserva el récord de versiones anteriores. No hay pagos ni dinero real.

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
| `?depurar` | Herramientas de prueba en la consola (`MonkyDreams.depurar` y `MonkyDreams.carrera`: piloto automático, saltar metros, activar poderes, forzar eventos, turbo). |
| `?sintrabajador` | Genera los tramos en el hilo principal (sin Web Worker). |

### Pruebas automáticas (Node)

```bash
node Juegos/monky-dreams/pruebas/carrera.js 6000 10   # generador + recorrido encadenado
node Juegos/monky-dreams/pruebas/tienda.js            # saldo, compras, equipo, misiones y datos dañados
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
    ├── trabajador.js Genera los tramos en segundo plano (Web Worker)
    ├── carrera.js    Modo Carrera infinita
    ├── datos.js      Saldo, compras, equipo, récord y misiones (localStorage)
    ├── tienda.js     Tienda, vista previa y panel de misiones
    ├── personajes.js Personajes, vestimentas y accesorios
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
