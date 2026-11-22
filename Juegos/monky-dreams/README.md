# Monky Dreams 🐒💤

Videojuego de plataformas 2D en pixel art para **MoncadaArt**.
Monky, la mascota que duerme en la portada del portafolio, sueña que entra a un mundo pixelado.
Tiene que correr, saltar, reunir monedas y llegar al despertador para despertar.

> **Estado:** primera versión jugable (nivel 1), integrada en el apartado **Juegos** del portafolio
> mediante `Juegos/manifest.json`. No se modificó `juegos.html` ni ningún otro archivo existente:
> el apartado ya sabía mostrar un botón **Jugar** para los proyectos con `href`.

## Dónde se juega (una vez publicado)

GitHub Pages publica MoncadaArt desde la rama `main` del repositorio `moncadaart`:

- Portafolio: <https://christianmon0108.github.io/moncadaart/>
- Apartado Juegos: <https://christianmon0108.github.io/moncadaart/juegos.html> → tarjeta **Monky Dreams** → **Jugar / Abrir proyecto →**
- Juego directo: <https://christianmon0108.github.io/moncadaart/Juegos/monky-dreams/>

> Nota: `https://christianmon0108.github.io/` (sin `/moncadaart/`) pertenece a otro repositorio
> (`Christianmon0108.github.io`) y hoy solo muestra un README.

---

## Cómo probarlo

### Opción 1: abrir el archivo
Abre `Juegos/monky-dreams/index.html` con doble clic en Chrome, Edge, Firefox o Safari.
El juego usa scripts clásicos (no módulos), así que funciona incluso desde `file://`.

### Opción 2: servidor local (para probar cambios antes de publicarlos)
Desde la raíz del repositorio:

```bash
python3 -m http.server 8000
```

Luego abre:

- En la computadora: <http://localhost:8000/Juegos/monky-dreams/>
- En el celular (misma red Wi-Fi): `http://IP-DE-TU-COMPUTADORA:8000/Juegos/monky-dreams/`

### Parámetros útiles de la URL

| Parámetro | Para qué sirve |
|---|---|
| `?tactil` | Fuerza los controles táctiles en la computadora (para revisar su diseño). |
| `?depurar` | Activa herramientas de prueba en la consola: `MonkyDreams.depurar.teletransportar(columna, fila)` y `MonkyDreams.depurar.quitarVida()`. |

---

## Controles

| Acción | Teclado | Celular |
|---|---|---|
| Moverse | `←` `→` o `A` `D` | Botones ◀ ▶ (puedes deslizar el dedo entre ellos) |
| Saltar | `Espacio`, `↑`, `W`, `Z` o `K` | Botón redondo **Saltar** |
| Salto corto / largo | Suelta o mantén el botón de salto | Igual |
| Pausa | `P` o `Esc` | Botón **II** |
| Sonido | `M` | Botón **♪** |
| Empezar / reintentar | `Enter` | Botón en pantalla |

En el celular se recomienda la posición horizontal. En vertical también se puede jugar:
el juego queda arriba y los controles abajo.

---

## Qué incluye esta demo

- **Pantalla inicial** con Monky durmiendo sobre una nube y el botón **Jugar**.
- **Un nivel completo** (130 × 12 casillas) con cámara lateral suave y anticipación hacia donde miras.
- **Monky en pixel art original** (16 × 16): reposo con respiración y parpadeo, 4 cuadros de carrera,
  salto, caída y golpe. Gorra azul hacia atrás, cara durazno, sudadera crema y tenis naranjas,
  inspirado en la mascota de MoncadaArt pero dibujado desde cero con código.
- **Física cuidada:** gravedad, aceleración y fricción, salto variable, *coyote time* (puedes saltar
  justo después de dejar una orilla) y *jump buffer* (el salto se recuerda unos milisegundos antes
  de tocar el suelo). Paso fijo de 1/60 s para que se sienta igual en cualquier pantalla.
- **29 monedas MoncadaArt** (doradas, con una "M", giran en 4 cuadros). Algunas marcan el camino
  de los saltos y otras premian a quien se arriesga.
- **Obstáculos y enemigos:**
  - **Bichos** (sí, *bugs* de programación 🐛): patrullan y se pueden aplastar saltando encima.
  - **Pesadillas** flotantes: no se pueden aplastar, hay que esquivarlas.
  - **Púas de cristal** y **vacíos**.
- **Plataformas:** bloques sólidos tipo tarjeta, nubes que se atraviesan desde abajo y una
  plataforma móvil que te lleva.
- **Lámpara de escritorio** como punto de control.
- **3 vidas**, contador de monedas, pantalla de **victoria** (con monedas, tiempo y vidas),
  pantalla de **derrota** y **reinicio**.
- **Efectos de sonido chiptune** generados con Web Audio (sin archivos de audio) y botón para silenciarlos.
- **Pausa automática** si cambias de pestaña o la ventana pierde el foco.

---

## Estructura

```
Juegos/monky-dreams/
├── index.html      Página del juego y pantallas (inicio, pausa, derrota, victoria)
├── estilos.css     Diseño de la interfaz y de los controles táctiles
├── README.md       Este archivo
├── media/          Portada y capturas que usa la tarjeta de juegos.html
└── js/
    ├── sprites.js  Pixel art definido como texto + paleta de colores
    ├── nivel.js    Mapa del nivel en caracteres (fácil de editar)
    ├── sonido.js   Efectos de sonido sintetizados
    └── juego.js    Motor: física, colisiones, enemigos, cámara, HUD e interfaz
```

Sin dependencias ni proceso de compilación. El único recurso externo es la fuente
**Pixelify Sans** de Google Fonts; si no carga, se usa una fuente monoespaciada del sistema.

### Editar el nivel
El nivel está en `js/nivel.js` como un dibujo de texto. Cada carácter es una casilla de 16 × 16 px:

```
.  vacío              #  suelo               B  bloque sólido
-  nube (atravesable)  ^  púas               ~  plataforma móvil
O  moneda
E  bicho              N  pesadilla           L  lámpara (punto de control)
M  inicio de Monky    Z  despertador (meta)
```

### Editar el arte
En `js/sprites.js`, cada sprite es una lista de filas de texto; cada letra es un color de la
`PALETA`. Por ejemplo, `c` es el azul de la gorra y `s` el naranja de los tenis.

---

## Lista de verificación manual

- [ ] La pantalla inicial muestra a Monky durmiendo y el botón **Jugar** funciona con clic, toque y `Enter`.
- [ ] Monky corre, salta (corto y largo) y cae con suavidad; no atraviesa el suelo ni los bloques.
- [ ] Las nubes se atraviesan desde abajo y sostienen a Monky desde arriba.
- [ ] La plataforma móvil lo transporta.
- [ ] Saltar sobre un bicho lo aplasta; tocarlo de lado quita una vida.
- [ ] Las púas y las pesadillas quitan una vida; caer al vacío regresa a la última lámpara.
- [ ] El contador de monedas sube al recogerlas.
- [ ] Al tocar el despertador aparece **¡Monky despertó!** con el resumen.
- [ ] Al perder las 3 vidas aparece **Fin del sueño** y se puede reintentar.
- [ ] Pausa con `P`/`Esc` o el botón **II**; se pausa solo al cambiar de pestaña.
- [ ] En el celular, los botones táctiles responden, incluso moviéndote y saltando a la vez.
- [ ] En `juegos.html` aparece la tarjeta de Monky Dreams y su botón **Jugar / Abrir proyecto →** abre el juego.
- [ ] El enlace **← Volver a MoncadaArt** regresa al apartado Juegos.

---

## Próximos pasos posibles (requieren aprobación)

- Más niveles: uno por área del portafolio (estudio 3D, sala de edición, taller de ropa…).
- Música de fondo, tabla de récords local y animación de "despertar" que regrese al portafolio.
