/* =========================================================
   MoncadaArt — Home grid rotativo (6 proyectos)
   Lee manifests por categoría y cambia la selección cada X tiempo
   ========================================================= */

// --------- Ajustes ----------
const CATEGORY_DIRS = ["Modelado","Programacion","Edicion","Musica","IA","Juegos"];
const MANIFEST_NAME = "manifest.json";

// ¿cada cuánto cambia la selección?
// 1 hora: 60*60*1000 — 5 minutos: 5*60*1000 — 30 minutos: 30*60*1000
const ROTATE_WINDOW_MS = 60 * 60 * 1000;

const HOME_COUNT = 6;          // cuántos proyectos mostrar
const GRID = document.getElementById("project-grid");

// --------- Utilidades ----------
function placeholderSVG(title="Proyecto"){
  return `data:image/svg+xml,${encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500'>"
    +"<defs><linearGradient id='g' x1='0' x2='1'><stop offset='0%' stop-color='#1fa2ff'/>"
    +"<stop offset='50%' stop-color='#12d8fa'/><stop offset='100%' stop-color='#a6ffcb'/></linearGradient></defs>"
    +"<rect width='100%' height='100%' fill='#e9eef4'/>"
    +"<rect x='20' y='20' width='760' height='460' rx='20' fill='url(#g)' opacity='.08'/>"
    +"<text x='50%' y='50%' fill='#0f1222' opacity='.65' text-anchor='middle' dominant-baseline='middle' "
    +"font-family='Poppins' font-size='28'>"+ title.replace(/&/g,"&amp;") +"</text></svg>"
  )}`;
}

async function fetchJSON(url){
  try{
    const r = await fetch(url, { cache: "no-store" });
    if(!r.ok) throw 0;
    return await r.json();
  }catch(_){
    return null;
  }
}

function normalizeItem(p={}){
  return {
    title: p.title || "Proyecto",
    img:   p.cover || p.img || "",
    desc:  p.desc  || "",
    href:  p.href  || (p.url || "#"),
    tag:   p.tag   || p.category || "",
    gallery: Array.isArray(p.gallery) ? p.gallery : []
  };
}

// baraja determinística (mismo orden dentro de una ventana de tiempo)
function seededShuffle(arr, seed){
  const a = arr.slice();
  let s = seed;
  for(let i=a.length-1;i>0;i--){
    // LCG simple
    s = (s * 1664525 + 1013904223) % 4294967296;
    const j = s % (i+1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// elige N elementos cambiando cada "windowMs"
function rotatingPick(arr, count, windowMs){
  if(arr.length <= count) return arr.slice(0, count);
  const bucket = Math.floor(Date.now() / windowMs);
  const shuffled = seededShuffle(arr, bucket);
  return shuffled.slice(0, count);
}

// --------- Carga de catálogos ----------
async function loadFromCategory(dir){
  // intenta manifest.json (mismo esquema que usas en 3D y Programación)
  const data = await fetchJSON(`${dir}/${MANIFEST_NAME}`);
  if (data && Array.isArray(data.projects)) {
    return data.projects.map(normalizeItem);
  }

  
  
}

async function loadAllProjects(){
  const groups = await Promise.all(CATEGORY_DIRS.map(loadFromCategory));
  // aplana y filtra vacíos
  return groups.flat().filter(Boolean);
}

// --------- Render ----------
function renderCards(items){
  if(!GRID) return;
  GRID.innerHTML = ""; // limpia

  items.forEach(p=>{
    const card = document.createElement("article");
    card.className = "card";

    const img = document.createElement("img");
    img.className = "thumb";
    img.src = p.img || placeholderSVG(p.title);
    img.alt = p.title;
    img.loading = "lazy";
    img.onerror = () => { img.src = placeholderSVG(p.title); };

    const content = document.createElement("div");
    content.className = "content";
    content.innerHTML = `
      <span class="pill">${p.tag || "Proyecto"}</span>
      <h3>${p.title}</h3>
      <p>${p.desc || ""}</p>
      <a href="${p.href || '#'}" target="${p.href && p.href!=='#' ? '_blank' : '_self'}" rel="noopener">Ver proyecto →</a>
    `;

    card.appendChild(img);
    card.appendChild(content);
    GRID.appendChild(card);
  });
}

// --------- Inicio ----------
(async function initHomeGrid(){
  const all = await loadAllProjects();

  // elige 6 que rotan en el tiempo configurado
  const pick = rotatingPick(all, HOME_COUNT, ROTATE_WINDOW_MS);
  renderCards(pick);

  // --- Si quieres que además cambie en vivo sin recargar:
  // setInterval(() => {
  //   const pickNow = rotatingPick(all, HOME_COUNT, ROTATE_WINDOW_MS);
  //   renderCards(pickNow);
  // }, 30 * 1000); // re-evalúa cada 30s (opcional)
})();


// =========================================================
//   (OPCIONAL) Modo claro/oscuro por hora en todas las páginas
//   Si ya lo añadiste en index, puedes ignorarlo aquí.
// =========================================================
(function setThemeByTime(){
  const hour = new Date().getHours();
  const isDay = hour >= 7 && hour < 19;
  const root = document.documentElement;
  if (isDay){
    root.style.setProperty('--bg', '#f5f6fb');
    root.style.setProperty('--card', '#ffffff');
    root.style.setProperty('--text', '#0f1222');
    root.style.setProperty('--muted', '#5a6275');
  } else {
    root.style.setProperty('--bg', '#0b0e13');
    root.style.setProperty('--card', '#11151c');
    root.style.setProperty('--text', '#eaf0ff');
    root.style.setProperty('--muted', '#b1b8cc');
  }
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.setAttribute('content', isDay ? '#f5f6fb' : '#0b0e13');
})();
