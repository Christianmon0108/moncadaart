/* =========================================================
   MONCADAART — HOME V2
   PROYECTOS ROTATIVOS

   ✔ Modelado 3D
   ✔ Programación
   ✔ Edición
   ✔ Marca de ropa
   ✔ IA
   ✔ Juegos

   FUNCIONES:
   - Lee los manifest.json de cada categoría
   - Intenta mostrar 1 proyecto por categoría
   - Muestra máximo 6 proyectos
   - Cambia la selección cada hora
   - Actualiza sin necesidad de recargar
   - Genera miniaturas automáticas de YouTube
   - Soporta Shorts, youtu.be y enlaces normales
   - Usa cover cuando no hay video de YouTube
   ========================================================= */


/* =========================================================
   CONFIGURACIÓN DE CATEGORÍAS
   ========================================================= */

const CATEGORY_CONFIG = [

  {
    dir: "Modelado",
    page: "3d.html",
    label: "Modelado 3D"
  },

  {
    dir: "Programacion",
    page: "programacion.html",
    label: "Programación"
  },

  {
    dir: "Edicion",
    page: "edicion.html",
    label: "Edición"
  },

  {
    dir: "Marca",
    page: "marca.html",
    label: "Marca de ropa"
  },

  {
    dir: "IA",
    page: "ia.html",
    label: "IA"
  },

  {
    dir: "Juegos",
    page: "juegos.html",
    label: "Juegos"
  }

];


/* =========================================================
   CONFIGURACIÓN GENERAL
   ========================================================= */

const MANIFEST_NAME = "manifest.json";


/*
  Cada cuánto cambian los proyectos.

  1 hora:
  60 * 60 * 1000

  30 minutos:
  30 * 60 * 1000

  10 minutos:
  10 * 60 * 1000
*/

const ROTATE_WINDOW_MS =
  60 * 60 * 1000;


/* Máximo de proyectos en Inicio */

const HOME_COUNT = 6;


/* Grid del index */

const GRID =
  document.getElementById("project-grid");



/* =========================================================
   ESCAPAR HTML
   Evita problemas con caracteres especiales
   ========================================================= */

function escapeHTML(value = "") {

  return String(value)

    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;")

    .replace(/'/g, "&#039;");
}



/* =========================================================
   PLACEHOLDER
   Si un proyecto no tiene portada
   ========================================================= */

function placeholderSVG(
  title = "Proyecto"
) {

  const safeTitle =
    String(title)

      .replace(/&/g, "&amp;")

      .replace(/</g, "&lt;")

      .replace(/>/g, "&gt;");


  const svg = `

    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="800"
      height="500"
    >

      <defs>

        <linearGradient
          id="gradient"
          x1="0"
          x2="1"
        >

          <stop
            offset="0%"
            stop-color="#ef8b3f"
          />

          <stop
            offset="100%"
            stop-color="#dca04c"
          />

        </linearGradient>

      </defs>


      <rect
        width="100%"
        height="100%"
        fill="#f7eee5"
      />


      <circle
        cx="100"
        cy="80"
        r="160"
        fill="url(#gradient)"
        opacity=".10"
      />


      <circle
        cx="700"
        cy="430"
        r="220"
        fill="url(#gradient)"
        opacity=".08"
      />


      <text
        x="50%"
        y="50%"
        fill="#6a5141"
        text-anchor="middle"
        dominant-baseline="middle"
        font-family="Poppins, Arial"
        font-size="30"
        font-weight="600"
      >

        ${safeTitle}

      </text>

    </svg>

  `;


  return (
    "data:image/svg+xml," +
    encodeURIComponent(svg)
  );
}



/* =========================================================
   FETCH JSON
   ========================================================= */

async function fetchJSON(url) {

  try {

    /*
      Se agrega timestamp para evitar que
      el navegador use una versión vieja
      del manifest.
    */

    const response =
      await fetch(

        `${url}?v=${Date.now()}`,

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


  } catch (error) {

    console.warn(
      `No se pudo cargar ${url}`,
      error
    );


    return null;
  }

}



/* =========================================================
   YOUTUBE
   Obtener ID del video
   ========================================================= */

function getYouTubeID(
  url = ""
) {

  if (!url) {

    return "";

  }


  try {

    const parsed =
      new URL(url);


    const host =
      parsed.hostname

        .replace(
          /^www\./,
          ""
        );


    /* =====================================================
       youtube.com/watch?v=
       ===================================================== */

    if (

      (
        host === "youtube.com" ||
        host === "m.youtube.com"
      )

      &&

      parsed.pathname === "/watch"

    ) {

      return (
        parsed.searchParams.get("v")
        || ""
      );

    }


    /* =====================================================
       youtu.be/ID
       ===================================================== */

    if (
      host === "youtu.be"
    ) {

      return (

        parsed.pathname

          .replace(
            /^\/+/,
            ""
          )

          .split("/")[0]

        || ""

      );

    }


    /* =====================================================
       youtube.com/shorts/ID
       ===================================================== */

    if (

      (
        host === "youtube.com" ||
        host === "m.youtube.com"
      )

      &&

      parsed.pathname.startsWith(
        "/shorts/"
      )

    ) {

      return (

        parsed.pathname

          .split("/")[2]

        || ""

      );

    }


    /* =====================================================
       youtube.com/embed/ID
       ===================================================== */

    if (

      (
        host === "youtube.com" ||
        host === "m.youtube.com"
      )

      &&

      parsed.pathname.startsWith(
        "/embed/"
      )

    ) {

      return (

        parsed.pathname

          .split("/")[2]

        || ""

      );

    }


  } catch (error) {

    /*
      No hacemos nada porque el video
      también podría ser un MP4 local.
    */

  }


  return "";

}



/* =========================================================
   MINIATURA YOUTUBE
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
    `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`
  );

}



/* =========================================================
   MINIATURA FALLBACK YOUTUBE
   ========================================================= */

function getYouTubeThumbnailFallback(
  url = ""
) {

  const id =
    getYouTubeID(url);


  if (!id) {

    return "";

  }


  return (
    `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
  );

}



/* =========================================================
   NORMALIZAR PROYECTO
   ========================================================= */

function normalizeItem(
  project = {},
  config = {}
) {

  const video =
    project.video || "";


  const youtubeID =
    getYouTubeID(video);


  const youtubeThumbnail =
    youtubeID

      ? getYouTubeThumbnail(video)

      : "";


  const youtubeFallback =
    youtubeID

      ? getYouTubeThumbnailFallback(video)

      : "";


  /* =====================================================
     ENLACE DEL PROYECTO
     =====================================================

     Si el manifest tiene href:
     usa ese enlace.

     Si no:
     manda a la página de su categoría.
  */

  const href =

    project.href ||

    project.url ||

    config.page ||

    "#";


  /* =====================================================
     IMAGEN DEL PROYECTO

     Prioridad:

     1. Thumbnail automático YouTube
     2. cover
     3. img
     4. placeholder
     ===================================================== */

  let image = "";


  if (youtubeThumbnail) {

    image =
      youtubeThumbnail;

  } else {

    image =

      project.cover ||

      project.img ||

      "";

  }


  return {

    title:
      project.title ||
      "Proyecto",


    img:
      image,


    desc:
      project.desc ||
      "",


    href:
      href,


    tag:
      project.categoria ||
      project.tag ||
      project.category ||
      config.label ||
      "Proyecto",


    video:
      video,


    youtubeFallback:
      youtubeFallback,


    gallery:

      Array.isArray(
        project.gallery
      )

        ? project.gallery

        : [],


    categoryPage:
      config.page ||
      "#",


    categoryDir:
      config.dir ||
      "",


    categoryLabel:
      config.label ||
      "Proyecto"

  };

}



/* =========================================================
   SHUFFLE DETERMINÍSTICO
   ========================================================= */

function seededShuffle(
  array,
  seed
) {

  const copy =
    array.slice();


  let currentSeed =
    seed >>> 0;


  for (
    let i = copy.length - 1;
    i > 0;
    i--
  ) {

    currentSeed = (

      currentSeed *
      1664525

      +

      1013904223

    ) >>> 0;


    const j =
      currentSeed %
      (i + 1);


    [
      copy[i],
      copy[j]
    ] = [
      copy[j],
      copy[i]
    ];

  }


  return copy;
}



/* =========================================================
   OBTENER VENTANA ACTUAL DE ROTACIÓN
   ========================================================= */

function getRotationBucket() {

  return Math.floor(

    Date.now() /
    ROTATE_WINDOW_MS

  );

}



/* =========================================================
   CARGAR UNA CATEGORÍA
   ========================================================= */

async function loadFromCategory(
  config
) {

  const url =
    `${config.dir}/${MANIFEST_NAME}`;


  const data =
    await fetchJSON(url);


  if (

    !data ||

    !Array.isArray(
      data.projects
    )

  ) {

    return [];
  }


  return data.projects

    .map(

      project =>
        normalizeItem(
          project,
          config
        )

    )

    .filter(Boolean);

}



/* =========================================================
   CARGAR TODAS LAS CATEGORÍAS
   ========================================================= */

async function loadAllCategories() {

  const groups =
    await Promise.all(

      CATEGORY_CONFIG.map(

        async config => {

          const projects =
            await loadFromCategory(
              config
            );


          return {

            config:
              config,

            projects:
              projects

          };

        }

      )

    );


  return groups;
}



/* =========================================================
   SELECCIÓN DE PROYECTOS
   =========================================================

   Intenta mostrar:

   1 Modelado
   1 Programación
   1 Edición
   1 Marca
   1 IA
   1 Juegos

   Si una categoría está vacía,
   rellena con proyectos de las demás.
   ========================================================= */

function selectRotatingProjects(
  categoryGroups
) {

  const bucket =
    getRotationBucket();


  const selected =
    [];


  const selectedKeys =
    new Set();


  /* =====================================================
     PRIMER PASO
     Elegir uno de cada categoría
     ===================================================== */

  categoryGroups.forEach(
    (
      group,
      categoryIndex
    ) => {


      if (
        !group.projects.length
      ) {

        return;
      }


      /*
        Cada categoría utiliza una semilla
        ligeramente distinta para evitar
        seleccionar siempre el primer proyecto.
      */

      const categorySeed =

        bucket +

        (
          categoryIndex *
          104729
        );


      const shuffled =
        seededShuffle(

          group.projects,

          categorySeed

        );


      const project =
        shuffled[0];


      if (!project) {

        return;
      }


      selected.push(
        project
      );


      selectedKeys.add(
        getProjectKey(
          project
        )
      );

    }

  );


  /* =====================================================
     SEGUNDO PASO

     Si alguna categoría está vacía y tenemos
     menos de 6 proyectos, rellenamos los huecos.
     ===================================================== */

  if (
    selected.length <
    HOME_COUNT
  ) {

    const allProjects =
      categoryGroups

        .flatMap(
          group =>
            group.projects
        );


    const remaining =
      allProjects.filter(

        project =>

          !selectedKeys.has(

            getProjectKey(
              project
            )

          )

      );


    const shuffledRemaining =
      seededShuffle(

        remaining,

        bucket + 99991

      );


    for (
      const project
      of shuffledRemaining
    ) {

      if (
        selected.length >=
        HOME_COUNT
      ) {

        break;
      }


      selected.push(
        project
      );


      selectedKeys.add(

        getProjectKey(
          project
        )

      );

    }

  }


  /* =====================================================
     TERCER PASO

     Mezclamos los 6 para que no aparezcan
     siempre en el mismo orden.
     ===================================================== */

  return seededShuffle(

    selected,

    bucket + 3571

  ).slice(
    0,
    HOME_COUNT
  );

}



/* =========================================================
   CLAVE ÚNICA DE PROYECTO
   ========================================================= */

function getProjectKey(
  project
) {

  return [

    project.categoryDir,

    project.title,

    project.href

  ].join(
    "::"
  );

}



/* =========================================================
   MOSTRAR ESTADO DE CARGA
   ========================================================= */

function showLoading() {

  if (!GRID) {

    return;
  }


  GRID.innerHTML = `

    <div
      class="projects-loading"
      style="
        grid-column:1/-1;
        text-align:center;
        padding:30px 15px;
        color:var(--text-soft, var(--muted));
      "
    >

      Cargando proyectos...

    </div>

  `;

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


  GRID.innerHTML =
    "";


  /* =====================================================
     SIN PROYECTOS
     ===================================================== */

  if (!items.length) {

    GRID.innerHTML = `

      <p
        style="
          grid-column:1/-1;
          text-align:center;
          color:var(--text-soft, var(--muted));
          padding:30px 10px;
        "
      >

        Todavía no hay proyectos disponibles.

      </p>

    `;


    return;
  }



  /* =====================================================
     CREAR CADA CARD
     ===================================================== */

  items.forEach(
    project => {


      /* ===================================================
         ARTICLE
         =================================================== */

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "card";


      /* ===================================================
         IMAGEN
         =================================================== */

      const img =
        document.createElement(
          "img"
        );


      img.className =
        "thumb";


      img.src =

        project.img ||

        placeholderSVG(
          project.title
        );


      img.alt =
        `Proyecto ${project.title}`;


      img.loading =
        "lazy";


      img.decoding =
        "async";


      /*
        YouTube intenta:

        maxresdefault
        ↓
        hqdefault
        ↓
        placeholder
      */

      let fallbackStep =
        0;


      img.onerror =
        function () {


          if (

            fallbackStep === 0

            &&

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



      /* ===================================================
         CONTENIDO
         =================================================== */

      const content =
        document.createElement(
          "div"
        );


      content.className =
        "content";


      const safeTitle =
        escapeHTML(
          project.title
        );


      const safeDescription =
        escapeHTML(
          project.desc
        );


      const safeTag =
        escapeHTML(
          project.tag
        );


      const safeHref =
        escapeHTML(

          project.href ||

          project.categoryPage ||

          "#"

        );


      content.innerHTML = `

        <span class="pill">
          ${safeTag}
        </span>


        <h3>
          ${safeTitle}
        </h3>


        ${
          safeDescription

            ? `
              <p>
                ${safeDescription}
              </p>
            `

            : ""
        }


        <a
          href="${safeHref}"
          class="project-link"
          aria-label="Ver proyecto ${safeTitle}"
        >

          Ver proyecto →

        </a>

      `;



      /* ===================================================
         HACER IMAGEN CLICKEABLE
         =================================================== */

      img.style.cursor =
        "pointer";


      img.addEventListener(
        "click",
        () => {

          const href =

            project.href ||

            project.categoryPage;


          if (

            href &&
            href !== "#"

          ) {

            window.location.href =
              href;

          }

        }
      );



      /* ===================================================
         AÑADIR CARD
         =================================================== */

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
   ESTADO GENERAL
   ========================================================= */

let loadedCategories =
  [];


let lastRenderedBucket =
  null;



/* =========================================================
   RENDER ROTACIÓN ACTUAL
   ========================================================= */

function renderCurrentRotation() {

  if (
    !loadedCategories.length
  ) {

    return;
  }


  const bucket =
    getRotationBucket();


  /*
    Si seguimos dentro de la misma ventana
    de tiempo no hace falta volver a renderizar.
  */

  if (
    bucket ===
    lastRenderedBucket
  ) {

    return;
  }


  const selectedProjects =
    selectRotatingProjects(
      loadedCategories
    );


  renderCards(
    selectedProjects
  );


  lastRenderedBucket =
    bucket;


  console.log(
    "MoncadaArt — proyectos actuales:",
    selectedProjects
  );

}



/* =========================================================
   INICIO
   ========================================================= */

async function initProjects() {

  if (!GRID) {

    return;
  }


  showLoading();


  loadedCategories =
    await loadAllCategories();


  const totalProjects =
    loadedCategories.reduce(

      (
        total,
        group
      ) =>

        total +
        group.projects.length,

      0

    );


  console.log(
    `MoncadaArt — ${totalProjects} proyectos cargados.`
  );


  /*
    Mostrar información de cada categoría
    en consola para detectar rápido si algún
    manifest no está funcionando.
  */

  loadedCategories.forEach(
    group => {

      console.log(

        `${group.config.label}:`,

        group.projects.length

      );

    }
  );


  if (
    totalProjects === 0
  ) {

    renderCards(
      []
    );


    return;
  }


  /*
    Primera carga
  */

  lastRenderedBucket =
    null;


  renderCurrentRotation();


  /*
    Revisamos cada minuto.

    Los proyectos únicamente cambian cuando
    empieza una nueva ventana de rotación.

    Con ROTATE_WINDOW_MS = 1 hora,
    cambiarán automáticamente cada hora
    aunque la página siga abierta.
  */

  setInterval(
    renderCurrentRotation,
    60 * 1000
  );

}



/* =========================================================
   EJECUTAR
   ========================================================= */

initProjects();
