/* =========================================================
   MoncadaArt — HOME
   6 proyectos rotativos

   - Lee manifests de todas las categorías
   - Muestra 6 proyectos por hora
   - Miniaturas automáticas de YouTube
   - Soporta YouTube Shorts
   - El botón "Ver proyecto" siempre funciona
   ========================================================= */


/* =========================================================
   CONFIGURACIÓN
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
    dir: "Musica",
    page: "musica.html",
    label: "Música"
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

const MANIFEST_NAME = "manifest.json";

/* Cambiar selección cada hora */
const ROTATE_WINDOW_MS =
  60 * 60 * 1000;

/* Número de proyectos en Inicio */
const HOME_COUNT = 6;

const GRID =
  document.getElementById("project-grid");


/* =========================================================
   PLACEHOLDER
   ========================================================= */

function placeholderSVG(title = "Proyecto") {

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
        <linearGradient id="g" x1="0" x2="1">
          <stop offset="0%" stop-color="#1fa2ff"/>
          <stop offset="50%" stop-color="#12d8fa"/>
          <stop offset="100%" stop-color="#a6ffcb"/>
        </linearGradient>
      </defs>

      <rect
        width="100%"
        height="100%"
        fill="#e9eef4"
      />

      <rect
        x="20"
        y="20"
        width="760"
        height="460"
        rx="20"
        fill="url(#g)"
        opacity=".08"
      />

      <text
        x="50%"
        y="50%"
        fill="#0f1222"
        opacity=".65"
        text-anchor="middle"
        dominant-baseline="middle"
        font-family="Poppins"
        font-size="28"
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
   ESCAPAR HTML
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
   FETCH JSON
   ========================================================= */

async function fetchJSON(url) {

  try {

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
      "No se pudo cargar:",
      url,
      error
    );

    return null;
  }
}


/* =========================================================
   YOUTUBE
   ========================================================= */

function getYouTubeID(url = "") {

  try {

    if (!url) {
      return "";
    }

    const parsed =
      new URL(url);

    const host =
      parsed.hostname
        .replace(/^www\./, "");


    /* YouTube normal */

    if (
      (
        host === "youtube.com" ||
        host === "m.youtube.com"
      ) &&
      parsed.pathname === "/watch"
    ) {

      return (
        parsed.searchParams.get("v")
        || ""
      );
    }


    /* youtu.be */

    if (
      host === "youtu.be"
    ) {

      return (
        parsed.pathname
          .replace(/^\/+/, "")
          .split("/")[0]
        || ""
      );
    }


    /* Shorts */

    if (
      host === "youtube.com" &&
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


    /* Embed */

    if (
      host === "youtube.com" &&
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
      No hacemos error porque
      también existen videos locales.
    */

  }

  return "";
}


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


  /*
    IMPORTANTE:

    En Inicio, "Ver proyecto"
    manda a la página de la categoría.

    Modelado -> 3d.html
    Edición  -> edicion.html
    etc.

    Si posteriormente agregas un href
    específico al manifest, tendrá prioridad.
  */

  const href =
    project.href ||
    project.url ||
    config.page ||
    "#";


  /*
    IMAGEN

    Para proyectos YouTube damos prioridad
    a la miniatura automática.

    Para proyectos normales usamos cover.
  */

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

    empresa:
      project.empresa ||
      "",

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
      ""

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

  let s =
    seed;


  for (
    let i = copy.length - 1;
    i > 0;
    i--
  ) {

    s =
      (
        s * 1664525 +
        1013904223
      )
      %
      4294967296;


    const j =
      s % (i + 1);


    [
      copy[i],
      copy[j]
    ] =
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
  array,
  count,
  windowMs
) {

  if (
    array.length <= count
  ) {

    return array.slice(
      0,
      count
    );
  }


  const bucket =
    Math.floor(
      Date.now() /
      windowMs
    );


  const shuffled =
    seededShuffle(
      array,
      bucket
    );


  return shuffled.slice(
    0,
    count
  );
}


/* =========================================================
   CARGAR CATEGORÍA
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


  return data.projects.map(
    project =>
      normalizeItem(
        project,
        config
      )
  );
}


/* =========================================================
   CARGAR TODOS
   ========================================================= */

async function loadAllProjects() {

  const groups =
    await Promise.all(

      CATEGORY_CONFIG.map(
        loadFromCategory
      )

    );


  return groups
    .flat()
    .filter(Boolean);
}


/* =========================================================
   RENDER
   ========================================================= */

function renderCards(items) {

  if (!GRID) {
    return;
  }


  GRID.innerHTML = "";


  items.forEach(
    project => {


      /* =============================
         CARD
         ============================= */

      const card =
        document.createElement(
          "article"
        );

      card.className =
        "card";


      /* =============================
         PORTADA
         ============================= */

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
        project.title;

      img.loading =
        "lazy";


      /*
        Miniatura YouTube:

        maxresdefault
        ↓
        hqdefault
        ↓
        placeholder
      */

      let imageFallbackStep =
        0;


      img.onerror = () => {

        if (
          imageFallbackStep === 0 &&
          project.youtubeFallback
        ) {

          imageFallbackStep =
            1;

          img.src =
            project.youtubeFallback;

          return;
        }


        imageFallbackStep =
          2;

        img.onerror =
          null;

        img.src =
          placeholderSVG(
            project.title
          );
      };


      /* =============================
         CONTENIDO
         ============================= */

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
          project.desc
        );

      const tag =
        escapeHTML(
          project.tag
        );

      const href =
        project.href ||
        project.categoryPage ||
        "#";


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
          class="project-link"
        >
          Ver proyecto →
        </a>
      `;


      /* =============================
         AÑADIR
         ============================= */

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
   INICIAR
   ========================================================= */

(async function initHomeGrid() {

  const allProjects =
    await loadAllProjects();


  console.log(
    "Todos los proyectos:",
    allProjects
  );


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


  const selected =
    rotatingPick(
      allProjects,
      HOME_COUNT,
      ROTATE_WINDOW_MS
    );


  console.log(
    "Proyectos del inicio:",
    selected
  );


  renderCards(
    selected
  );

})();


/* =========================================================
   TEMA CLARO / OSCURO
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

  } else {

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
