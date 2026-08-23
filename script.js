/* =========================================================
   MONCADAART
   PROYECTOS ROTATIVOS
   ========================================================= */


const CATEGORY_CONFIG = [

  {
    dir:"Modelado",
    page:"3d.html",
    label:"Modelado 3D"
  },

  {
    dir:"Programacion",
    page:"programacion.html",
    label:"Programación"
  },

  {
    dir:"Edicion",
    page:"edicion.html",
    label:"Edición"
  },

  {
    dir:"Marca",
    page:"marca.html",
    label:"Marca de ropa"
  },

  {
    dir:"IA",
    page:"ia.html",
    label:"IA"
  },

  {
    dir:"Juegos",
    page:"juegos.html",
    label:"Juegos"
  }

];


const MANIFEST_NAME =
  "manifest.json";


const ROTATE_WINDOW_MS =
  60 * 60 * 1000;


const HOME_COUNT =
  6;


const GRID =
  document.getElementById(
    "project-grid"
  );



/* =========================================================
   ESCAPAR HTML
   ========================================================= */

function escapeHTML(
  value = ""
){

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
   PLACEHOLDER
   ========================================================= */

function placeholderSVG(
  title = "Proyecto"
){

  const safeTitle =
    escapeHTML(title);


  const svg = `

    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="800"
      height="500"
    >

      <rect
        width="100%"
        height="100%"
        fill="#ebe4dc"
      />


      <text
        x="50%"
        y="50%"
        text-anchor="middle"
        dominant-baseline="middle"
        fill="#6b5d53"
        font-family="Arial"
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
   FETCH
   ========================================================= */

async function fetchJSON(
  url
){

  try{


    const response =
      await fetch(

        `${url}?v=${Date.now()}`,

        {
          cache:"no-store"
        }

      );


    if(!response.ok){

      throw new Error(
        `HTTP ${response.status}`
      );

    }


    return await response.json();


  }

  catch(error){


    console.warn(
      "No se pudo cargar:",
      url
    );


    return null;

  }

}



/* =========================================================
   YOUTUBE ID
   ========================================================= */

function getYouTubeID(
  url = ""
){

  if(!url){

    return "";

  }


  try{


    const parsed =
      new URL(url);


    const host =
      parsed.hostname
        .replace(
          /^www\./,
          ""
        );


    if(

      (
        host === "youtube.com" ||
        host === "m.youtube.com"
      )

      &&

      parsed.pathname === "/watch"

    ){

      return (
        parsed.searchParams.get("v")
        || ""
      );

    }


    if(
      host === "youtu.be"
    ){

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


    if(
      parsed.pathname.startsWith(
        "/shorts/"
      )
    ){

      return (
        parsed.pathname
          .split("/")[2]
        || ""
      );

    }


    if(
      parsed.pathname.startsWith(
        "/embed/"
      )
    ){

      return (
        parsed.pathname
          .split("/")[2]
        || ""
      );

    }


  }

  catch(error){

    return "";

  }


  return "";

}



/* =========================================================
   MINIATURAS YOUTUBE
   ========================================================= */

function getYouTubeThumbnail(
  url
){

  const id =
    getYouTubeID(url);


  return id

    ? `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`

    : "";

}



function getYouTubeFallback(
  url
){

  const id =
    getYouTubeID(url);


  return id

    ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`

    : "";

}



/* =========================================================
   NORMALIZAR
   ========================================================= */

function normalizeItem(
  project,
  config
){

  const video =
    project.video || "";


  const youtubeThumbnail =
    getYouTubeThumbnail(
      video
    );


  let image = "";


  if(youtubeThumbnail){

    image =
      youtubeThumbnail;

  }

  else{

    image =
      project.cover ||
      project.img ||
      "";

  }


  return{

    title:
      project.title ||
      "Proyecto",

    img:
      image,

    desc:
      project.desc ||
      "",

    href:
      project.href ||
      project.url ||
      config.page ||
      "#",

    tag:
      project.categoria ||
      project.tag ||
      project.category ||
      config.label,

    youtubeFallback:
      getYouTubeFallback(
        video
      ),

    categoryDir:
      config.dir,

    categoryPage:
      config.page,

    categoryLabel:
      config.label

  };

}



/* =========================================================
   SHUFFLE DETERMINÍSTICO
   ========================================================= */

function seededShuffle(
  array,
  seed
){

  const copy =
    array.slice();


  let currentSeed =
    seed >>> 0;


  for(
    let i =
      copy.length - 1;

    i > 0;

    i--
  ){

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
   ROTACIÓN
   ========================================================= */

function getRotationBucket(){

  return Math.floor(

    Date.now() /
    ROTATE_WINDOW_MS

  );

}



/* =========================================================
   CARGAR CATEGORÍA
   ========================================================= */

async function loadCategory(
  config
){

  const data =
    await fetchJSON(

      `${config.dir}/${MANIFEST_NAME}`

    );


  if(

    !data ||

    !Array.isArray(
      data.projects
    )

  ){

    return{

      config,
      projects:[]

    };

  }


  return{

    config,

    projects:
      data.projects.map(

        project =>
          normalizeItem(
            project,
            config
          )

      )

  };

}



/* =========================================================
   CARGAR TODO
   ========================================================= */

async function loadAll(){

  return await Promise.all(

    CATEGORY_CONFIG.map(
      loadCategory
    )

  );

}



/* =========================================================
   ID PROYECTO
   ========================================================= */

function projectKey(
  project
){

  return [

    project.categoryDir,

    project.title,

    project.href

  ].join("::");

}



/* =========================================================
   SELECCIONAR PROYECTOS
   ========================================================= */

function selectProjects(
  groups
){

  const bucket =
    getRotationBucket();


  const selected =
    [];


  const used =
    new Set();



  /*
    Intentar elegir
    uno de cada categoría
  */

  groups.forEach(
    (
      group,
      index
    ) => {


      if(
        !group.projects.length
      ){

        return;

      }


      const shuffled =
        seededShuffle(

          group.projects,

          bucket +
          index * 104729

        );


      const project =
        shuffled[0];


      selected.push(
        project
      );


      used.add(
        projectKey(
          project
        )
      );


    }
  );



  /*
    Si alguna categoría
    está vacía,
    completar hasta 6
  */

  if(
    selected.length <
    HOME_COUNT
  ){


    const remaining =
      groups

        .flatMap(
          group =>
            group.projects
        )

        .filter(

          project =>

            !used.has(
              projectKey(
                project
              )
            )

        );


    const shuffled =
      seededShuffle(

        remaining,

        bucket +
        99991

      );


    for(
      const project
      of shuffled
    ){


      if(
        selected.length >=
        HOME_COUNT
      ){

        break;

      }


      selected.push(
        project
      );


    }

  }



  /*
    Mezclar posición
  */

  return seededShuffle(

    selected,

    bucket +
    3571

  ).slice(
    0,
    HOME_COUNT
  );

}



/* =========================================================
   RENDER
   ========================================================= */

function renderCards(
  projects
){

  if(!GRID){

    return;

  }


  GRID.innerHTML =
    "";


  if(!projects.length){

    GRID.innerHTML = `

      <p
        style="
          grid-column:1/-1;
          text-align:center;
          opacity:.7;
        "
      >

        No hay proyectos disponibles.

      </p>

    `;


    return;

  }



  projects.forEach(
    project => {


      const card =
        document.createElement(
          "article"
        );


      card.className =
        "card";



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


      img.decoding =
        "async";



      let fallback =
        false;


      img.onerror = () => {


        if(

          !fallback &&

          project.youtubeFallback

        ){

          fallback =
            true;


          img.src =
            project.youtubeFallback;


          return;

        }


        img.onerror =
          null;


        img.src =
          placeholderSVG(
            project.title
          );


      };



      const content =
        document.createElement(
          "div"
        );


      content.className =
        "content";



      content.innerHTML = `

        <span class="pill">

          ${escapeHTML(
            project.tag
          )}

        </span>


        <h3>

          ${escapeHTML(
            project.title
          )}

        </h3>


        <p>

          ${escapeHTML(
            project.desc
          )}

        </p>


        <a
          href="${escapeHTML(
            project.href
          )}"
        >

          Ver proyecto →

        </a>

      `;



      img.style.cursor =
        "pointer";


      img.addEventListener(
        "click",
        () => {


          if(

            project.href &&

            project.href !== "#"

          ){

            window.location.href =
              project.href;

          }


        }
      );



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
   INICIO
   ========================================================= */

let loadedGroups =
  [];


let lastBucket =
  null;



function renderCurrent(){

  const current =
    getRotationBucket();


  if(
    current ===
    lastBucket
  ){

    return;

  }


  renderCards(

    selectProjects(
      loadedGroups
    )

  );


  lastBucket =
    current;

}



async function init(){

  if(!GRID){

    return;

  }


  GRID.innerHTML = `

    <p
      style="
        grid-column:1/-1;
        text-align:center;
        opacity:.6;
      "
    >

      Cargando proyectos...

    </p>

  `;


  loadedGroups =
    await loadAll();


  lastBucket =
    null;


  renderCurrent();


  setInterval(
    renderCurrent,
    60 * 1000
  );

}



init();
