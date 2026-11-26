/* =========================================================
   nube.js — Conexión con Backend de Cita Clara (Apps Script)
   ---------------------------------------------------------
   - Guarda reportes y avisos de cambio vía Apps Script.
   - Consulta a Gemini desde el backend (API key protegida).
   - Lee catálogo y reportes desde Firestore; el catálogo es de solo lectura en cliente.
   ========================================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
  getFirestore, collection, getDocs, query, where,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const BACKEND_URL = "https://script.google.com/macros/s/AKfycbydyRsWBx1SbdGXVqQwDqBEHrAzFeTuv38Eds0j4kfgn5gPOrCdqux6Z7VXdyf50boN/exec";

const configuracion = {
  apiKey: "AIzaSyB_LhIuWDGY8I3uEueT_CXHRWTJNFLbllQ",
  authDomain: "cita-clara-fd1b4.firebaseapp.com",
  projectId: "cita-clara-fd1b4",
  storageBucket: "cita-clara-fd1b4.firebasestorage.app",
  messagingSenderId: "1055924445696",
  appId: "1:1055924445696:web:1b034fa4989ba1389baee5",
};

const app = initializeApp(configuracion);
const db = getFirestore(app);


/* ---------- 0. Catálogo público de trámites ---------- */

// El catálogo se administra con Firebase Admin SDK desde scripts/cargar_catalogo.py.
// Las reglas permiten leerlo desde el navegador, pero no escribirlo.
export async function leerCatalogo() {
  const referencia = collection(db, "catalogo_tramites");
  const resultado = await getDocs(referencia);

  if (resultado.empty) {
    throw new Error("La colección catalogo_tramites está vacía. Ejecuta el script de carga inicial.");
  }

  const documentos = resultado.docs
    .map((doc) => ({ idDocumento: doc.id, datos: doc.data() }))
    .sort((a, b) => Number(a.datos.orden ?? 9999) - Number(b.datos.orden ?? 9999));

  const tramites = documentos.map(({ idDocumento, datos }) => {
    const { fechaConsulta, versionCatalogo, actualizadoEn, orden, ...tramite } = datos;
    if (!tramite.id) tramite.id = idDocumento;
    return tramite;
  });

  const fechaConsulta = documentos.find((x) => x.datos.fechaConsulta)?.datos.fechaConsulta || null;
  return { tramites, fechaConsulta };
}

async function llamarBackend(payload) {
  const res = await fetch(BACKEND_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(data.error || "Error en el backend de Cita Clara");
  }
  return data.data;
}

/* ---------- 1. Lectura de reportes ---------- */

function aLista(resultado) {
  return resultado.docs.map((d) => {
    const datos = d.data();
    return { ...datos, creado: datos.creado ? datos.creado.toDate() : new Date() };
  });
}

export async function leerReportes(tramite) {
  const espera = collection(db, "reportes_espera");
  const errores = collection(db, "reportes_error");
  const [rEspera, rErrores] = await Promise.all([
    getDocs(tramite ? query(espera, where("tramite", "==", tramite)) : espera),
    getDocs(tramite ? query(errores, where("tramite", "==", tramite)) : errores),
  ]);
  return { espera: aLista(rEspera), errores: aLista(rErrores) };
}

/* ---------- 2. Escrituras hacia Apps Script ---------- */

export async function guardarEspera(tramite, sede, minutos, comentario = "") {
  return llamarBackend({
    accion: "reportarEspera",
    tramiteId: tramite,
    sede,
    minutos,
    comentario,
  });
}

export async function guardarError(tramite, error, extra = {}) {
  return llamarBackend({
    accion: "reportarProblema",
    tramiteId: tramite,
    descripcion: error,
    detalle: extra.texto || extra.categoria || JSON.stringify(extra),
  });
}

export async function avisarCambio(tramiteId, nombreTramite, detalle = "") {
  return llamarBackend({
    accion: "avisarCambio",
    tramiteId,
    nombreTramite,
    detalle,
  });
}

/* ---------- 3. Asistente y clasificación vía backend ---------- */

function buscarContextoTramite(tramiteId) {
  if (typeof TRAMITES === "undefined" || !tramiteId) return null;
  return TRAMITES.find((x) => x.id === tramiteId) || null;
}

export async function clasificarProblema(tramite, texto) {
  const t = buscarContextoTramite(tramite);
  const conocidos = t ? t.errores.map((e) => `${e.id}: ${e.titulo} (${e.categoria})`).join(", ") : "";
  const prompt =
    `Clasifica este reporte ciudadano del trámite "${t ? t.nombre : tramite}" ` +
    `(problemas conocidos: ${conocidos || "ninguno"}). ` +
    `Responde solo con JSON válido con las llaves "error", "categoria" y "datosPersonales" (booleano): ` +
    `"${String(texto || "").slice(0, 300)}"`;

  try {
    const data = await llamarBackend({
      accion: "preguntar",
      pregunta: prompt,
      contextoTramite: t ? { id: t.id, nombre: t.nombre } : { id: tramite },
    });
    const limpio = String(data.respuesta || "").replace(/```json|```/gi, "").trim();
    const json = JSON.parse(limpio);
    const errorValido = t && t.errores.some((e) => e.id === json.error) ? json.error : "otro";
    return {
      error: errorValido,
      categoria: json.categoria || "Otro",
      datosPersonales: json.datosPersonales === true,
    };
  } catch {
    return { error: "otro", categoria: "Otro", datosPersonales: true };
  }
}

export async function preguntarGemini(pregunta, tramiteId = null) {
  const contextoTramite = buscarContextoTramite(tramiteId);
  const data = await llamarBackend({
    accion: "preguntar",
    pregunta,
    contextoTramite,
  });
  const texto = String(data.respuesta || "").trim();
  const coincide = texto.match(/FUENTE:\s*([a-z0-9_-]+)\s*$/i);
  const fuente = coincide && coincide[1].toLowerCase() !== "ninguna" ? coincide[1].toLowerCase() : null;
  return {
    respuesta: texto.replace(/\n?FUENTE:.*$/i, "").replace(/\*\*/g, "").trim(),
    fuente,
    modelo: "gemini-3.8-flash",
  };
}