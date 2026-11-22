# Monky Dreams 🐒💤

Videojuego de plataformas 2D en **pixel art de 16 bits** para **MoncadaArt**.
Monky, la mascota que duerme en la portada del portafolio, sueña que entra a un mundo
pixelado: corre, salta, reúne monedas y llega al despertador para despertar.

> **Versión 2.0 — Fase 1 (pixel art).** Modo Aventura con arte, animaciones,
> fondos y jugabilidad renovados. El modo **Carrera Infinita** se desarrollará en una fase posterior.

## Dónde se juega

GitHub Pages publica MoncadaArt desde la rama `main` del repositorio `moncadaart`:

- Apartado Juegos: <https://christianmon0108.github.io/moncadaart/juegos.html> → tarjeta **Monky Dreams** → **Jugar / Abrir proyecto →**
- Juego directo: <https://christianmon0108.github.io/moncadaart/Juegos/monky-dreams/>

El juego aparece en `juegos.html` gracias a `Juegos/manifest.json`; no se modificó ningún archivo del portafolio.

---

## Dirección artística

- **Resolución interna 320 × 180**, cuadrícula de **16 × 16**, escalado con píxeles nítidos
  (`image-rendering: pixelated`, sin suavizado).
- **Paleta:** azul noche, naranja MoncadaArt, dorado y crema, con rampas de 3-4 tonos por material.
- **Monky (18 × 20 px):** gorra azul hacia atrás, ojos tipo cuenta, lengua naranja, sudadera crema
  y tenis naranjas. Expresiones: normal, parpadeo, feliz, dolor y dormido.
- **Animaciones:** respiración y parpadeo, carrera de 6 cuadros con rebote de cabeza, salto, caída,
  golpe, festejo, estirar y aplastar al saltar y aterrizar, polvo al correr y al frenar.
- **Escenario:** suelo con musgo naranja, briznas y piedritas; bloques biselados con rombo;
  nubes esponjosas; cristales; letrero y flores.
- **Fondo con parallax:** cielo con tramado ordenado, luna con cráteres y halo, montañas,
  islas flotantes con una casita iluminada y una cascada, colinas con lápices y libros gigantes,
  estrellas que titilan, estrellas fugaces y luciérnagas.
- **Objetos:** monedas MoncadaArt con giro de 8 cuadros, almohada voladora con alitas,
  lámpara de escritorio y despertador.
- **Interfaz pixel:** logotipo dibujado en el lienzo, botones y marcos con esquinas recortadas
  sobre la misma retícula del juego e íconos SVG pixel a pixel.

## Cómo probarlo localmente

Desde la raíz del repositorio:

```bash
python3 -m http.server 8000
```

- Computadora: <http://localhost:8000/Juegos/monky-dreams/>
- Celular (misma red Wi-Fi): `http://IP-DE-TU-COMPUTADORA:8000/Juegos/monky-dreams/`

También funciona abriendo `Juegos/monky-dreams/index.html` con doble clic.

| Parámetro | Para qué sirve |
|---|---|
| `?tactil` | Fuerza los controles táctiles en la computadora. |
| `?depurar` | Herramientas de prueba en la consola: `MonkyDreams.depurar.teletransportar(columna, fila)` y `MonkyDreams.depurar.quitarVida()`. |

## Controles

| Acción | Teclado | Celular |
|---|---|---|
| Moverse | `←` `→` o `A` `D` | Flechas ◀ ▶ (puedes deslizar el dedo entre ellas) |
| Saltar (corto o largo) | `Espacio`, `↑`, `W`, `Z` o `K` | Botón de salto |
| Pausa | `P` o `Esc` | Botón de pausa |
| Sonido | `M` | Botón de sonido |
| Pantalla completa | `F` | Botón de pantalla completa (si el navegador la permite) |
| Empezar / reintentar | `Enter` | Botón en pantalla |

### En el celular

- **Horizontal (recomendado):** el juego queda al centro y los controles a los lados, sin tapar la acción.
- **Vertical:** el juego queda arriba y los controles abajo.
- **Pantalla completa:** en Android y en navegadores que la permiten aparece el botón ⛶,
  que también intenta fijar la orientación horizontal.
  En **iPhone** (Safari no permite pantalla completa en páginas web), toca **Compartir → Agregar a
  pantalla de inicio**: el juego se abre como app a pantalla completa (`app.webmanifest`).

---

## Modo Aventura

- Nivel "El primer sueño" (138 × 12 casillas) en 7 zonas: inicio, nubes sobre el abismo,
  pradera de bichos, escalera y cielo, almohada voladora, zona de la pesadilla y despertador.
- 31 monedas, 3 vidas, lámpara de escritorio como punto de control.
- Enemigos: **bichos** (*bugs*: se aplastan saltando encima) y una **pesadilla** flotante (hay que esquivarla).
- Peligros: cristales y vacíos.
- Pantallas de inicio, pausa, victoria (monedas, tiempo y vidas) y derrota.

### Correcciones de jugabilidad de esta versión

- La moneda sobre el hueco de la escalera, que provocaba caídas injustas, ahora está sobre la nube
  de aterrizaje (antes, el 99 % de los intentos de tomarla terminaba en caída).
- El escalón superior de la escalera es más ancho: subir corriendo ya no te lanza al hueco.
- Ningún enemigo patrulla junto al punto de control.
- La pesadilla y el bicho del final ya no se combinan en el mismo tramo.
- La meta ocupa toda la columna del despertador: pasar por encima también cuenta.
- Física más fluida: aceleración y frenado ajustados, giro rápido, gravedad suave en el punto
  más alto del salto, *coyote time* y *jump buffer*.

---

## Estructura

```
Juegos/monky-dreams/
├── index.html        Página del juego, pantallas e íconos pixel
├── estilos.css       Interfaz pixel art y controles táctiles
├── app.webmanifest   Para abrirlo a pantalla completa desde la pantalla de inicio
├── README.md         Este archivo
├── media/            Portada, capturas (tarjeta de juegos.html) e íconos
├── pruebas/
│   └── alcance.js    Prueba automática de alcance del nivel
└── js/
    ├── fisica.js     Movimiento, salto y colisiones (compartido con las pruebas)
    ├── sprites.js    Monky, enemigos, monedas y efectos en pixel art
    ├── escenario.js  Casillas, decoraciones, fondo con parallax y almohada voladora
    ├── nivel.js      Mapa del nivel en caracteres
    ├── sonido.js     Efectos de sonido sintetizados (Web Audio)
    └── juego.js      Motor: estados, cámara, enemigos, HUD e interfaz
```

Sin dependencias ni compilación. El único recurso externo es la fuente **Pixelify Sans** (Google Fonts);
si no carga, se usa una fuente monoespaciada del sistema.

### Editar el nivel

`js/nivel.js` es un dibujo de texto; cada carácter es una casilla de 16 × 16 px:

```
.  vacío              #  suelo               B  bloque sólido
-  nube (atravesable)  ^  cristales          ~  almohada voladora
O  moneda             E  bicho               N  pesadilla
L  lámpara            M  inicio de Monky     Z  despertador (meta)
a  letrero            f  flores
```

Después de editarlo, comprueba que siga siendo justo:

```bash
node Juegos/monky-dreams/pruebas/alcance.js
```

La prueba usa la misma física del juego y verifica que la meta sea alcanzable, que todas las
monedas se puedan tomar aterrizando a salvo, que ninguna moneda haga caer en más de la mitad de
los intentos y que no haya pasillos demasiado bajos para Monky.

---

## Lista de verificación manual

- [ ] La portada muestra el logotipo pixel y a Monky dormido sobre la nube.
- [ ] Monky corre, frena, salta (corto y largo) y aterriza con polvo y aplastamiento.
- [ ] Las monedas giran y suman al contador con un destello y un "+1".
- [ ] Pisar un bicho lo aplasta; tocarlo de lado, la pesadilla o los cristales quitan una vida.
- [ ] Caer al vacío regresa a la lámpara encendida.
- [ ] La almohada voladora transporta a Monky.
- [ ] El despertador muestra **¡Monky despertó!**; al perder 3 vidas aparece **Fin del sueño**.
- [ ] En el celular horizontal, los controles quedan a los lados sin tapar el juego.
- [ ] El botón de pantalla completa aparece solo cuando el navegador lo permite.
- [ ] **← Volver a MoncadaArt** regresa al apartado Juegos.

## Próxima fase

- **Carrera Infinita:** una pesadilla de sombras persigue a Monky (no incluida en esta versión).
