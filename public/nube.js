/* =========================================================
   nube.js — Conexión REAL con Firebase / Google Cloud
   ---------------------------------------------------------
   Aquí está todo lo que habla con servicios en la nube:
   1. Firestore  -> guarda y lee los reportes ciudadanos.
   2. Gemini (Firebase AI Logic) -> responde en el asistente.
   app.js carga este archivo con import() y, si falla
   (por ejemplo sin internet), la página sigue funcionando.
   ========================================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, query, where, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { getAI, getGenerativeModel, GoogleAIBackend } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-ai.js";

/* ---------- Configuración del proyecto ----------
   Estos datos identifican al proyecto; son públicos por diseño.
   La seguridad la ponen las reglas de Firestore (firestore.rules). */
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

/* ---------- 1. Firestore: reportes ---------- */

// Convierte los documentos de una consulta en objetos simples.
function aLista(resultado) {
  return resultado.docs.map((d) => {
    const datos = d.data();
    return { ...datos, creado: datos.creado ? datos.creado.toDate() : new Date() };
  });
}

// Lee los reportes de espera y de errores. Si se da un trámite, solo los de ese trámite.
export async function leerReportes(tramite) {
  const espera = collection(db, "reportes_espera");
  const errores = collection(db, "reportes_error");
  const [rEspera, rErrores] = await Promise.all([
    getDocs(tramite ? query(espera, where("tramite", "==", tramite)) : espera),
    getDocs(tramite ? query(errores, where("tramite", "==", tramite)) : errores),
  ]);
  return { espera: aLista(rEspera), errores: aLista(rErrores) };
}

// Guarda "esperé X minutos en esta sede". El día y la hora son los del momento del reporte.
export async function guardarEspera(tramite, sede, minutos) {
  const ahora = new Date();
  await addDoc(collection(db, "reportes_espera"), {
    tramite, sede, minutos, dia: ahora.getDay(), hora: ahora.getHours(), creado: serverTimestamp(), demo: false,
  });
}

// Guarda un reporte de problema. "error" es el id de un problema conocido o "otro".
// extra puede llevar { categoria, texto } cuando el problema se escribió con palabras propias.
export async function guardarError(tramite, error, extra = {}) {
  await addDoc(collection(db, "reportes_error"), { tramite, error, ...extra, creado: serverTimestamp(), demo: false });
}

/* ---------- 1b. Gemini como clasificador de texto ----------
   Recibe lo que la persona escribió y decide si es uno de los problemas
   conocidos del trámite o uno nuevo, y en qué categoría va.
   (En la arquitectura propuesta esto lo haría Natural Language API.) */
const CATEGORIAS = ["Documentos", "Portal", "Pago", "Sede", "Contraseña", "Fuente", "Otro"];

export async function clasificarProblema(tramite, texto) {
  const t = TRAMITES.find((x) => x.id === tramite);
  const conocidos = t.errores.map((e) => `${e.id}: ${e.titulo} (${e.categoria})`).join("\n");
  const prompt = `Clasifica el reporte de un ciudadano sobre el trámite "${t.nombre}".
Problemas conocidos (id: título):
${conocidos}
Categorías válidas: ${CATEGORIAS.join(", ")}.
Si el reporte describe lo mismo que un problema conocido, usa su id; si no, usa "otro".
Reporte: """${texto.slice(0, 300)}"""
Responde solo con JSON: {"error": "<id o otro>", "categoria": "<categoría válida>", "datosPersonales": <true si incluye nombre, CURP, RFC, teléfono, correo o domicilio de una persona>}`;

  for (const nombre of MODELOS) {
    try {
      const modelo = getGenerativeModel(ai, {
        model: nombre,
        generationConfig: { temperature: 0, maxOutputTokens: 1024, responseMimeType: "application/json" },
      });
      const json = JSON.parse((await modelo.generateContent(prompt)).response.text());
      const error = t.errores.some((e) => e.id === json.error) ? json.error : "otro";
      const conocido = t.errores.find((e) => e.id === error);
      const categoria = conocido ? conocido.categoria : CATEGORIAS.includes(json.categoria) ? json.categoria : "Otro";
      return { error, categoria, datosPersonales: json.datosPersonales === true };
    } catch (e) {
      console.warn(`Clasificación con ${nombre} falló`, e);
    }
  }
  // Si Gemini no responde, el reporte se guarda igual como "otro" (sin texto, por precaución).
  return { error: "otro", categoria: "Otro", datosPersonales: true };
}

/* ---------- 2. Gemini: asistente ---------- */

// Arma el "contexto verificado" que Gemini puede usar: solo el catálogo de trámites.
// Esto es la idea de RAG: el modelo responde con nuestra información, no con lo que "cree".
function catalogoComoTexto() {
  return TRAMITES.map((t) => [
    `ID: ${t.id}`,
    `Trámite: ${t.nombre} (${t.institucionNombre})`,
    `Modalidad: ${t.tipo === "linea" ? "en línea" : "presencial"} · Cita: ${t.requiereCita} · Costo: ${t.costo}${t.nota ? " · " + t.nota : ""}`,
    `Fuente oficial: ${t.fuente.sitio}. ${t.fuente.explicacion}`,
    `Documentos: ${t.documentos.map((d) => `${d.texto} (${d.detalle}${d.aviso ? "; " + d.aviso : ""})`).join("; ")}`,
    `Pasos: ${t.pasos.map((p, i) => `${i + 1}. ${p.texto}${p.enlace ? " [" + p.enlace + "]" : ""}`).join(" ")}`,
    `Problemas frecuentes: ${t.errores.map((e) => `${e.titulo}: ${e.solucion}`).join(" | ")}`,
    t.sedes ? `Sedes: ${t.sedes.map((s) => `${s.nombre}, ${s.direccion}, horario: ${s.horario}`).join(" | ")}` : "",
  ].filter(Boolean).join("\n")).join("\n\n");
}

const instrucciones = `Eres el asistente de Cita Clara, una plataforma ciudadana (no oficial) que orienta sobre trámites en México.
Reglas:
- Responde SOLO con la información del CATÁLOGO de abajo. No inventes requisitos, costos, horarios ni direcciones.
- Si la respuesta no está en el catálogo, dilo con honestidad y recomienda consultar el sitio oficial.
- Español de México, lenguaje simple y amable, máximo 90 palabras. Texto plano, sin markdown ni asteriscos.
- No pidas ni aceptes datos personales (CURP, RFC, nombre). Si te los dan, no los repitas.
- No inventes tiempos de espera: esos se calculan con reportes ciudadanos en la página de cada trámite.
- Al final escribe una línea exactamente así: FUENTE: <ID del trámite usado> (o FUENTE: ninguna).

CATÁLOGO VERIFICADO:
${catalogoComoTexto()}`;

const ai = getAI(app, { backend: new GoogleAIBackend() });

// Dos modelos: si el principal está saturado se usa el de respaldo.
const MODELOS = ["gemini-3.5-flash", "gemini-3.5-flash-lite"];
const chats = {}; // una conversación por modelo, para que recuerde lo anterior

function obtenerChat(nombreModelo) {
  if (!chats[nombreModelo]) {
    const modelo = getGenerativeModel(ai, {
      model: nombreModelo,
      systemInstruction: instrucciones,
      generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
    });
    chats[nombreModelo] = modelo.startChat();
  }
  return chats[nombreModelo];
}

// Envía la pregunta a Gemini y separa la respuesta de la línea "FUENTE: ...".
export async function preguntarGemini(pregunta) {
  let ultimoError;
  for (const nombre of MODELOS) {
    try {
      const resultado = await obtenerChat(nombre).sendMessage(pregunta);
      const texto = resultado.response.text().trim();
      const coincide = texto.match(/FUENTE:\s*([a-z]+)\s*$/i);
      const fuente = coincide && coincide[1].toLowerCase() !== "ninguna" ? coincide[1].toLowerCase() : null;
      return { respuesta: texto.replace(/\n?FUENTE:.*$/i, "").replace(/\*\*/g, "").trim(), fuente, modelo: nombre };
    } catch (e) {
      ultimoError = e;
      delete chats[nombre];
    }
  }
  throw ultimoError;
}
