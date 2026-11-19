/* =========================================================
   datos.js — Catálogo de trámites de Cita Clara
   ---------------------------------------------------------
   QUÉ ES REAL Y QUÉ NO:
   - Requisitos, pasos, costos, sedes y direcciones: información
     REAL consultada en fuentes oficiales y notas periodísticas el
     4 de noviembre de 2026 (cada trámite cita sus fuentes).
     Debe volver a verificarse antes de presentarse como definitiva.
   - Coordenadas de sedes: obtenidas de OpenStreetMap a partir de
     la dirección (pueden variar unos metros).
   - Semáforo de espera, mejor momento, conteo de problemas y panel:
     NO están aquí. Se calculan con los reportes ciudadanos guardados
     en Firestore (ver nube.js). Algunos reportes de arranque están
     marcados como demo: true.
   En producción este catálogo viviría en BigQuery.
   ========================================================= */

const FECHA_CONSULTA = "2026-11-04";


const TRAMITES = [
  /* ---------- 1. e.firma (recorrido principal) ---------- */
  {
    id: "efirma",
    nombre: "e.firma (firma electrónica) para persona física",
    nombreCorto: "e.firma",
    institucion: "SAT",
    institucionNombre: "Servicio de Administración Tributaria",
    tipo: "presencial",
    claves: ["rfc", "e.firma", "efirma", "firma electronica", "sat", "fiel", "inscripcion"],
    resumen:
      "Certificado digital que funciona como tu firma autógrafa para trámites fiscales. Se tramita en una oficina del SAT o en un Módulo de Servicios Tributarios, con cita previa.",
    costo: "Sin costo",
    requiereCita: "Sí, obligatoria",
    fuente: {
      tipo: "oficial-gratuito",
      sitio: "sat.gob.mx",
      explicacion:
        "La cita se agenda en el Portal del SAT, en SAT Móvil o en gob.mx y no tiene costo. Si una página o persona te cobra por conseguir la cita, no es un canal oficial.",
    },
    documentos: [
      { texto: "Memoria USB", detalle: "Ahí te entregan la copia de tu certificado (archivo .cer). El SAT no la proporciona.", aviso: "Sin USB no te pueden entregar tu e.firma" },
      { texto: "Identificación oficial vigente", detalle: "Original. Por ejemplo, credencial para votar o pasaporte." },
      { texto: "CURP", detalle: "Clave Única de Registro de Población." },
      { texto: "Correo electrónico vigente", detalle: "Al que tengas acceso el día de la cita." },
      { texto: "Comprobante de domicilio fiscal (en algunos casos)", detalle: "Original. Solo si te inscribiste al RFC por internet o con tu CURP. Si eres asalariado puedes usar tu INE con el mismo domicilio." },
    ],
    pasos: [
      { texto: "Agenda tu cita en el portal oficial del SAT. Elige el servicio de e.firma y la oficina que te convenga.", enlace: "https://citas.sat.gob.mx/", etiquetaEnlace: "Citas SAT" },
      { texto: "Reúne los documentos de la lista. Lleva originales y la memoria USB." },
      { texto: "Acude a la oficina el día y la hora de tu cita, con tu acuse." },
      { texto: "En la oficina te toman huellas, fotografía, iris y firma, y digitalizan tus documentos." },
      { texto: "Recibe la copia de tu certificado (.cer) en tu USB y guárdala junto con tu archivo .key y tu contraseña." },
    ],
    fuentes: [
      { titulo: "SAT — Ficha 105/CFF «Solicitud del certificado de e.firma»", url: "https://www.sat.gob.mx/gobmx/Paginas/ficha_105_cff.html" },
      { titulo: "Milenio — Módulos de atención del SAT en el Estado de México (2023)", url: "https://www.milenio.com/politica/comunidad/modulos-de-atencion-del-sat-en-el-estado-de-mexico" },
      { titulo: "SAT — Directorio Nacional de Módulos de Servicios Tributarios", url: "https://wwwmat.sat.gob.mx/personas/asalariados/directorio-nacional-de-modulos-de-servicios-tributarios" },
    ],
    errores: [
      { id: "e1", categoria: "Documentos", titulo: "No llevé la memoria USB", solucion: "El SAT no la proporciona y sin ella no te entregan la e.firma. Llévala desde casa; de preferencia nueva o vacía." },
      { id: "e2", categoria: "Portal", titulo: "El portal no muestra citas disponibles", solucion: "Las citas pueden tardar en asignarse. Revisa otras oficinas cercanas y vuelve a consultar en distintos días." },
      { id: "e3", categoria: "Documentos", titulo: "Me pidieron comprobante de domicilio y no lo llevé", solucion: "Es obligatorio si te inscribiste al RFC por internet o con tu CURP. Si tienes duda, llévalo." },
      { id: "e4", categoria: "Contraseña", titulo: "Olvidé la contraseña de mi archivo .key", solucion: "Sin esa contraseña no puedes usar tu e.firma. Anótala en un lugar seguro el mismo día del trámite." },
    ],
    sedes: [
      { id: "sat-naucalpan", nombre: "SAT Naucalpan «Alce Blanco»", direccion: "Av. 16 de Septiembre 784, col. Alce Blanco, Naucalpan", horario: "Con cita", lat: 19.47186, lng: -99.22493 },
      { id: "sat-tlalnepantla", nombre: "SAT Tlalnepantla «México 2»", direccion: "Av. Sor Juana Inés de la Cruz esq. Tenayuca, col. Centro, Tlalnepantla", horario: "Con cita", lat: 19.53962, lng: -99.20738 },
      { id: "sat-cuautitlan", nombre: "SAT Cuautitlán Izcalli", direccion: "Av. Primero de Mayo, col. Centro Urbano, Cuautitlán Izcalli", horario: "Con cita", lat: 19.67786, lng: -99.2169 },
      { id: "sat-cdmx-norte", nombre: "SAT Ciudad de México Norte", direccion: "Bahía de Santa Bárbara 23, col. Verónica Anzures, Miguel Hidalgo", horario: "Con cita", lat: 19.43767, lng: -99.17711 },
      { id: "sat-cdmx-centro", nombre: "SAT Ciudad de México Centro", direccion: "Paseo de la Reforma Norte 10 (Torre Caballito), col. Tabacalera, Cuauhtémoc", horario: "Con cita", lat: 19.43665, lng: -99.14882 },
      { id: "sat-cdmx-oriente", nombre: "SAT Ciudad de México Oriente", direccion: "Viaducto Río de la Piedad 507, col. Granjas México, Iztacalco", horario: "Con cita", lat: 19.40572, lng: -99.11162 },
    ],
  },

  /* ---------- 2. Credencial para votar (INE) ---------- */
  {
    id: "ine",
    nombre: "Credencial para votar",
    nombreCorto: "Credencial INE",
    institucion: "INE",
    institucionNombre: "Instituto Nacional Electoral",
    tipo: "presencial",
    claves: ["ine", "credencial", "votar", "ife", "identificacion"],
    resumen:
      "Trámite de credencial por primera vez, renovación o cambio de domicilio en un Módulo de Atención Ciudadana del INE. Se recomienda agendar cita.",
    costo: "Sin costo",
    requiereCita: "Recomendada",
    fuente: {
      tipo: "oficial-gratuito",
      sitio: "ine.mx",
      explicacion: "La cita se agenda en el sistema de citas del INE o por teléfono (INETEL, 800 433 2000). El trámite es gratuito.",
    },
    documentos: [
      { texto: "Acta de nacimiento", detalle: "Original, sin tachaduras ni enmendaduras. También se acepta carta de naturalización." },
      { texto: "Identificación con fotografía", detalle: "Original. Por ejemplo: pasaporte, cédula profesional, licencia de conducir, cartilla militar o credencial anterior." },
      { texto: "Comprobante de domicilio", detalle: "Original, con antigüedad no mayor a 3 meses.", aviso: "Si no tienes, puedes ir con dos testigos" },
    ],
    pasos: [
      { texto: "Ubica el módulo más cercano a tu domicilio y agenda tu cita en el sitio del INE.", enlace: "https://www.ine.mx/credencial/", etiquetaEnlace: "Credencial INE" },
      { texto: "Acude con tus tres documentos originales el día de tu cita." },
      { texto: "Te toman foto, huellas y firma. Guarda el comprobante que te entregan." },
      { texto: "Regresa al mismo módulo en la fecha indicada para recoger tu credencial, con el comprobante." },
    ],
    fuentes: [
      { titulo: "INE — Medios de identificación aceptados", url: "https://portalanterior.ine.mx/archivos2/portal/credencial/pdf-credencial/Medios-identificacion-INEjun2015.pdf" },
      { titulo: "Fox Sports MX — Cómo sacar tu INE por primera vez en 2026", url: "https://www.foxsports.com.mx/2026/03/26/como-puedes-sacar-tu-ine-por-primera-vez-en-2026-conoce-los-requisitos-citas-y-mas/" },
      { titulo: "Citaine — Módulos del INE en Naucalpan, Tlalnepantla y Atizapán", url: "https://citaine.mx/naucalpan-de-juarez/" },
    ],
    errores: [
      { id: "i1", categoria: "Documentos", titulo: "Mi comprobante de domicilio tenía más de 3 meses", solucion: "Revisa la fecha de expedición antes de ir. Si no tienes uno reciente, pregunta por la opción de dos testigos." },
      { id: "i2", categoria: "Sede", titulo: "Fui a recoger mi credencial a otro módulo", solucion: "Se recoge en el mismo módulo donde hiciste el trámite." },
    ],
    sedes: [
      { id: "ine-152252", nombre: "Módulo INE 152252 · Santa Cruz Acatlán", direccion: "Calle Huicholes 34, locales 3 y 4, Santa Cruz Acatlán, Naucalpan", horario: "Lun. a sáb. 8:00–15:00", lat: 19.48591, lng: -99.24415 },
      { id: "ine-152251", nombre: "Módulo INE 152251 · Alce Blanco", direccion: "Av. Dr. Gustavo Baz 98, local 1, col. Alce Blanco, Naucalpan", horario: "Lun. a vie. 8:00–20:00 · Sáb. 8:00–15:00", lat: 19.4633, lng: -99.21553 },
      { id: "ine-152451", nombre: "Módulo INE 152451 · San Rafael Chamapa", direccion: "Calle Melchor 12, col. San Rafael Chamapa, Naucalpan", horario: "Lun. a vie. 8:00–20:00 · Sáb. 8:00–15:00", lat: 19.45033, lng: -99.26885 },
      { id: "ine-151551", nombre: "Módulo INE 151551 · Atizapán", direccion: "Calzada San Mateo 17, Plaza Crystal local E4, Atizapán Centro, Atizapán de Zaragoza", horario: "Lun. a vie. 8:00–20:00 · Sáb. 8:00–15:00", lat: 19.57451, lng: -99.23359 },
      { id: "ine-151951", nombre: "Módulo INE 151951 · Tlaxcolpan", direccion: "Av. Hidalgo s/n, Plaza Millenium, col. Industrial Tlaxcolpan, Tlalnepantla", horario: "Lun. a vie. 8:00–20:00 · Sáb. 8:00–15:00", lat: 19.55143, lng: -99.19387 },
      { id: "ine-151952", nombre: "Módulo INE 151952 · Lago de Guadalupe", direccion: "Carretera Lago de Guadalupe s/n, C.C. Lago de Guadalupe local 18, San Pedro Barrientos, Tlalnepantla", horario: "Lun. a vie. 8:00–20:00 · Sáb. 8:00–15:00", lat: 19.57968, lng: -99.21224 },
    ],
  },

  /* ---------- 3. Pasaporte (SRE) ---------- */
  {
    id: "pasaporte",
    nombre: "Pasaporte ordinario para mayores de edad",
    nombreCorto: "Pasaporte",
    institucion: "SRE",
    institucionNombre: "Secretaría de Relaciones Exteriores",
    tipo: "presencial",
    claves: ["pasaporte", "sre", "viajar", "relaciones exteriores"],
    resumen:
      "Expedición o renovación de pasaporte mexicano en una oficina de pasaportes de la SRE. Requiere cuenta Llave MX, cita y pago de derechos.",
    costo: "3 años: $1,795 · 6 años: $2,440 · 10 años: $4,280",
    nota: "50 % de descuento para personas mayores de 60 años, con discapacidad y trabajadores agrícolas temporales México–Canadá.",
    requiereCita: "Sí, obligatoria",
    fuente: {
      tipo: "oficial-costo",
      sitio: "sre.gob.mx",
      explicacion: "El pago de derechos es oficial y obligatorio. La cita en el sitio de la SRE es gratuita: desconfía de quien venda citas o cobre por agendarlas.",
    },
    documentos: [
      { texto: "Documento que acredite tu nacionalidad", detalle: "Original. Por ejemplo, acta de nacimiento o carta de naturalización." },
      { texto: "Identificación oficial vigente", detalle: "Original. Por ejemplo, credencial para votar." },
      { texto: "Comprobante de pago de derechos", detalle: "Te llega por correo con la confirmación de tu cita.", aviso: "Págalo antes de la cita" },
      { texto: "Confirmación de la cita", detalle: "Impresa o en tu celular." },
    ],
    pasos: [
      { texto: "Crea tu cuenta Llave MX; es necesaria para agendar." },
      { texto: "Agenda tu cita en el sitio oficial de la SRE y llena el formulario de solicitud en línea.", enlace: "https://citas.sre.gob.mx/", etiquetaEnlace: "Citas SRE" },
      { texto: "Revisa tu correo: recibirás la confirmación con fecha, hora y la hoja para el pago de derechos." },
      { texto: "Realiza el pago y acude a tu cita con tus documentos originales y el comprobante." },
    ],
    fuentes: [
      { titulo: "SRE — Directorio: Oficina de pasaportes en Naucalpan", url: "https://portales.sre.gob.mx/directorio/index.php/delegaciones/delegacion-metropolitana-naucalpan" },
      { titulo: "ADN40 — Guía para sacar tu pasaporte por primera vez en 2026", url: "https://www.adn40.mx/mexico/2026-05-21/guia-paso-a-paso-para-sacar-tu-pasaporte-mexicano-por-primera-vez-en-2026/" },
      { titulo: "gob.mx — Pasaporte, preguntas frecuentes", url: "https://www.gob.mx/pasaporte" },
      { titulo: "SRE — Directorio de oficinas de pasaportes", url: "https://portales.sre.gob.mx/directorio/delegaciones" },
    ],
    errores: [
      { id: "p1", categoria: "Pago", titulo: "Pagué pero el pago no aparece", solucion: "Conserva tu comprobante bancario con línea de captura y preséntalo en la oficina." },
      { id: "p2", categoria: "Fuente", titulo: "Me ofrecieron cita en un sitio de paga", solucion: "La cita oficial es gratuita y solo se agenda en citas.sre.gob.mx, por teléfono o WhatsApp oficial de la SRE." },
    ],
    sedes: [
      { id: "sre-naucalpan", nombre: "Oficina de Pasaportes Naucalpan", direccion: "C.C. Forum, Av. 1° de Mayo 120, col. San Andrés Atoto, Naucalpan", horario: "Con cita", lat: 19.46552, lng: -99.22589 },
      { id: "sre-santafe", nombre: "Oficina de Pasaportes Santa Fe", direccion: "C.C. Samara Shops, Antonio Dovalí Jaime 70, Santa Fe, Álvaro Obregón", horario: "Con cita", lat: 19.36809, lng: -99.25908 },
      { id: "sre-gam", nombre: "Oficina de Pasaportes Gustavo A. Madero", direccion: "C.C. Parque Tepeyac, Calz. San Juan de Aragón 389, col. Granjas Modernas, GAM", horario: "Con cita", lat: 19.47755, lng: -99.09949 },
      { id: "sre-coyoacan", nombre: "Oficina de Pasaportes Coyoacán", direccion: "C.C. Punto MAQ, local S2-021, Miguel Ángel de Quevedo 1144, Coyoacán", horario: "Con cita", lat: 19.34296, lng: -99.14655 },
      { id: "sre-iztapalapa", nombre: "Oficina de Pasaportes Iztapalapa", direccion: "C.C. Parque Las Antenas, Periférico 3278, col. La Esperanza, Iztapalapa", horario: "Con cita", lat: 19.31421, lng: -99.07644 },
    ],
  },

  /* ---------- 4. Consulta IMSS sin cita ---------- */
  {
    id: "imss",
    nombre: "Consulta sin cita en Unidad de Medicina Familiar (unifila)",
    nombreCorto: "Consulta IMSS sin cita",
    institucion: "IMSS",
    institucionNombre: "Instituto Mexicano del Seguro Social",
    tipo: "presencial",
    claves: ["imss", "clinica", "umf", "consulta", "medico", "unifila", "seguro"],
    resumen:
      "Si no tienes cita, puedes pedir consulta el mismo día en tu Unidad de Medicina Familiar (UMF) por medio del módulo de unifila. Se atiende por orden de llegada.",
    costo: "Sin costo para derechohabientes",
    requiereCita: "No",
    fuente: {
      tipo: "oficial-gratuito",
      sitio: "imss.gob.mx",
      explicacion: "Es un servicio del IMSS para derechohabientes. No necesitas pagar a nadie para formarte ni para obtener ficha.",
    },
    documentos: [
      { texto: "Carnet de citas", detalle: "Lo presentas en tu consultorio para registrarte en la unifila." },
      { texto: "Identificación oficial", detalle: "Original." },
      { texto: "Número de Seguridad Social (NSS)", detalle: "Puede ser en tu celular." },
    ],
    pasos: [
      { texto: "Confirma cuál es tu UMF. Si no estás dado de alta, primero acude al área de Afiliación y Vigencia de Derechos.", enlace: "https://www.imss.gob.mx/", etiquetaEnlace: "IMSS" },
      { texto: "Llega temprano: la atención es por orden de llegada." },
      { texto: "Ubica la ventanilla de unifila (en la entrada o en el área de consultorios)." },
      { texto: "Presenta tu carnet y espera a que te llamen para asignarte consultorio." },
    ],
    fuentes: [
      { titulo: "IMSS — Atención en Unidades de Medicina Familiar", url: "https://www.imss.gob.mx/node/74264" },
      { titulo: "IMSS — Directorio de instalaciones", url: "https://www.imss.gob.mx/directorio" },
      { titulo: "UnoTV — Cómo sacar consulta sin cita en la unifila del IMSS", url: "https://www.unotv.com/nacional/como-sacar-consulta-sin-cita-en-la-unifila-del-imss-paso-a-paso/" },
    ],
    errores: [
      { id: "m1", categoria: "Sede", titulo: "Fui a una clínica que no es la mía", solucion: "Solo te atienden en la UMF que tienes asignada. Confírmala antes de ir." },
      { id: "m2", categoria: "Documentos", titulo: "No llevé mi carnet", solucion: "El carnet es lo que te piden para registrarte en la unifila. Llévalo siempre." },
    ],
    sedes: [
      { id: "umf-61", nombre: "UMF 61 Naucalpan", direccion: "Av. 16 de Septiembre esq. Jardín 39, col. San Bartolo Naucalpan", horario: "Lun. a vie. 8:00–16:00", lat: 19.47252, lng: -99.23174 },
      { id: "umf-97", nombre: "UMF 97 San Bartolo", direccion: "Av. Jardín esq. 16 de Septiembre s/n, col. San Bartolo Naucalpan", horario: "Consultar en imss.gob.mx", lat: 19.47473, lng: -99.23106 },
      { id: "umf-65", nombre: "UMF 65 Río Hondo", direccion: "Av. Huixquilucan 12, col. Buenavista, Naucalpan", horario: "Lun. a vie. 7:00–15:00", lat: 19.43618, lng: -99.25565 },
      { id: "umf-51", nombre: "UMF 51 Santa Mónica", direccion: "Av. Santa Mónica s/n, col. Santa Mónica", horario: "Lun. a vie. 8:00–16:00", lat: 19.51778, lng: -99.22163 },
      { id: "umf-58", nombre: "UMF 58 Las Margaritas", direccion: "Periférico Blvd. Manuel Ávila Camacho s/n, col. Las Margaritas, Tlalnepantla", horario: "Consultar en imss.gob.mx", lat: 19.53141, lng: -99.22243 },
      { id: "umf-63", nombre: "UMF 63 San Ildefonso", direccion: "Jaime Nuño 1, col. San Ildefonso, Nicolás Romero", horario: "Lun. a vie. 7:00–15:00", lat: 19.63625, lng: -99.29881 },
    ],
  },

  /* ---------- 5. Constancia de situación fiscal (en línea) ---------- */
  {
    id: "csf",
    nombre: "Constancia de situación fiscal",
    nombreCorto: "Constancia de situación fiscal",
    institucion: "SAT",
    institucionNombre: "Servicio de Administración Tributaria",
    tipo: "linea",
    claves: ["constancia", "situacion fiscal", "csf", "sat", "cedula fiscal", "rfc"],
    resumen:
      "Documento que muestra tu RFC, régimen fiscal y domicilio fiscal. Se genera en línea en el portal del SAT y te lo suelen pedir al entrar a un trabajo.",
    costo: "Sin costo",
    requiereCita: "No",
    fuente: {
      tipo: "oficial-gratuito",
      sitio: "sat.gob.mx",
      explicacion: "Se descarga gratis desde el portal del SAT. Hay páginas que cobran por «tramitarla»: no es necesario.",
    },
    documentos: [
      { texto: "RFC activo", detalle: "13 caracteres para persona física." },
      { texto: "Contraseña del SAT o e.firma", detalle: "Con e.firma necesitas tus archivos .cer y .key y la clave privada. Son claves distintas.", aviso: "Si no tienes ninguna, usa SAT ID o acude a una oficina" },
    ],
    pasos: [
      { texto: "Entra al portal oficial del SAT y busca «Genera tu Constancia de Situación Fiscal».", enlace: "https://www.sat.gob.mx/", etiquetaEnlace: "Portal del SAT" },
      { texto: "Elige cómo identificarte: contraseña o e.firma." },
      { texto: "Genera la constancia y descarga el PDF." },
    ],
    fuentes: [
      { titulo: "SAT — Portal oficial", url: "https://www.sat.gob.mx/" },
      { titulo: "Xataka México — Cómo sacar la constancia sin contraseña", url: "https://www.xataka.com.mx/basics/como-sacar-constancia-situacion-fiscal-sat-contrasena" },
    ],
    errores: [
      { id: "c1", categoria: "Portal", titulo: "La página se queda cargando", solucion: "Prueba otro navegador y permite ventanas emergentes para sat.gob.mx." },
      { id: "c2", categoria: "Contraseña", titulo: "No tengo contraseña ni e.firma", solucion: "Puedes solicitar tu constancia con SAT ID o en una oficina del SAT con identificación oficial." },
    ],
  },

  /* ---------- 6. Constancia de no deudor alimentario (en línea) ---------- */
  {
    id: "deudor",
    nombre: "Constancia de no deudor alimentario",
    nombreCorto: "No deudor alimentario",
    institucion: "Registro Civil",
    institucionNombre: "Registro Civil CDMX · DIF Nacional",
    tipo: "linea",
    claves: ["deudor", "alimentario", "no deudor", "constancia", "pension", "rnoa"],
    resumen:
      "Documento que demuestra que no estás inscrito como deudor de pensión alimenticia. Lo piden algunos empleos y trámites. Hay versión de la CDMX y un certificado nacional.",
    costo: "Sin costo en los sitios oficiales",
    requiereCita: "No",
    fuente: {
      tipo: "oficial-gratuito",
      sitio: ".gob.mx",
      explicacion: "Existen páginas de gestoría que cobran por obtenerla. Los sitios oficiales son gratuitos; verifica que la dirección termine en .gob.mx.",
    },
    comparacion: [
      { nombre: "Registro de Deudores Alimentarios · CDMX", url: "https://deudoresalimentarios.rcivil.cdmx.gob.mx/", tipo: "oficial-gratuito", nota: "Para la Ciudad de México. Requiere Llave CDMX." },
      { nombre: "Registro Nacional de Obligaciones Alimentarias · DIF", url: "https://rnoa.dif.gob.mx/", tipo: "oficial-gratuito", nota: "Certificado nacional. Se consulta con tu CURP." },
      { nombre: "Páginas de gestoría en línea", url: null, tipo: "no-oficial", nota: "Cobran por hacer el trámite por ti. No es necesario y no sustituyen al documento oficial." },
    ],
    documentos: [
      { texto: "CURP", detalle: "Para el certificado nacional." },
      { texto: "Llave CDMX", detalle: "Para la constancia de la Ciudad de México." },
      { texto: "Nombre completo y fecha de nacimiento", detalle: "Tal como aparecen en tu acta." },
    ],
    pasos: [
      { texto: "Decide cuál te piden: la de la CDMX o el certificado nacional." },
      { texto: "Para la CDMX: entra al Registro de Deudores Alimentarios e inicia sesión con Llave CDMX.", enlace: "https://deudoresalimentarios.rcivil.cdmx.gob.mx/", etiquetaEnlace: "Registro CDMX" },
      { texto: "Para el nacional: entra al RNOA, escribe tu CURP y resuelve el captcha.", enlace: "https://rnoa.dif.gob.mx/", etiquetaEnlace: "RNOA" },
      { texto: "Si no apareces en el registro, descarga tu constancia o certificado." },
    ],
    fuentes: [
      { titulo: "Posta — Constancia de no deudor alimentario en CDMX en línea", url: "https://www.posta.com.mx/cdmx/guia-paso-a-paso-para-obtener-la-constancia-de-no-deudor-alimentario-en-cdmx-completamente-en-linea/vl2102724" },
      { titulo: "El Imparcial — Certificado nacional (RNOA)", url: "https://www.elimparcial.com/mexico/2025/12/08/eres-deudor-alimentario-veracruz-te-negara-la-licencia-y-el-matrimonio-desde-ahora/" },
    ],
    errores: [
      { id: "d1", categoria: "Fuente", titulo: "Pagué en una página que no era oficial", solucion: "Antes de pagar, revisa que la dirección termine en .gob.mx. Los sitios oficiales no cobran." },
      { id: "d2", categoria: "Documentos", titulo: "No sabía si me pedían la de CDMX o la nacional", solucion: "Pregunta a quien te la pide. Si no lo saben, el certificado nacional del RNOA cubre todo el país." },
    ],
  },
];

/* Respuestas preparadas: SOLO se usan si Gemini no responde
   (sin internet o servicio saturado). */
const RESPUESTAS_CHAT = [
  { claves: ["usb", "memoria"], respuesta: "Sí. Para la e.firma debes llevar una memoria USB: ahí te entregan la copia de tu certificado. El SAT no la proporciona y sin ella no te pueden entregar tu e.firma.", fuente: "efirma" },
  { claves: ["pasaporte"], respuesta: "Para el pasaporte necesitas cuenta Llave MX, cita en citas.sre.gob.mx, un documento de nacionalidad, identificación oficial vigente y el pago de derechos. En 2026 cuesta $1,795 (3 años), $2,440 (6 años) o $4,280 (10 años).", fuente: "pasaporte" },
  { claves: ["deudor", "alimentari"], respuesta: "Hay dos opciones oficiales y gratuitas: la constancia de la CDMX (con Llave CDMX) y el certificado nacional del RNOA (con tu CURP). Las páginas de gestoría cobran por algo que puedes hacer tú.", fuente: "deudor" },
  { claves: ["ine", "credencial", "votar"], respuesta: "Para la credencial del INE necesitas tres documentos originales: acta de nacimiento, identificación con fotografía y comprobante de domicilio de no más de 3 meses.", fuente: "ine" },
  { claves: ["oficial", "falso", "fraude", "confiable", "gestor"], respuesta: "Los sitios oficiales del gobierno de México terminan en .gob.mx (el INE usa ine.mx). En cada trámite verás si la fuente es oficial y si tiene costo.", fuente: null },
  { claves: ["constancia", "situacion fiscal", "csf"], respuesta: "La constancia de situación fiscal se descarga gratis en sat.gob.mx con tu RFC y tu contraseña o e.firma. Si no tienes ninguna, puedes usar SAT ID.", fuente: "csf" },
  { claves: ["imss", "clinica", "unifila", "consulta"], respuesta: "Para consulta sin cita en tu UMF lleva tu carnet, identificación y NSS. Se atiende por orden de llegada en la ventanilla de unifila.", fuente: "imss" },
  { claves: ["cuesta", "costo", "precio", "pagar", "gratis"], respuesta: "La cita y el trámite de e.firma en el SAT no tienen costo. Si alguna página te cobra por la cita, no es un canal oficial.", fuente: "efirma" },
  { claves: ["dia", "hora", "cuando", "saturad", "fila", "gente", "libre"], respuesta: "El mejor momento para ir se calcula con los reportes de otras personas. Lo encuentras en la sección «Sedes cercanas y cuándo ir» de cada trámite presencial. Es una estimación, no un calendario en vivo.", fuente: null },
];
