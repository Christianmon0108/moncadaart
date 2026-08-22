/* =========================================================
   MoncadaArt — Home grid rotativo (6 proyectos)

   - Lee manifests por categoría
   - Selecciona 6 proyectos
   - Cambia la selección cada X tiempo
   - Detecta miniaturas automáticas de YouTube
   - Soporta YouTube normal, Shorts y youtu.be
   ========================================================= */


/* =========================================================
   AJUSTES
   ========================================================= */

const CATEGORY_DIRS = [
  "Modelado",
  "Programacion",
  "Edicion",
  "Musica",
  "IA",
  "Juegos"
];

const MANIFEST_NAME = "manifest.json";


/*
  ¿Cada cuánto cambia la selección?

  1 hora:
  60 * 60 * 1000

  30 minutos:
  30 * 60 * 1000

  5 minutos:
  5 * 60 * 1000
*/

const ROTATE_WINDOW_MS =
  60 * 60 * 1000;


const HOME_COUNT = 6;


const GRID =
  document.getElementById(
    "project-grid"
  );



/* =========================================================
   ESCAPAR HTML
   ========================================================= */

function escapeHTML(value = "") {

  return String(value)

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}



/* =========================================================
   PLACEHOLDER SVG
   ========================================================= */

function placeholderSVG(
  title = "Proyecto"
) {

  const safeTitle =
    String(title)

      .replace(
        /&/g,
        "&amp;"
      )

      .replace(
        /</g,
        "&lt;"
      )

      .replace(
        />/g,
        "&gt;"
      );


  return `data:image/svg+xml,${
    encodeURIComponent(

      "<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500'>"

      +

      "<defs>"

      +

      "<linearGradient id='g' x1='0' x2='1'>"

      +

      "<stop offset='0%' stop-color='#1fa2ff'/>"

      +

      "<stop offset='50%' stop-color='#12d8fa'/>"

      +

      "<stop offset='100%' stop-color='#a6ffcb'/>"

      +

      "</linearGradient>"

      +

      "</defs>"

      +

      "<rect width='100%' height='100%' fill='#e9eef4'/>"

      +

      "<rect x='20' y='20' width='760' height='460' rx='20' fill='url(#g)' opacity='.08'/>"

      +

      "<text x='50%' y='50%' fill='#0f1222' opacity='.65' text-anchor='middle' dominant-baseline='middle' font-family='Poppins' font-size='28'>"

      +

      safeTitle

      +

      "</text>"

      +

      "</svg>"

    )
  }`;

}



/* =========================================================
   FETCH JSON
   ========================================================= */

async function fetchJSON(url) {

  try {

    const response =
      await fetch(
        url,
        {
          cache: "no-store"
        }
      );


    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status}`
      );

    }


    return await response.json();

  }

  catch (error) {

    console.warn(
      `No se pudo cargar ${url}`,
      error
    );


    return null;

  }

}



/* =========================================================
   OBTENER ID DE YOUTUBE

   Soporta:

   youtube.com/watch?v=ID
   youtu.be/ID
   youtube.com/shorts/ID
   youtube.com/embed/ID
   m.youtube.com/watch?v=ID
   ========================================================= */

function getYouTubeID(
  url = ""
) {

  try {

    if (!url) {

      return "";

    }


    const parsedURL =
      new URL(url);


    const hostname =
      parsedURL.hostname
        .replace(
          /^www\./,
          ""
        );


    /*
      youtube.com/watch?v=ID
      m.youtube.com/watch?v=ID
    */

    if (
      (
        hostname === "youtube.com" ||
        hostname === "m.youtube.com"
      )
      &&
      parsedURL.pathname === "/watch"
    ) {

      return (
        parsedURL
          .searchParams
          .get("v")
        ||
        ""
      );

    }


    /*
      youtu.be/ID
    */

    if (
      hostname === "youtu.be"
    ) {

      return (
        parsedURL.pathname
          .replace(
            /^\/+/,
            ""
          )
          .split("/")[0]
        ||
        ""
      );

    }


    /*
      youtube.com/shorts/ID
    */

    if (
      hostname === "youtube.com"
      &&
      parsedURL.pathname.startsWith(
        "/shorts/"
      )
    ) {

      return (
        parsedURL.pathname
          .split("/")[2]
        ||
        ""
      );

    }


    /*
      youtube.com/embed/ID
    */

    if (
      hostname === "youtube.com"
      &&
      parsedURL.pathname.startsWith(
        "/embed/"
      )
    ) {

      return (
        parsedURL.pathname
          .split("/")[2]
        ||
        ""
      );

    }

  }

  catch (error) {

    /*
      No hacemos console.error fuerte aquí
      porque algunos proyectos tendrán
      rutas locales .mp4.
    */

  }


  return "";

}



/* =========================================================
   MINIATURAS DE YOUTUBE
   ========================================================= */

function getYouTubeThumbnail(
  url = ""
) {

  const id =
    getYouTubeID(url);


  if (!id) {

    return "";

  }


  return (
    "https://i.ytimg.com/vi/"
    +
    id
    +
    "/maxresdefault.jpg"
  );

}



function getYouTubeThumbnailFallback(
  url = ""
) {

  const id =
    getYouTubeID(url);


  if (!id) {

    return "";

  }


  return (
    "https://i.ytimg.com/vi/"
    +
    id
    +
    "/hqdefault.jpg"
  );

}



/* =========================================================
   NORMALIZAR PROYECTO
   ========================================================= */

function normalizeItem(
  p = {}
) {

  const video =
    p.video || "";


  const youtubeThumbnail =
    getYouTubeThumbnail(
      video
    );


  const youtubeFallback =
    getYouTubeThumbnailFallback(
      video
    );


  return {

    /*
      Título
    */

    title:
      p.title ||
      "Proyecto",


    /*
      Imagen:

      Prioridad:

      1. cover propio
      2. img propio
      3. miniatura de YouTube
    */

    img:
      p.cover ||
      p.img ||
      youtubeThumbnail ||
      "",


    /*
      Miniatura alternativa
      de YouTube
    */

    youtubeFallback:
      youtubeFallback,


    /*
      Descripción
    */

    desc:
      p.desc ||
      "",


    /*
      Enlace del botón

      Si el proyecto tiene href/url
      usamos eso.

      Si no tiene pero sí tiene video
      podemos usar el video.
    */

    href:
      p.href ||
      p.url ||
      p.video ||
      "#",


    /*
      Categoría

      Tu Edición usa "categoria",
      otros manifests podrían usar
      tag o category.
    */

    tag:
      p.tag ||
      p.categoria ||
      p.category ||
      "",


    /*
      Empresa
    */

    empresa:
      p.empresa ||
      "",


    /*
      Video
    */

    video:
      video,


    /*
      Galería
    */

    gallery:
      Array.isArray(
        p.gallery
      )
        ? p.gallery
        : []

  };

}



/* =========================================================
   BARAJA DETERMINÍSTICA

   Mantiene la misma selección dentro
   de la ventana de tiempo.
   ========================================================= */

function seededShuffle(
  arr,
  seed
) {

  const copy =
    arr.slice();


  let s =
    seed;


  for (
    let i = copy.length - 1;
    i > 0;
    i--
  ) {

    /*
      LCG simple
    */

    s =
      (
        s * 1664525
        +
        1013904223
      )
      %
      4294967296;


    const j =
      s % (i + 1);


    [
      copy[i],
      copy[j]
    ]
    =
    [
      copy[j],
      copy[i]
    ];

  }


  return copy;

}



/* =========================================================
   SELECCIÓN ROTATIVA
   ========================================================= */

function rotatingPick(
  arr,
  count,
  windowMs
) {

  if (
    arr.length <= count
  ) {

    return arr.slice(
      0,
      count
    );

  }


  const bucket =
    Math.floor(
      Date.now()
      /
      windowMs
    );


  const shuffled =
    seededShuffle(
      arr,
      bucket
    );


  return shuffled.slice(
    0,
    count
  );

}



/* =========================================================
   CARGAR UNA CATEGORÍA
   ========================================================= */

async function loadFromCategory(
  dir
) {

  const data =
    await fetchJSON(
      `${dir}/${MANIFEST_NAME}`
    );


  if (
    data &&
    Array.isArray(
      data.projects
    )
  ) {

    return data.projects.map(
      normalizeItem
    );

  }


  return [];

}



/* =========================================================
   CARGAR TODOS LOS PROYECTOS
   ========================================================= */

async function loadAllProjects() {

  const groups =
    await Promise.all(

      CATEGORY_DIRS.map(
        loadFromCategory
      )

    );


  return groups
    .flat()
    .filter(Boolean);

}



/* =========================================================
   RENDER DE TARJETAS
   ========================================================= */

function renderCards(
  items
) {

  if (!GRID) {

    return;

  }


  /*
    Limpiar grid
  */

  GRID.innerHTML =
    "";


  items.forEach(
    project => {


      /* ===============================================
         CARD
         =============================================== */

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "card";



      /* ===============================================
         IMAGEN
         =============================================== */

      const img =
        document.createElement(
          "img"
        );


      img.className =
        "thumb";


      img.src =
        project.img
        ||
        placeholderSVG(
          project.title
        );


      img.alt =
        project.title;


      img.loading =
        "lazy";


      /*
        Fallback:

        maxresdefault
        ->
        hqdefault
        ->
        placeholder
      */

      let fallbackStep =
        0;


      img.onerror =
        () => {


          if (
            fallbackStep === 0 &&
            project.youtubeFallback
          ) {

            fallbackStep =
              1;


            img.src =
              project.youtubeFallback;


            return;

          }


          fallbackStep =
            2;


          img.onerror =
            null;


          img.src =
            placeholderSVG(
              project.title
            );

        };



      /* ===============================================
         CONTENIDO
         =============================================== */

      const content =
        document.createElement(
          "div"
        );


      content.className =
        "content";


      const title =
        escapeHTML(
          project.title
        );


      const description =
        escapeHTML(
          project.desc || ""
        );


      const tag =
        escapeHTML(
          project.tag ||
          "Proyecto"
        );


      const href =
        project.href ||
        "#";


      /*
        Si tenemos un link real
        abrimos nueva pestaña.

        Si es # se queda en la misma.
      */

      const target =
        (
          href &&
          href !== "#"
        )
          ? "_blank"
          : "_self";


      content.innerHTML = `

        <span class="pill">
          ${tag}
        </span>


        <h3>
          ${title}
        </h3>


        <p>
          ${description}
        </p>


        <a
          href="${escapeHTML(href)}"
          target="${target}"
          rel="noopener"
        >
          Ver proyecto →
        </a>

      `;



      /* ===============================================
         AGREGAR A CARD
         =============================================== */

      card.appendChild(
        img
      );


      card.appendChild(
        content
      );


      GRID.appendChild(
        card
      );


    }
  );

}



/* =========================================================
   INICIAR HOME GRID
   ========================================================= */

(async function initHomeGrid() {


  const allProjects =
    await loadAllProjects();


  /*
    Si no hay proyectos
  */

  if (
    !allProjects.length
  ) {

    if (GRID) {

      GRID.innerHTML = `
        <p
          style="
            color:var(--muted);
            text-align:center;
            grid-column:1/-1;
          "
        >
          No hay proyectos disponibles.
        </p>
      `;

    }


    return;

  }


  /*
    Seleccionar los 6 proyectos
    correspondientes a esta hora.
  */

  const selected =
    rotatingPick(
      allProjects,
      HOME_COUNT,
      ROTATE_WINDOW_MS
    );


  renderCards(
    selected
  );


  /*
    OPCIONAL:

    Si quieres que la página se actualice
    automáticamente cuando cambie la hora,
    sin necesidad de recargarla,
    puedes descomentar este bloque.

    No es necesario para que funcione.
  */


  /*
  setInterval(
    () => {

      const currentSelection =
        rotatingPick(
          allProjects,
          HOME_COUNT,
          ROTATE_WINDOW_MS
        );


      renderCards(
        currentSelection
      );

    },
    30 * 1000
  );
  */


})();



/* =========================================================
   MODO CLARO / OSCURO AUTOMÁTICO
   ========================================================= */

(function setThemeByTime() {


  const hour =
    new Date().getHours();


  const isDay =
    hour >= 7 &&
    hour < 19;


  const root =
    document.documentElement;


  if (isDay) {


    root.style.setProperty(
      "--bg",
      "#f5f6fb"
    );


    root.style.setProperty(
      "--card",
      "#ffffff"
    );


    root.style.setProperty(
      "--text",
      "#0f1222"
    );


    root.style.setProperty(
      "--muted",
      "#5a6275"
    );


  }

  else {


    root.style.setProperty(
      "--bg",
      "#0b0e13"
    );


    root.style.setProperty(
      "--card",
      "#11151c"
    );


    root.style.setProperty(
      "--text",
      "#eaf0ff"
    );


    root.style.setProperty(
      "--muted",
      "#b1b8cc"
    );


  }


  const metaTheme =
    document.querySelector(
      'meta[name="theme-color"]'
    );


  if (metaTheme) {

    metaTheme.setAttribute(
      "content",
      isDay
        ? "#f5f6fb"
        : "#0b0e13"
    );

  }


})();
