# Monky Run: El Gran Borrador 🐒✏️

Videojuego 2D en **pixel art** para **MoncadaArt**. Monky es un artista que escapa de **El Gran
Borrador**, una máquina gigante con orugas, brazos mecánicos y una goma enorme que intenta borrar
sus creaciones. Corre, salta y deslízate por cuatro mundos que se generan solos y nunca terminan.

> **Versión 5.0 — Nueva identidad.** Antes se llamaba *Monky Dreams*. La carpeta y la dirección
> (`Juegos/monky-dreams/`) se mantienen para no romper los enlaces existentes, igual que las claves
> de guardado: tu saldo, compras, récord y misiones siguen funcionando.

## Dónde se juega

GitHub Pages publica MoncadaArt desde la rama `main` del repositorio `moncadaart`:

- Apartado Juegos: <https://christianmon0108.github.io/moncadaart/juegos.html> → tarjeta **Monky Dreams** → **Jugar / Abrir proyecto →**
- Juego directo: <https://christianmon0108.github.io/moncadaart/Juegos/monky-dreams/>

### Respaldos de versiones anteriores

- Versión 4.0 (Monky Dreams con tienda): commit `7fea5f4` del historial de `main`.
- Versión 3.1: rama **`claude/monky-dreams-v3.1-respaldo`**.
- Versión 2.0: rama **`claude/monky-dreams-v2-respaldo`**.

Para recuperar una versión, basta con restaurar la carpeta `Juegos/monky-dreams/` desde ese punto.

---

## Modos de juego

### Carrera infinita (principal)

- Monky corre solo hacia la derecha; tú controlas el **salto** (mantener = más alto) y el
  **deslizamiento** (para pasar bajo techos bajos, lápices voladores y prensas).
- El terreno se genera por **tramos** que se validan con la física real; los que quedan atrás se
  descartan (en memoria nunca hay más de unos 6 tramos).
- **Dificultad progresiva:** la velocidad sube de 118 a ~205 px/s y aparecen más patrones,
  combinaciones y enemigos, siempre dentro de lo que el salto de Monky puede superar.

#### El Gran Borrador

- Persigue a Monky durante toda la carrera. Al principio solo asoma su goma por la izquierda.
- **Arremete** cada tanto (más fuerte y seguido con la dificultad), pero si Monky no tropieza
  **nunca llega a alcanzarlo**: entre arremetidas siempre recupera la distancia.
- **Cada tropiezo lo acerca.** Dos o tres tropiezos seguidos y te alcanza.
- **Retrocede** con el impulso, al pisar enemigos, al completar grupos de monedas, al atrapar
  estrellas y al resistir su aceleración.
- Cuando está cerca, **el escenario pierde el color**; detrás de él todo queda borrado como una
  hoja en blanco.
- **Si alcanza a Monky, termina la partida** (el escudo te salva una vez).

#### Cuatro mundos (cambian cada 500 m)

| Mundo | Escenario | Obstáculos y enemigos propios |
|---|---|---|
| **El Cuaderno** | Hoja rayada, sol garabateado, casitas y árboles dibujados a lápiz | Garabatos que caminan (se pisan), lápices voladores (altos: deslizarse; bajos: saltar), gotas de tinta que caen, puntas de lápiz, reglas como plataformas |
| **Bosque de Colores** | Atardecer pastel, árboles morados con frutos de colores | Hongos saltarines, troncos rodantes, mariposas de colores, hongos-plataforma |
| **Ciudad Digital** | Rascacielos de neón, circuitos y lluvia de datos | Robots, drones, láseres y paneles holográficos |
| **Fábrica de Ideas** | Chimeneas con humo, tuberías y engranajes que giran | Prensas que bajan y suben (pasar a tiempo o deslizarse), engranajes que ruedan saltando, chispas eléctricas en picada, cajas y vigas de acero |

### Más mecánicas de la Carrera

- **Rutas dobles:** *autopista de nubes* (arriba, con monedas; abajo, púas que se saltan) y
  *túnel* (subir a los bloques o pasar deslizándose). Las dos rutas se validan con la física real.
- **Gota de tinta:** cae del cielo cuando Monky se acerca; su sombra en el suelo avisa antes y
  queda un charco que hay que saltar.
- **Avisos:** un "!" en el borde derecho anuncia troncos, lápices, engranajes y chispas que todavía no se ven.
- **Eventos aleatorios** (breves, anunciados y justos):
  - *El Borrador acelera:* durante 8 s arremete más seguido. Si resistes, ganas 15 monedas y lo alejas.
  - *Monedas dobles:* durante 10 s cada moneda vale 2 (indicador ×2 en el HUD).
  - *Estrella fugaz:* aparece sobre la ruta y vale 15 monedas.
- **Recompensas:** cada moneda de una racha suena más aguda; completar un grupo de monedas da +2;
  pisar varios enemigos sin tocar el suelo da un combo con monedas extra.
- **Cambio de mundo:** portal, destello y partículas con los colores del mundo nuevo.
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
  | Personajes | Nubi | 450 | Ovejita de nube que se escapó de un dibujo; al deslizarse se hace bolita |
  | Vestimentas | Traje estelar | 90 | Solo Monky |
  | Vestimentas | Sudadera atardecer | 150 | Solo Monky |
  | Accesorios | Gorro de borla | 80 | Solo Monky (reemplaza la gorra) |
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

El nivel "El primer boceto": un nivel completo sobre la hoja de cuaderno, con monedas, lámpara de
punto de control y el reloj de entrega como meta.

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
