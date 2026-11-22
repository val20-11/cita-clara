/* =========================================================
   app.js — Lógica de Cita Clara (JavaScript puro)
   ---------------------------------------------------------
   Es una página de "una sola página": según lo que diga la
   dirección después del # (por ejemplo #/tramite/efirma),
   la función router() decide qué pantalla dibujar en <main>.
   ========================================================= */

/* ---------- 1. Iconos (SVG de línea, sin emojis) ---------- */
const ICONOS = {
  buscar: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  flecha: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  externo: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  ubicacion: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  alerta: '<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  escudo: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
  edificio: '<rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
  volumen: '<path d="M11 5 6 9H2v6h4l5 4Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/>',
  abajo: '<path d="m6 9 6 6 6-6"/>',
  lista: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="m3 6 1 1 2-2M3 12l1 1 2-2M3 18l1 1 2-2"/>',
  nube: '<path d="M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 1 1 0 9Z"/>',
  calendario: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  usuarios: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
  pasos: '<path d="M4 6h16M4 12h10M4 18h6"/><circle cx="19" cy="16" r="2.5"/>',
  megafono: '<path d="m3 11 15-6v14L3 13v-2Z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  documento: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
};

// Devuelve el código SVG de un icono por su nombre.
function icono(nombre, clase = "") {
  return `<svg class="icono ${clase}" viewBox="0 0 24 24" aria-hidden="true">${ICONOS[nombre]}</svg>`;
}

/* ---------- 2. Utilidades ---------- */

// Evita que un texto se interprete como HTML (seguridad básica).
function escapar(texto) {
  return String(texto ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Quita acentos y pasa a minúsculas para comparar búsquedas ("Fírma" = "firma").
function normalizar(texto) {
  return texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

// Mensaje corto abajo de la pantalla.
let temporizadorToast;
function mostrarToast(mensaje) {
  const toast = document.getElementById("toast");
  toast.textContent = mensaje;
  toast.classList.add("visible");
  clearTimeout(temporizadorToast);
  temporizadorToast = setTimeout(() => toast.classList.remove("visible"), 5000);
}

// Lee y guarda en el navegador. Si el navegador lo bloquea, la página sigue funcionando.
function leerGuardado(clave, porDefecto) {
  try { return JSON.parse(localStorage.getItem(clave)) ?? porDefecto; } catch { return porDefecto; }
}
function guardar(clave, valor) {
  try { localStorage.setItem(clave, JSON.stringify(valor)); } catch { /* sin almacenamiento */ }
}

// "2026-11-04" -> "4 de noviembre de 2026"
function formatearFecha(iso) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
}

// Distancia en km entre dos coordenadas (fórmula de Haversine).
function distanciaKm(a, b) {
  const rad = (g) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/* ---------- 3. Textos reutilizables ---------- */

const NOMBRES_FUENTE = {
  "oficial-gratuito": "Oficial gratuito",
  "oficial-costo": "Oficial con costo",
  "no-oficial": "No oficial / intermediario",
};
const NOMBRES_SEMAFORO = { libre: "Poca espera", medio: "Espera media", saturado: "Mucha espera" };

const etiquetaFuente = (tipo) => `<span class="etiqueta ${tipo}">${NOMBRES_FUENTE[tipo]}</span>`;
const textoModalidad = (tipo) => (tipo === "linea" ? "En línea" : "Presencial");

// Nota discreta cuando los cálculos incluyen datos de prueba.
const notaPrueba = (hay) => (hay ? '<p class="nota-prueba">Incluye datos de prueba.</p>' : "");

// Enlace a Google Maps con la dirección de la sede (no requiere clave).
const enlaceGoogleMaps = (s) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.nombre}, ${s.direccion}`)}`;

/* Ubicación de la persona (opcional). Solo se usa en el navegador para
   calcular distancias; no se envía ni se guarda en ningún servidor. */
let miUbicacion = (() => { try { return JSON.parse(sessionStorage.getItem("mi-ubicacion")); } catch { return null; } })();

function pedirUbicacion(alTerminar) {
  if (!("geolocation" in navigator)) return mostrarToast("Tu navegador no permite obtener la ubicación.");
  mostrarToast("Buscando tu ubicación…");
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      miUbicacion = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      try { sessionStorage.setItem("mi-ubicacion", JSON.stringify(miUbicacion)); } catch { /* sin almacenamiento */ }
      mostrarToast("Listo. Ordenamos las sedes de la más cercana a la más lejana.");
      alTerminar();
    },
    () => mostrarToast("No pudimos obtener tu ubicación. Revisa los permisos del navegador."),
    { timeout: 10000, maximumAge: 300000 },
  );
}

/* ---------- 3b. Cálculos con los reportes de Firestore ---------- */

// "nube" es el módulo nube.js (Firestore + Gemini). Se carga al final de este archivo.
let nube = null;

const MIN_REPORTES = 3;        // con menos reportes no se muestra estimación
const DIAS_RECIENTES = 90;     // solo cuentan los reportes de los últimos 90 días
const NOMBRES_DIA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

const esReciente = (r) => (Date.now() - r.creado.getTime()) / 86400000 <= DIAS_RECIENTES;
const promedio = (lista) => lista.reduce((s, r) => s + r.minutos, 0) / lista.length;
const franja = (hora) => (hora < 12 ? "por la mañana" : "por la tarde");

// Etapa 1 del modelo (la que propone el proyecto mientras hay pocos datos):
// promedio de espera por sede y la combinación día + franja con menos espera.
function resumirSede(reportes) {
  const recientes = reportes.filter(esReciente);
  if (recientes.length < MIN_REPORTES) return { total: recientes.length, estado: null };

  const espera = Math.round(promedio(recientes));
  const estado = espera < 45 ? "libre" : espera < 70 ? "medio" : "saturado";

  // Agrupa por día y franja; solo se consideran grupos con al menos 2 reportes.
  const grupos = {};
  recientes.forEach((r) => { (grupos[`${r.dia}|${franja(r.hora)}`] ||= []).push(r); });
  const mejor = Object.entries(grupos)
    .filter(([, lista]) => lista.length >= 2)
    .map(([clave, lista]) => ({ clave, espera: promedio(lista) }))
    .sort((a, b) => a.espera - b.espera)[0];

  return {
    total: recientes.length,
    estado,
    espera,
    mejor: mejor ? (([d, f]) => `${NOMBRES_DIA[d]} ${f}`)(mejor.clave.split("|")) : null,
    demo: recientes.some((r) => r.demo),
  };
}

// Mensaje general del trámite: el día y franja con menos espera considerando todas sus sedes.
function consejoDe(reportes) {
  const recientes = reportes.filter(esReciente);
  if (recientes.length < MIN_REPORTES * 2) return null;
  const r = resumirSede(recientes);
  return r.mejor ? `Según ${recientes.length} reportes, los ${r.mejor.replace(/^\S+/, (dia) => (dia.endsWith("s") ? dia : dia + "s"))} suelen tener menos espera.` : null;
}

/* ---------- 4. INICIO ---------- */

let filtroTipo = "todos"; // "todos", "presencial" o "linea"

function buscarTramites(texto, tipo) {
  const busqueda = normalizar(texto);
  return TRAMITES.filter((t) => {
    const coincideTipo = tipo === "todos" || t.tipo === tipo;
    const enTexto = normalizar([t.nombre, t.institucion, t.institucionNombre, ...t.claves].join(" "));
    return coincideTipo && (busqueda === "" || enTexto.includes(busqueda));
  });
}

function dibujarLista(texto) {
  const resultados = buscarTramites(texto, filtroTipo);
  const lista = document.getElementById("lista-tramites");
  if (resultados.length === 0) {
    lista.innerHTML = `<li class="sin-resultados">No encontramos «${escapar(texto)}» en nuestros trámites. Prueba con «RFC», «pasaporte» o «INE».</li>`;
    return;
  }
  lista.innerHTML = resultados.map((t) => `
    <li class="fila-tramite">
      <a href="#/tramite/${t.id}">
        <span class="sigla" aria-hidden="true">${escapar(t.institucion === "Registro Civil" ? "RC" : t.institucion)}</span>
        <span>
          <span class="fila-nombre">${escapar(t.nombre)}</span>
          <span class="fila-meta">
            <span>${escapar(t.institucionNombre)}</span>
            <span>${icono(t.tipo === "linea" ? "monitor" : "ubicacion")} ${textoModalidad(t.tipo)}</span>
            ${etiquetaFuente(t.fuente.tipo)}
          </span>
        </span>
        ${icono("flecha", "flecha")}
      </a>
    </li>`).join("");
}

function pantallaInicio() {
  const cuenta = (tipo) => TRAMITES.filter((t) => tipo === "todos" || t.tipo === tipo).length;
  document.getElementById("app").innerHTML = `
    <section class="portada">
      <div class="contenedor portada-int">
        <div>
          <h1>Tu trámite, explicado con claridad</h1>
          <p class="entrada">Qué documentos llevar, qué pasos seguir, cuál es el sitio oficial y en qué momento conviene ir.</p>
          <form class="buscador" role="search" id="form-buscar">
            <label for="buscar" class="solo-lector">Buscar trámite</label>
            <input id="buscar" type="search" placeholder="Buscar trámite, por ejemplo «e.firma»" autocomplete="off">
            <button class="boton" type="submit">${icono("buscar")}<span>Buscar</span></button>
          </form>
          <p class="sugeridos">Más consultados:
            <a href="#/tramite/efirma">e.firma</a>
            <a href="#/tramite/pasaporte">Pasaporte</a>
            <a href="#/tramite/ine">Credencial INE</a>
          </p>
        </div>
        <aside class="resumen-portada" aria-label="Qué encuentras en cada trámite">
          <h2>En cada trámite encuentras</h2>
          <ul class="lista-iconos">
            <li>${icono("lista")}<span><b>Lista de documentos</b>Lo que realmente te piden, incluso lo que el portal no dice.</span></li>
            <li>${icono("escudo")}<span><b>Fuente oficial verificada</b>Distingue el sitio oficial gratuito de intermediarios de paga.</span></li>
            <li>${icono("reloj")}<span><b>Cuándo ir</b>Sedes cercanas y el mejor momento según reportes ciudadanos.</span></li>
          </ul>
        </aside>
      </div>
    </section>

    <section class="seccion">
      <div class="contenedor">
        <div class="seccion-titulo">
          <h2>Trámites</h2>
          <span class="texto-suave">Información consultada el ${formatearFecha(FECHA_CONSULTA)}</span>
        </div>
        <div class="pestanas" role="tablist" aria-label="Modalidad del trámite">
          <button role="tab" data-tipo="todos">Todos<span class="contador">(${cuenta("todos")})</span></button>
          <button role="tab" data-tipo="presencial">Presencial<span class="contador">(${cuenta("presencial")})</span></button>
          <button role="tab" data-tipo="linea">En línea<span class="contador">(${cuenta("linea")})</span></button>
        </div>
        <ul class="filas" id="lista-tramites"></ul>
      </div>
    </section>

    <section class="seccion banda">
      <div class="contenedor">
        <h2>Cómo funciona</h2>
        <div class="tres" style="margin-top:1.25rem">
          <div><p class="paso-num">Paso 1</p><h3>Busca tu trámite</h3><p class="texto-suave">Escribe el nombre como lo conoces. Separamos los trámites en línea de los presenciales.</p></div>
          <div><p class="paso-num">Paso 2</p><h3>Prepárate</h3><p class="texto-suave">Marca tus documentos, sigue el paso a paso y entra directo al sitio oficial.</p></div>
          <div><p class="paso-num">Paso 3</p><h3>Comparte cómo te fue</h3><p class="texto-suave">Con un toque reporta cuánto esperaste o qué error tuviste. Eso ayuda a la siguiente persona.</p></div>
        </div>
      </div>
    </section>`;

  const input = document.getElementById("buscar");
  const pestanas = document.querySelectorAll(".pestanas button");
  const marcar = () => pestanas.forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tipo === filtroTipo)));
  pestanas.forEach((b) => b.addEventListener("click", () => { filtroTipo = b.dataset.tipo; marcar(); dibujarLista(input.value); }));

  input.addEventListener("input", () => dibujarLista(input.value));
  document.getElementById("form-buscar").addEventListener("submit", (e) => {
    e.preventDefault();
    const r = buscarTramites(input.value, filtroTipo);
    if (r.length === 1) location.hash = `#/tramite/${r[0].id}`;
    else { dibujarLista(input.value); document.getElementById("lista-tramites").scrollIntoView({ behavior: "smooth" }); }
  });

  marcar();
  dibujarLista("");
}

/* ---------- 5. TRÁMITE ---------- */
/* La página del trámite tiene un menú a la izquierda (arriba en celular).
   Cada opción muestra UNA sección; la dirección cambia a
   #/tramite/<id>/<seccion> para que el botón "atrás" funcione. */

let mapaActual = null;       // mapa de Leaflet activo (se borra al cambiar de pantalla)
const cacheReportes = {};    // reportes ya leídos por trámite, para no volver a pedirlos al cambiar de sección
let turnoPantalla = 0;       // evita que una pantalla vieja se dibuje si el usuario ya cambió de página

const textoReportes = (n) => (n === 1 ? "1 reporte" : `${n} reportes`);
const textoPersonas = (n) => (n === 1 ? "1 persona" : `${n} personas`);

// Lee los reportes de Firestore; si no hay conexión devuelve listas vacías.
async function leerReportesSeguro(tramite) {
  if (!nube) return { espera: [], errores: [] };
  try { return await nube.leerReportes(tramite); }
  catch (e) { console.warn("No se pudieron leer los reportes", e); return { espera: [], errores: [] }; }
}

// Para ordenar sedes sin ubicación: primero las de menos espera, al final las que no tienen reportes.
const ordenEspera = (s) => (s.resumen.estado ? s.resumen.espera : 9999);

// Reúne en un objeto todo lo que se calcula con los reportes de un trámite.
function prepararDatos(t, reportes) {
  const conteos = {};
  reportes.errores.forEach((r) => { conteos[r.error] = (conteos[r.error] || 0) + 1; });
  const problemas = [...t.errores]
    .map((e) => ({ ...e, cuenta: conteos[e.id] || 0 }))
    .sort((a, b) => b.cuenta - a.cuenta);

  const sedes = (t.sedes || [])
    .map((s) => ({
      ...s,
      km: miUbicacion ? distanciaKm(miUbicacion, s) : null,
      resumen: resumirSede(reportes.espera.filter((r) => r.sede === s.id)),
    }))
    // Con ubicación: de la más cercana a la más lejana. Sin ubicación: de menos a más espera.
    .sort((a, b) => (miUbicacion ? a.km - b.km : ordenEspera(a) - ordenEspera(b)));

  const conEstimacion = sedes.filter((s) => s.resumen.estado);
  return {
    problemas,
    sedes,
    consejo: consejoDe(reportes.espera),
    menosEspera: conEstimacion.sort((a, b) => a.resumen.espera - b.resumen.espera)[0] || null,
    demoEspera: sedes.some((s) => s.resumen.demo),
    demoErrores: reportes.errores.some((r) => r.demo),
  };
}

// Opciones del menú lateral. "sedes" solo existe en trámites presenciales.
function seccionesDe(t) {
  return [
    { id: "resumen", nombre: "Resumen", icono: "info" },
    { id: "documentos", nombre: "Documentos", icono: "lista", cuenta: t.documentos.length },
    { id: "pasos", nombre: "Paso a paso", icono: "pasos", cuenta: t.pasos.length },
    ...(t.tipo === "presencial" ? [{ id: "sedes", nombre: "Sedes y mapa", icono: "ubicacion", cuenta: t.sedes.length }] : []),
    { id: "problemas", nombre: "Problemas frecuentes", icono: "alerta", cuenta: t.errores.length },
    { id: "fuentes", nombre: "Fuentes", icono: "documento" },
  ];
}

/* ----- 5.1 Secciones ----- */

function panelResumen(t, d) {
  const avisos = t.documentos.filter((doc) => doc.aviso).length;
  const accesos = [
    { ir: "documentos", icono: "lista", titulo: `${t.documentos.length} documentos`, texto: avisos ? `${avisos} con aviso importante` : "Marca lo que ya tienes" },
    { ir: "pasos", icono: "pasos", titulo: `${t.pasos.length} pasos`, texto: "Con enlace directo al sitio oficial" },
    ...(t.tipo === "presencial" ? [{
      ir: "sedes", icono: "ubicacion", titulo: `${t.sedes.length} ${t.sedes.length === 1 ? "sede" : "sedes"}`,
      texto: d.menosEspera ? `Menos espera: ${d.menosEspera.nombre} (~${d.menosEspera.resumen.espera} min)` : "Aún sin reportes de espera",
    }] : []),
    { ir: "problemas", icono: "alerta", titulo: "Problema más común", texto: d.problemas[0].cuenta ? d.problemas[0].titulo : "Todavía sin reportes" },
  ];
  const comparacion = t.comparacion ? `
    <h3 style="margin-top:1.5rem">Opciones para obtenerla</h3>
    <div class="comparacion">
      ${t.comparacion.map((c) => `
        <div class="comparacion-item">
          ${etiquetaFuente(c.tipo)}
          <b>${escapar(c.nombre)}</b>
          <span class="texto-suave">${escapar(c.nota)}</span>
          ${c.url ? `<a href="${c.url}" target="_blank" rel="noopener">${escapar(new URL(c.url).hostname)} ${icono("externo")}</a>` : ""}
        </div>`).join("")}
    </div>` : "";
  const enlace = t.pasos.find((p) => p.enlace);

  return `
    <h2 class="solo-lector">Resumen</h2>
    <div class="aviso ${t.fuente.tipo}">
      <p><b>${NOMBRES_FUENTE[t.fuente.tipo]} · ${escapar(t.fuente.sitio)}</b></p>
      <p>${escapar(t.fuente.explicacion)}</p>
    </div>
    ${enlace ? `<a class="boton boton-grande" href="${enlace.enlace}" target="_blank" rel="noopener" style="margin-top:1rem">Ir al sitio oficial ${icono("externo")}</a>` : ""}
    <div class="accesos">
      ${accesos.map((a) => `
        <a class="acceso" href="#/tramite/${t.id}/${a.ir}">
          <span class="acceso-icono">${icono(a.icono)}</span>
          <span><b>${escapar(a.titulo)}</b><span class="texto-suave">${escapar(a.texto)}</span></span>
          ${icono("flecha", "flecha")}
        </a>`).join("")}
    </div>
    ${comparacion}`;
}

function panelDocumentos(t, marcados) {
  return `
    <div class="bloque-cabecera">
      <h2>Documentos que debes llevar</h2>
      <button type="button" class="boton boton-secundario boton-chico" id="leer-checklist">${icono("volumen")} Escuchar lista</button>
    </div>
    <p class="progreso-texto" id="texto-progreso"></p>
    <div class="progreso" aria-hidden="true"><div id="barra-progreso"></div></div>
    <ul class="checklist">
      ${t.documentos.map((doc, i) => `
        <li><label>
          <input type="checkbox" data-indice="${i}" ${marcados.includes(i) ? "checked" : ""}>
          <span><b>${escapar(doc.texto)}</b><small>${escapar(doc.detalle)}</small>
            ${doc.aviso ? `<span class="alerta">${icono("alerta")} ${escapar(doc.aviso)}</span>` : ""}</span>
        </label></li>`).join("")}
    </ul>`;
}

function panelPasos(t) {
  return `
    <h2>Paso a paso</h2>
    <ol class="pasos">
      ${t.pasos.map((p) => `
        <li><p>${escapar(p.texto)}</p>
          ${p.enlace ? `<a class="boton boton-chico" href="${p.enlace}" target="_blank" rel="noopener">Ir a ${escapar(p.etiquetaEnlace)} ${icono("externo")}</a>` : ""}
        </li>`).join("")}
    </ol>`;
}

function panelSedes(t, d) {
  const tarjetas = d.sedes.map((s) => {
    const r = s.resumen;
    const estado = r.estado
      ? `<span class="estado ${r.estado}">${NOMBRES_SEMAFORO[r.estado]}</span>`
      : `<span class="estado sin-datos">Sin reportes recientes</span>`;
    const espera = r.estado
      ? `<span>${icono("reloj")} ~${r.espera} min de espera</span>
         ${r.mejor ? `<span>${icono("calendario")} Mejor: ${r.mejor}</span>` : ""}`
      : `<span class="texto-suave">${r.total ? `${textoReportes(r.total)}; faltan ${MIN_REPORTES - r.total} para estimar.` : "Nadie ha reportado todavía."}</span>`;
    return `
      <article class="sede" id="sede-${s.id}">
        <div class="sede-cabecera">
          <div>
            <h3>${escapar(s.nombre)}</h3>
            <p class="direccion">${escapar(s.direccion)}</p>
          </div>
          ${estado}
        </div>
        <div class="sede-datos">
          ${s.km !== null ? `<span>${icono("ubicacion")} ${s.km.toFixed(1)} km</span>` : ""}
          <span>${icono("calendario")} ${escapar(s.horario)}</span>
          ${r.estado ? `<span class="texto-suave">${icono("usuarios")} ${textoReportes(r.total)}</span>` : ""}
        </div>
        <div class="sede-datos">${espera}</div>
        <div class="sede-acciones">
          <a class="boton boton-secundario boton-chico" target="_blank" rel="noopener" href="${enlaceGoogleMaps(s)}">${icono("ubicacion")} Abrir en Google Maps</a>
          <a class="boton boton-texto boton-chico" href="#/tramite/${t.id}/reportar/espera/${s.id}">Reportar mi espera</a>
        </div>
      </article>`;
  }).join("");

  return `
    <div class="bloque-cabecera">
      <h2>Sedes y mapa</h2>
      <button type="button" class="boton boton-secundario boton-chico" id="usar-ubicacion">${icono("ubicacion")} ${miUbicacion ? "Actualizar mi ubicación" : "Ordenar por cercanía"}</button>
    </div>
    ${d.consejo ? `<div class="aviso neutro" style="margin-bottom:1rem"><p>${icono("calendario")} ${escapar(d.consejo)}</p></div>` : ""}
    <div id="mapa" class="mapa" role="region" aria-label="Mapa de sedes"></div>
    <div class="leyenda">
      <span><i class="punto libre"></i> Poca espera</span>
      <span><i class="punto medio"></i> Media</span>
      <span><i class="punto saturado"></i> Mucha</span>
      <span><i class="punto sin-datos"></i> Sin reportes</span>
      ${miUbicacion ? '<span><i class="punto tu"></i> Tú</span>' : ""}
    </div>
    <div class="sedes sedes-cuadricula">${tarjetas}</div>
    <p class="texto-suave" style="margin-top:1rem;font-size:.88rem">La espera es el promedio de lo que reportan otras personas en los últimos ${DIAS_RECIENTES} días. Para la fecha y hora de tu cita, consulta el sitio oficial.</p>
    ${notaPrueba(d.demoEspera)}`;
}

function panelProblemas(t, d) {
  const maximo = Math.max(1, ...d.problemas.map((p) => p.cuenta));
  return `
    <div class="bloque-cabecera">
      <h2>Problemas frecuentes</h2>
    </div>
    <a class="banner-reportar" href="#/tramite/${t.id}/reportar/problema">
      <span>${icono("megafono")}</span>
      <span><b>¿Te pasó algo con este trámite?</b><span>Repórtalo en segundos y ayuda a la siguiente persona.</span></span>
      <span class="boton boton-acento boton-chico">Reportar</span>
    </a>
    <div class="problemas">
      ${d.problemas.map((p) => `
        <details class="problema">
          <summary>
            <span class="problema-titulo"><span class="categoria">${escapar(p.categoria)}</span><b>${escapar(p.titulo)}</b></span>
            <span class="problema-cuenta">
              <b>${textoPersonas(p.cuenta)}</b>
              <span class="mini-barra"><span style="width:${(p.cuenta / maximo) * 100}%"></span></span>
            </span>
          </summary>
          <div class="problema-solucion">${icono("check")}<p><b>Qué hacer:</b> ${escapar(p.solucion)}</p></div>
        </details>`).join("")}
    </div>
    <p class="texto-suave" style="font-size:.88rem;margin-top:.75rem">Toca un problema para ver qué hacer.</p>
    ${notaPrueba(d.demoErrores)}`;
}

function panelFuentes(t) {
  return `
    <h2>Fuentes consultadas</h2>
    <ol class="fuentes">${t.fuentes.map((f) => `<li><a href="${f.url}" target="_blank" rel="noopener">${escapar(f.titulo)}</a></li>`).join("")}</ol>
    <p class="texto-suave" style="font-size:.88rem;margin-top:.75rem">Consultadas el ${formatearFecha(FECHA_CONSULTA)}. Los requisitos pueden cambiar; confirma siempre en el sitio oficial.</p>
    <button type="button" class="boton boton-secundario boton-chico" id="esto-cambio">¿Esta información cambió? Avísanos</button>`;
}

/* ----- 5.2 Apartado "Reportar" ----- */
// modo: "" (elegir), "espera" o "problema". sedeId: sede preseleccionada.
function panelReportar(t, d, modo, sedeId) {
  const presencial = t.tipo === "presencial";
  const opcion = (id, ico, titulo, texto) => `
    <a class="opcion-grande ${modo === id ? "activa" : ""}" href="#/tramite/${t.id}/reportar/${id}">
      <span class="opcion-icono">${icono(ico)}</span>
      <span><b>${titulo}</b><span>${texto}</span></span>
    </a>`;

  let flujo = "";
  if (modo === "espera" && presencial) {
    flujo = `
      <div class="flujo" id="flujo-espera">
        <h3><span class="num">1</span> ¿A qué sede fuiste?</h3>
        <div class="elegir-sede">
          ${d.sedes.map((s) => `
            <label class="sede-opcion">
              <input type="radio" name="sede" value="${s.id}" ${s.id === sedeId || d.sedes.length === 1 ? "checked" : ""}>
              <span><b>${escapar(s.nombre)}</b><small>${escapar(s.direccion)}</small></span>
            </label>`).join("")}
        </div>
        <h3><span class="num">2</span> ¿Cuánto esperaste?</h3>
        <div class="tiempos">
          <button type="button" data-minutos="15"><b>Menos de 30 min</b><span>Rápido</span></button>
          <button type="button" data-minutos="45"><b>30 min a 1 h</b><span>Normal</span></button>
          <button type="button" data-minutos="90"><b>1 a 2 horas</b><span>Lento</span></button>
          <button type="button" data-minutos="150"><b>Más de 2 horas</b><span>Muy lento</span></button>
        </div>
        <p class="texto-suave" style="font-size:.85rem">Se envía al tocar el tiempo. Es anónimo: solo guardamos sede, día, hora y tiempo.</p>
      </div>`;
  } else if (modo === "problema") {
    flujo = `
      <div class="flujo" id="flujo-problema">
        <h3><span class="num">1</span> ¿Es alguno de estos?</h3>
        <div class="problemas-rapidos">
          ${d.problemas.map((p) => `<button type="button" data-error="${p.id}">${escapar(p.titulo)}</button>`).join("")}
        </div>
        <h3><span class="num">2</span> ¿Otro problema? Cuéntanos con tus palabras</h3>
        <form id="form-problema">
          <label for="texto-problema" class="solo-lector">Describe tu problema</label>
          <textarea id="texto-problema" maxlength="300" rows="3" placeholder="Ejemplo: el pago me marcó error y no me dejó cambiar de tarjeta"></textarea>
          <div class="form-pie">
            <span class="texto-suave">No escribas datos personales (nombre, CURP, RFC, teléfono).</span>
            <button type="submit" class="boton boton-acento">Enviar reporte</button>
          </div>
        </form>
        <p class="texto-suave" style="font-size:.85rem;margin:0">Usamos inteligencia artificial para agrupar tu reporte con otros parecidos.</p>
      </div>`;
  }

  return `
    <h2>Reportar</h2>
    <p class="texto-suave">Tu reporte es anónimo y ayuda a que la siguiente persona sepa qué esperar.</p>
    <div class="opciones">
      ${presencial ? opcion("espera", "reloj", "Cuánto tiempo esperé", "Ayuda a calcular la espera de cada sede") : ""}
      ${opcion("problema", "alerta", "Tuve un problema", "Algo salió mal en el trámite o en el portal")}
    </div>
    <div id="resultado-reporte"></div>
    ${flujo}`;
}

/* ----- 5.3 Mapa ----- */
// Mapa interactivo (Leaflet) con mapa base de Esri (no requiere clave). Cada sede es una etiqueta
// con su tiempo de espera; al tocarla se resalta su tarjeta en la lista.
function crearMapa(sedes) {
  const contenedor = document.getElementById("mapa");
  if (!contenedor) return;
  if (typeof L === "undefined") {
    contenedor.innerHTML = '<p style="padding:1rem" class="texto-suave">No se pudo cargar el mapa. Revisa tu conexión.</p>';
    return;
  }
  mapaActual = L.map(contenedor, { scrollWheelZoom: false });
  // Mapa base gris claro + capa de nombres de calles y colonias.
  const esri = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/";
  L.tileLayer(`${esri}World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}`, {
    maxZoom: 16,
    attribution: "Mapa &copy; Esri, HERE, Garmin, OpenStreetMap",
  }).addTo(mapaActual);
  L.tileLayer(`${esri}World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}`, { maxZoom: 16 }).addTo(mapaActual);

  const puntos = [];
  sedes.forEach((s) => {
    const r = s.resumen;
    const texto = r.estado ? `${r.espera} min` : "s/d";
    const marcador = L.marker([s.lat, s.lng], {
      title: s.nombre,
      icon: L.divIcon({ className: "", iconSize: [0, 0], html: `<div class="pin ${r.estado || "sin-datos"}">${texto}</div>` }),
    }).addTo(mapaActual);
    marcador.bindPopup(`
      <b>${escapar(s.nombre)}</b><br>
      <span>${escapar(s.direccion)}</span><br>
      <span>${r.estado ? `${NOMBRES_SEMAFORO[r.estado]} · ~${r.espera} min` : "Sin reportes recientes"}</span><br>
      <a href="${enlaceGoogleMaps(s)}" target="_blank" rel="noopener">Abrir en Google Maps</a>`);
    marcador.on("click", () => resaltarSede(s.id));
    puntos.push([s.lat, s.lng]);
  });

  if (miUbicacion) {
    L.marker([miUbicacion.lat, miUbicacion.lng], {
      title: "Tu ubicación",
      icon: L.divIcon({ className: "", iconSize: [0, 0], html: '<div class="pin-tu"></div>' }),
    }).addTo(mapaActual).bindPopup("Tu ubicación");
    puntos.push([miUbicacion.lat, miUbicacion.lng]);
  }
  mapaActual.fitBounds(puntos, { padding: [40, 40], maxZoom: 14 });
}

// Resalta la tarjeta de una sede y la muestra en pantalla.
function resaltarSede(id) {
  document.querySelectorAll(".sede.resaltada").forEach((e) => e.classList.remove("resaltada"));
  const tarjeta = document.getElementById(`sede-${id}`);
  if (!tarjeta) return;
  tarjeta.classList.add("resaltada");
  tarjeta.scrollIntoView({ behavior: "smooth", block: "center" });
}

/* ----- 5.4 Pantalla completa del trámite ----- */
// extra = partes adicionales de la dirección, por ejemplo ["reportar", "espera", "sat-naucalpan"]
async function pantallaTramite(id, extra = [], recargar = false) {
  const t = TRAMITES.find((x) => x.id === id);
  if (!t) return pantallaNoEncontrada();
  const secciones = seccionesDe(t);
  let seccion = extra[0] || "resumen";
  if (seccion !== "reportar" && !secciones.some((s) => s.id === seccion)) seccion = "resumen";

  // Reportes: se leen una vez por trámite y se reutilizan al cambiar de sección.
  const turno = ++turnoPantalla;
  if (recargar || !cacheReportes[id]) {
    if (!recargar && !document.querySelector(`[data-tramite="${id}"]`)) {
      document.getElementById("app").innerHTML = `<div class="contenedor seccion texto-suave">Cargando información del trámite…</div>`;
    }
    cacheReportes[id] = await leerReportesSeguro(id);
    if (turno !== turnoPantalla) return;
  }
  if (mapaActual) { mapaActual.remove(); mapaActual = null; }
  const d = prepararDatos(t, cacheReportes[id]);

  const claveGuardado = `checklist-${t.id}`;
  let marcados = leerGuardado(claveGuardado, []);

  const contenido = {
    resumen: () => panelResumen(t, d),
    documentos: () => panelDocumentos(t, marcados),
    pasos: () => panelPasos(t),
    sedes: () => panelSedes(t, d),
    problemas: () => panelProblemas(t, d),
    fuentes: () => panelFuentes(t),
    reportar: () => panelReportar(t, d, extra[1] || "", extra[2]),
  }[seccion]();

  const esPresencial = t.tipo === "presencial";
  document.getElementById("app").innerHTML = `
    <div class="contenedor" data-tramite="${t.id}">
      <nav class="migas" aria-label="Ruta"><a href="#/">Trámites</a> / ${escapar(t.nombreCorto)}</nav>
      <header class="cabecera-tramite">
        <p class="institucion">${escapar(t.institucionNombre)}</p>
        <h1>${escapar(t.nombre)}</h1>
        <div class="fila-etiquetas">
          <span class="etiqueta">${icono(esPresencial ? "ubicacion" : "monitor")} ${textoModalidad(t.tipo)}</span>
          ${etiquetaFuente(t.fuente.tipo)}
        </div>
        <p class="entrada">${escapar(t.resumen)}</p>
        <dl class="datos-rapidos">
          <div><dt>Costo</dt><dd>${escapar(t.costo)}</dd></div>
          <div><dt>Cita</dt><dd>${escapar(t.requiereCita)}</dd></div>
          <div><dt>Documentos</dt><dd>${t.documentos.length}</dd></div>
          <div><dt>Consultado</dt><dd>${formatearFecha(FECHA_CONSULTA)}</dd></div>
        </dl>
      </header>

      <div class="tramite-layout">
        <nav class="menu-tramite" aria-label="Secciones del trámite">
          ${secciones.map((s) => `
            <a href="#/tramite/${t.id}/${s.id}" ${s.id === seccion ? 'aria-current="page"' : ""}>
              ${icono(s.icono)}<span>${s.nombre}</span>${s.cuenta ? `<span class="cuenta">${s.cuenta}</span>` : ""}
            </a>`).join("")}
          <a href="#/tramite/${t.id}/reportar" class="menu-reportar" ${seccion === "reportar" ? 'aria-current="page"' : ""}>
            ${icono("megafono")}<span>Reportar</span>
          </a>
        </nav>
        <section class="panel-tramite" id="panel" aria-live="polite">${contenido}</section>
      </div>
    </div>`;

  // Tras enviar un reporte, la dirección se ajusta a la sección mostrada (sin recargar).
  if (recargar) history.replaceState(null, "", `#/tramite/${t.id}/${extra.join("/")}`);
  // En celular el menú es horizontal: recorre la pestaña activa para que quede a la vista.
  const activa = document.querySelector(".menu-tramite [aria-current]");
  const menu = document.querySelector(".menu-tramite");
  if (activa && menu.scrollWidth > menu.clientWidth) menu.scrollLeft = activa.offsetLeft - 16;
  activarPanel(t, seccion, d, marcados, claveGuardado, extra);
}

// Conecta los botones de la sección que se está mostrando.
function activarPanel(t, seccion, d, marcados, claveGuardado, extra) {
  const panel = document.getElementById("panel");

  if (seccion === "documentos") {
    const actualizar = () => {
      const total = t.documentos.length;
      document.getElementById("barra-progreso").style.width = `${(marcados.length / total) * 100}%`;
      document.getElementById("texto-progreso").textContent =
        marcados.length === total ? "Tienes todos los documentos." : `Tienes ${marcados.length} de ${total} documentos.`;
    };
    panel.querySelectorAll(".checklist input").forEach((caja) => caja.addEventListener("change", () => {
      const i = Number(caja.dataset.indice);
      marcados = caja.checked ? [...marcados, i] : marcados.filter((x) => x !== i);
      guardar(claveGuardado, marcados);
      actualizar();
    }));
    actualizar();
    document.getElementById("leer-checklist").addEventListener("click", () => leerEnVoz(t));
  }

  if (seccion === "sedes") {
    crearMapa(d.sedes);
    document.getElementById("usar-ubicacion").addEventListener("click", () =>
      pedirUbicacion(() => pantallaTramite(t.id, ["sedes"], true)));
  }

  if (seccion === "fuentes") {
    document.getElementById("esto-cambio").addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      const detalle = prompt(`¿Qué cambió en "${t.nombre}"? (opcional)`) ?? "";
      btn.disabled = true;
      try {
        if (!nube || typeof nube.avisarCambio !== "function") {
          throw new Error("Sin conexión con el backend");
        }
        await nube.avisarCambio(t.id, t.nombre, detalle);
        mostrarToast("Gracias. Enviamos el aviso al equipo para revisar este trámite.");
      } catch (err) {
        console.error(err);
        mostrarToast("No se pudo enviar el aviso. Intenta de nuevo.");
      } finally {
        btn.disabled = false;
      }
    });
  }

  if (seccion === "reportar" && extra[1] === "espera") {
    panel.querySelectorAll("[data-minutos]").forEach((b) => b.addEventListener("click", async () => {
      const elegida = panel.querySelector('input[name="sede"]:checked');
      if (!elegida) return mostrarToast("Primero elige a qué sede fuiste.");
      const sede = d.sedes.find((s) => s.id === elegida.value);
      await enviarReporte(t, b, () => nube.guardarEspera(t.id, sede.id, Number(b.dataset.minutos)), async () => {
        await pantallaTramite(t.id, ["reportar"], true);
        const nueva = prepararDatos(t, cacheReportes[t.id]).sedes.find((s) => s.id === sede.id).resumen;
        mostrarExito("Tu tiempo de espera quedó registrado",
          nueva.estado ? `Con tu reporte, ${sede.nombre} queda en ~${nueva.espera} min de espera promedio (${textoReportes(nueva.total)}).`
                       : `${sede.nombre} ya tiene ${textoReportes(nueva.total)}. Con ${MIN_REPORTES} se muestra la estimación.`,
          `#/tramite/${t.id}/sedes`, "Ver sedes");
      });
    }));
  }

  if (seccion === "reportar" && extra[1] === "problema") {
    // Problema conocido: un toque.
    panel.querySelectorAll("[data-error]").forEach((b) => b.addEventListener("click", async () => {
      const problema = t.errores.find((e) => e.id === b.dataset.error);
      await enviarReporte(t, b, () => nube.guardarError(t.id, problema.id), async () => {
        await pantallaTramite(t.id, ["reportar"], true);
        const cuenta = prepararDatos(t, cacheReportes[t.id]).problemas.find((p) => p.id === problema.id).cuenta;
        mostrarExito("Gracias por tu reporte", `«${problema.titulo}» ya suma ${textoPersonas(cuenta)}. Qué hacer: ${problema.solucion}`,
          `#/tramite/${t.id}/problemas`, "Ver problemas frecuentes");
      });
    }));

    // Problema escrito con sus palabras: Gemini lo clasifica.
    document.getElementById("form-problema").addEventListener("submit", async (e) => {
      e.preventDefault();
      const texto = document.getElementById("texto-problema").value.trim();
      if (texto.length < 8) return mostrarToast("Describe un poco más lo que pasó.");
      const boton = e.target.querySelector("button");
      let clasificacion;
      await enviarReporte(t, boton, async () => {
        boton.textContent = "Clasificando con Gemini…";
        clasificacion = await nube.clasificarProblema(t.id, texto);
        await nube.guardarError(t.id, clasificacion.error, {
          categoria: clasificacion.categoria,
          ...(clasificacion.error === "otro" && !clasificacion.datosPersonales ? { texto } : {}),
        });
      }, async () => {
        await pantallaTramite(t.id, ["reportar"], true);
        const conocido = t.errores.find((x) => x.id === clasificacion.error);
        if (conocido) {
          mostrarExito("Lo agrupamos con un problema conocido",
            `Tu reporte se parece a «${conocido.titulo}». Qué hacer: ${conocido.solucion}`,
            `#/tramite/${t.id}/problemas`, "Ver problemas frecuentes");
        } else {
          mostrarExito("Registramos un problema nuevo",
            `Lo clasificamos en la categoría «${clasificacion.categoria}». El equipo lo revisará para agregar una solución.`,
            `#/tramite/${t.id}/problemas`, "Ver problemas frecuentes");
        }
      });
    });
  }
}

// Envía un reporte mostrando "Enviando…" y maneja errores de conexión.
async function enviarReporte(t, boton, enviar, alTerminar) {
  if (!nube) return mostrarToast("Sin conexión: no se pudo enviar el reporte.");
  const textoOriginal = boton.innerHTML;
  boton.disabled = true;
  boton.textContent = "Enviando…";
  try {
    await enviar();
    await alTerminar();
  } catch (e) {
    console.error(e);
    boton.disabled = false;
    boton.innerHTML = textoOriginal;
    mostrarToast("No se pudo enviar el reporte. Intenta de nuevo.");
  }
}

// Tarjeta verde de confirmación arriba del apartado "Reportar".
function mostrarExito(titulo, texto, enlace, textoEnlace) {
  const caja = document.getElementById("resultado-reporte");
  if (!caja) return;
  caja.innerHTML = `
    <div class="exito" role="status">
      ${icono("check")}
      <div><b>${escapar(titulo)}</b><p>${escapar(texto)}</p><a class="boton boton-chico" href="${enlace}">${textoEnlace} ${icono("flecha")}</a></div>
    </div>`;
  caja.scrollIntoView({ behavior: "smooth", block: "center" });
}

// Lee la lista de documentos en voz alta con la voz del navegador.
function leerEnVoz(t) {
  if (!("speechSynthesis" in window)) return mostrarToast("Tu navegador no permite leer en voz alta.");
  speechSynthesis.cancel();
  const texto = `Para ${t.nombre} necesitas: ` +
    t.documentos.map((doc) => doc.texto + (doc.aviso ? `. Importante: ${doc.aviso}` : "")).join(". ");
  const voz = new SpeechSynthesisUtterance(texto);
  voz.lang = "es-MX";
  speechSynthesis.speak(voz);
}

/* ---------- 6. ASISTENTE ---------- */

// Busca una respuesta preparada cuyas palabras clave aparezcan en la pregunta.
function responderChat(pregunta) {
  const texto = normalizar(pregunta);
  return RESPUESTAS_CHAT.find((r) => r.claves.some((c) => texto.includes(normalizar(c)))) || {
    respuesta: "No tengo información verificada sobre eso. Para no darte un dato incorrecto, te recomiendo consultar el sitio oficial del trámite o reformular tu pregunta.",
    fuente: null,
  };
}

function agregarMensaje(quien, html) {
  const chat = document.getElementById("chat");
  const div = document.createElement("div");
  div.className = `mensaje ${quien}`;
  div.innerHTML = html;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function pantallaAsistente() {
  const sugerencias = ["¿Tengo que llevar USB para la e.firma?", "¿Cuánto cuesta el pasaporte?", "¿Qué día hay menos gente?", "¿Cómo sé si un sitio es oficial?", "¿Qué necesito para el INE?"];
  document.getElementById("app").innerHTML = `
    <div class="contenedor">
      <nav class="migas" aria-label="Ruta"><a href="#/">Inicio</a> / Asistente</nav>
      <h1>Asistente</h1>
      <p class="texto-suave texto-largo">Resuelve tus dudas sobre los trámites con la información verificada de Cita Clara. Si no tiene la respuesta, te lo dice.</p>
      <div class="dos-columnas">
        <div class="chat-caja">
          <div class="chat-cabecera"><b>Asistente de Cita Clara</b><span class="texto-suave" style="font-size:.85rem">${nube ? "Responde con inteligencia artificial" : "Sin conexión"}</span></div>
          <div class="chat" id="chat" aria-live="polite"></div>
          <div class="chat-pie">
            <div class="sugerencias">${sugerencias.map((s) => `<button type="button">${s}</button>`).join("")}</div>
            <form id="form-chat">
              <label for="pregunta" class="solo-lector">Escribe tu pregunta</label>
              <input id="pregunta" type="text" placeholder="Escribe tu pregunta" autocomplete="off">
              <button class="boton" type="submit">Enviar</button>
            </form>
          </div>
        </div>
        <aside class="lateral">
          <div class="caja"><div class="caja-cuerpo">
            <h2>Cómo responde</h2>
            <p class="texto-suave" style="font-size:.92rem">Cada respuesta indica de qué trámite sale la información. No da asesoría legal ni fiscal y no pide datos personales.</p>
          </div></div>
        </aside>
      </div>
    </div>`;

  agregarMensaje("bot", "Hola. ¿Con qué trámite te puedo ayudar?");

  const input = document.getElementById("pregunta");
  const boton = document.querySelector("#form-chat button");
  let ocupado = false;

  // Envía la pregunta a Gemini; si falla, usa una respuesta preparada.
  const preguntar = async (pregunta) => {
    if (!pregunta.trim() || ocupado) return;
    ocupado = true;
    boton.disabled = true;
    agregarMensaje("yo", escapar(pregunta));
    agregarMensaje("bot", '<span class="texto-suave" id="escribiendo">Escribiendo…</span>');

    let resultado;
    try {
      if (!nube) throw new Error("sin conexión");
      resultado = await nube.preguntarGemini(pregunta);
    } catch (e) {
      console.warn("Gemini no respondió; se usa respuesta preparada", e);
      resultado = { ...responderChat(pregunta), preparada: true };
    }

    document.getElementById("escribiendo")?.parentElement.remove();
    const tramite = TRAMITES.find((t) => t.id === resultado.fuente);
    const pie = [
      tramite ? `Fuente: <a href="#/tramite/${tramite.id}">${escapar(tramite.nombre)}</a>` : "",
      resultado.preparada ? "Respuesta preparada (Gemini no disponible)" : "",
    ].filter(Boolean).join(" · ");
    agregarMensaje("bot", escapar(resultado.respuesta).replace(/\n/g, "<br>") + (pie ? `<span class="cita">${pie}</span>` : ""));
    ocupado = false;
    boton.disabled = false;
  };

  document.getElementById("form-chat").addEventListener("submit", (e) => { e.preventDefault(); preguntar(input.value); input.value = ""; });
  document.querySelectorAll(".sugerencias button").forEach((b) => b.addEventListener("click", () => preguntar(b.textContent)));
}

/* ---------- 7. PANEL DE TRANSPARENCIA ---------- */

// Barras horizontales; "unidad" se agrega al número (por ejemplo " min").
function htmlBarras(datos, unidad = "") {
  const filtrados = datos.filter((d) => d.valor > 0).sort((a, b) => b.valor - a.valor);
  if (filtrados.length === 0) return '<p class="texto-suave">Todavía no hay reportes.</p>';
  const maximo = Math.max(...filtrados.map((d) => d.valor));
  return `<ul class="barras">${filtrados.map((d) => `
    <li><div class="fila"><span>${escapar(d.nombre)}</span><b>${Math.round(d.valor).toLocaleString("es-MX")}${unidad}</b></div>
      <div class="pista"><div class="relleno" style="width:${(d.valor / maximo) * 100}%"></div></div></li>`).join("")}</ul>`;
}

// Suma valores agrupando por una clave: agrupar(lista, r => r.tramite) -> { efirma: 10, ... }
function agrupar(lista, clave) {
  return lista.reduce((acc, r) => { const k = clave(r); acc[k] = (acc[k] || 0) + 1; return acc; }, {});
}

async function pantallaPanel() {
  const turno = ++turnoPantalla;
  document.getElementById("app").innerHTML = `<div class="contenedor seccion texto-suave">Calculando indicadores…</div>`;
  const { espera, errores } = await leerReportesSeguro();
  if (turno !== turnoPantalla) return;

  const todos = [...espera, ...errores];
  const semana = todos.filter((r) => (Date.now() - r.creado.getTime()) / 86400000 <= 7).length;
  const hayDemo = todos.some((r) => r.demo);

  // Reportes por trámite
  const porTramite = agrupar(todos, (r) => r.tramite);
  const datosTramite = TRAMITES.map((t) => ({ nombre: t.nombreCorto, valor: porTramite[t.id] || 0 }));

  // Problemas por categoría (la categoría sale del catálogo)
  const categoriaDe = {};
  TRAMITES.forEach((t) => t.errores.forEach((e) => { categoriaDe[e.id] = e.categoria; }));
  const porCategoria = agrupar(errores, (r) => r.categoria || categoriaDe[r.error] || "Otro");
  const datosCategoria = Object.entries(porCategoria).map(([nombre, valor]) => ({ nombre, valor }));

  // Espera promedio por sede
  const sedes = TRAMITES.flatMap((t) => t.sedes || []);
  const datosSedes = sedes.map((s) => {
    const lista = espera.filter((r) => r.sede === s.id);
    return { nombre: s.nombre, valor: lista.length >= MIN_REPORTES ? promedio(lista) : 0 };
  });

  document.getElementById("app").innerHTML = `
    <div class="contenedor" style="padding-bottom:3rem">
      <nav class="migas" aria-label="Ruta"><a href="#/">Inicio</a> / Transparencia</nav>
      <div class="seccion-titulo">
        <div>
          <h1>Panel de transparencia</h1>
          <p class="texto-suave texto-largo" style="margin:0">Qué trámites generan más reportes, qué problemas se repiten y dónde se espera más. Pensado para instituciones y ciudadanía.</p>
        </div>
      </div>
      <dl class="kpis" style="margin-top:1.5rem">
        <div class="kpi"><dt>Reportes totales</dt><dd>${todos.length.toLocaleString("es-MX")}</dd></div>
        <div class="kpi"><dt>Últimos 7 días</dt><dd>${semana.toLocaleString("es-MX")}</dd></div>
        <div class="kpi"><dt>Sedes con estimación</dt><dd>${datosSedes.filter((d) => d.valor > 0).length} de ${sedes.length}</dd></div>
      </dl>
      <div class="graficas">
        <section><h2>Reportes por trámite</h2>${htmlBarras(datosTramite)}</section>
        <section><h2>Problemas por categoría</h2>${htmlBarras(datosCategoria)}</section>
        <section><h2>Espera promedio por sede</h2>${htmlBarras(datosSedes, " min")}</section>
      </div>
      ${notaPrueba(hayDemo)}
    </div>`;
}

/* ---------- 8. ACERCA DE ---------- */

function pantallaAcerca() {
  document.getElementById("app").innerHTML = `
    <div class="contenedor" style="padding-bottom:3rem">
      <nav class="migas" aria-label="Ruta"><a href="#/">Inicio</a> / Acerca de</nav>
      <h1>Acerca de Cita Clara</h1>
      <div class="texto-largo">
        <p class="entrada" style="font-size:1.1rem">Cita Clara reúne en un solo lugar lo que necesitas para hacer un trámite: qué documentos llevar, qué pasos seguir, cuál es el sitio oficial y cuándo conviene ir.</p>
        <p>Complementamos a los canales oficiales, como Ventanilla 24/7 de gob.mx: sumamos la experiencia de otras personas que ya hicieron el trámite.</p>

        <h2 style="margin-top:2rem">De dónde sale la información</h2>
        <p><b>Requisitos y pasos.</b> Los consultamos en los sitios oficiales de cada institución. En cada trámite verás las fuentes y la fecha de consulta.</p>
        <p><b>Tiempos de espera.</b> Son el promedio de lo que reportan otras personas en los últimos ${DIAS_RECIENTES} días. Con menos de ${MIN_REPORTES} reportes no mostramos estimación.</p>
        <p><b>Problemas frecuentes.</b> Salen de los reportes de la comunidad. Usamos inteligencia artificial para agrupar los que describen lo mismo.</p>

        <h2 style="margin-top:2rem">Lo que no hacemos</h2>
        <p>No agendamos citas ni vemos los horarios disponibles de las instituciones: eso solo se puede hacer en sus portales oficiales. No cobramos por nada.</p>

        <h2 style="margin-top:2rem">Privacidad</h2>
        <p>No pedimos cuenta, nombre ni datos personales. Los reportes son anónimos: solo guardamos la sede, el día, la hora y el tiempo de espera. Si usas «Ordenar por cercanía», tu ubicación se usa solo en tu navegador y no se guarda.</p>
      </div>
    </div>`;
}

/* ---------- 9. No encontrado ---------- */

function pantallaNoEncontrada() {
  document.getElementById("app").innerHTML = `
    <div class="contenedor seccion">
      <h1>No encontramos esta página</h1>
      <p class="texto-suave">Es posible que el enlace esté mal escrito.</p>
      <a class="boton" href="#/">Ir a trámites</a>
    </div>`;
}

/* ---------- 10. Router ---------- */

let rutaAnterior = [];

function router() {
  turnoPantalla++; // cualquier pantalla que siguiera cargando ya no se dibuja
  if (mapaActual) { mapaActual.remove(); mapaActual = null; }

  const partes = location.hash.replace(/^#\/?/, "").split("/"); // "#/tramite/efirma" -> ["tramite","efirma"]
  const ruta = partes[0] || "";

  if (ruta === "") pantallaInicio();
  else if (ruta === "tramite") pantallaTramite(partes[1], partes.slice(2));
  else if (ruta === "asistente") pantallaAsistente();
  else if (ruta === "panel") pantallaPanel();
  else if (ruta === "acerca") pantallaAcerca();
  else pantallaNoEncontrada();

  // Marca la página actual en el menú ("tramite" pertenece a "Trámites").
  const actual = ruta === "tramite" ? "" : ruta;
  document.querySelectorAll(".nav a").forEach((a) => {
    if (a.getAttribute("href") === "#/" + actual) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });

  // Cierra el menú en celular y regresa arriba.
  document.getElementById("menu").classList.remove("abierto");
  document.getElementById("menu-movil").setAttribute("aria-expanded", "false");
  // Si solo cambió la sección del mismo trámite, no regresamos hasta arriba:
  // dejamos visible el menú y el contenido.
  const mismoTramite = ruta === "tramite" && rutaAnterior[0] === "tramite" && rutaAnterior[1] === partes[1];
  if (!mismoTramite) {
    window.scrollTo(0, 0);
    document.getElementById("app").focus({ preventScroll: true });
  }
  rutaAnterior = partes;
}

window.addEventListener("hashchange", router);

// Primero se carga la conexión con la nube (Firestore + Gemini) y luego se dibuja la página.
// Si no carga en 5 segundos o falla (sin internet), la página funciona sin ella.
Promise.race([
  import("./nube.js").then((modulo) => { nube = modulo; }),
  new Promise((resolver) => setTimeout(resolver, 5000)),
]).catch((e) => console.warn("Sin conexión con la nube", e)).finally(router);

// Botón "Menú" en celular.
document.getElementById("menu-movil").addEventListener("click", (e) => {
  const abierto = document.getElementById("menu").classList.toggle("abierto");
  e.currentTarget.setAttribute("aria-expanded", String(abierto));
});
