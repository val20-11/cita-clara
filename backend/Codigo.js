function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    const accion = body.accion;

    let resultado;
    switch (accion) {
      case 'reportarEspera':
        resultado = manejarReportarEspera(body);
        break;
      case 'reportarProblema':
        resultado = manejarReportarProblema(body);
        break;
      case 'preguntar':
        resultado = manejarPreguntar(body);
        break;
      case 'avisarCambio':
        resultado = manejarAvisarCambio(body);
        break;
      default:
        return responderJSON({ ok: false, error: 'Acción no válida: ' + accion });
    }

    return responderJSON({ ok: true, data: resultado });
  } catch (err) {
    return responderJSON({ ok: false, error: err.message });
  }
}

function responderJSON(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getProps() {
  const props = PropertiesService.getScriptProperties();
  return {
    projectId: props.getProperty('GCP_PROJECT_ID'),
    saEmail: props.getProperty('SA_CLIENT_EMAIL'),
    saKey: (props.getProperty('SA_PRIVATE_KEY') || '').replace(/\\n/g, '\n'),
    geminiKey: props.getProperty('GEMINI_API_KEY'),
    correosEquipo: props.getProperty('CORREOS_EQUIPO')
  };
}

// --- 1. Reportar tiempo de espera ---
function manejarReportarEspera(body) {
  const { tramiteId, sede, minutos, comentario } = body;
  if (!tramiteId || minutos === undefined) {
    throw new Error('Faltan tramiteId o minutos');
  }
  return guardarEnFirestore('reportes_espera', {
    tramiteId: String(tramiteId),
    sede: String(sede || 'General'),
    minutos: Number(minutos),
    comentario: String(comentario || ''),
    creadoEn: new Date().toISOString()
  });
}

// --- 2. Reportar problema ---
function manejarReportarProblema(body) {
  const { tramiteId, descripcion, detalle } = body;
  if (!tramiteId || !descripcion) {
    throw new Error('Faltan tramiteId o descripcion');
  }
  return guardarEnFirestore('reportes_problemas', {
    tramiteId: String(tramiteId),
    descripcion: String(descripcion),
    detalle: String(detalle || ''),
    creadoEn: new Date().toISOString()
  });
}

// --- 3. Preguntar a Gemini ---
function manejarPreguntar(body) {
  const { pregunta, contextoTramite } = body;
  if (!pregunta) {
    throw new Error('Falta la pregunta');
  }
  const { geminiKey } = getProps();
  if (!geminiKey) {
    throw new Error('GEMINI_API_KEY no configurada');
  }

  const prompt =
    'Eres un asistente de orientación sobre trámites en México para la plataforma Cita Clara. ' +
    'Responde de forma clara, breve y directa.\n' +
    (contextoTramite ? 'Contexto del trámite:\n' + JSON.stringify(contextoTramite) + '\n' : '') +
    'Pregunta del usuario: ' + pregunta;

  const respuesta = llamarGemini(geminiKey, prompt);
  return { respuesta: respuesta };
}

// --- 4. Avisar cambio ("Esto cambió") ---
function manejarAvisarCambio(body) {
  const { tramiteId, nombreTramite, detalle } = body;
  if (!tramiteId) {
    throw new Error('Falta tramiteId');
  }

  const guardado = guardarEnFirestore('avisos_cambio', {
    tramiteId: String(tramiteId),
    nombreTramite: String(nombreTramite || tramiteId),
    detalle: String(detalle || 'El usuario reportó un cambio sin detalle adicional.'),
    creadoEn: new Date().toISOString()
  });

  const { correosEquipo } = getProps();
  if (correosEquipo) {
    MailApp.sendEmail({
      to: correosEquipo,
      subject: '[Cita Clara] Reporte de cambio en trámite: ' + (nombreTramite || tramiteId),
      body:
        'Un usuario presionó "Esto cambió" en Cita Clara.\n\n' +
        'Trámite ID: ' + tramiteId + '\n' +
        'Nombre: ' + (nombreTramite || 'No especificado') + '\n' +
        'Detalle: ' + (detalle || 'Sin detalle adicional') + '\n' +
        'Fecha: ' + new Date().toLocaleString('es-MX')
    });
  }

  return guardado;
}

// --- 5. Revisión semanal de requisitos (Trigger programado) ---
function revisionSemanalRequisitos() {
  const { geminiKey, correosEquipo } = getProps();
  if (!geminiKey || !correosEquipo) {
    throw new Error('Faltan GEMINI_API_KEY o CORREOS_EQUIPO');
  }

  const tramites = leerColeccionFirestore('tramites');
  if (!tramites.length) return;

  const prompt =
    'Revisa la siguiente lista de trámites registrados en Cita Clara y señala si detectas ' +
    'requisitos desactualizados, costos cambiados o inconsistencias evidentes en México para 2026. ' +
    'Si todo parece vigente y sin cambios relevantes, responde exactamente: SIN_CAMBIOS.\n\n' +
    JSON.stringify(tramites);

  const analisis = llamarGemini(geminiKey, prompt);
  if (analisis.trim() !== 'SIN_CAMBIOS') {
    MailApp.sendEmail({
      to: correosEquipo,
      subject: '[Cita Clara] Revisión semanal: posibles cambios en requisitos',
      body: 'Resultado de la revisión semanal con Gemini:\n\n' + analisis
    });
  }
}

// --- Helpers de Gemini y Firestore REST API ---
function llamarGemini(apiKey, prompt) {
  const url =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=' +
    encodeURIComponent(apiKey);

  const maxIntentos = 2;
  for (let intento = 1; intento <= maxIntentos; intento++) {
    const res = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      }),
      muteHttpExceptions: true
    });

    const data = JSON.parse(res.getContentText());
    if (res.getResponseCode() === 200) {
      return data.candidates[0].content.parts[0].text;
    }

    const msg = data.error ? data.error.message : res.getContentText();
    const esSaturacion = /high demand|overloaded|unavailable/i.test(msg);
    if (!esSaturacion || intento === maxIntentos) {
      throw new Error('Error Gemini: ' + msg);
    }
    Utilities.sleep(1500);
  }
}

function obtenerTokenFirestore() {
  const { saEmail, saKey } = getProps();
  if (!saEmail || !saKey || !saKey.includes('BEGIN PRIVATE KEY')) {
    throw new Error('Falta configurar SA_PRIVATE_KEY válida de la cuenta de servicio');
  }

  const ahora = Math.floor(Date.now() / 1000);
  const header = Utilities.base64EncodeWebSafe(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = Utilities.base64EncodeWebSafe(JSON.stringify({
    iss: saEmail,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    exp: ahora + 3600,
    iat: ahora
  }));

  const firmaBytes = Utilities.computeRsaSha256Signature(header + '.' + claim, saKey);
  const jwt = header + '.' + claim + '.' + Utilities.base64EncodeWebSafe(firmaBytes);

  const res = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
    method: 'post',
    payload: {
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    }
  });

  return JSON.parse(res.getContentText()).access_token;
}

function guardarEnFirestore(coleccion, datos) {
  const { projectId } = getProps();
  const token = obtenerTokenFirestore();
  const url =
    'https://firestore.googleapis.com/v1/projects/' +
    projectId +
    '/databases/(default)/documents/' +
    coleccion;

  const fields = {};
  Object.keys(datos).forEach(function (k) {
    const val = datos[k];
    if (typeof val === 'number') {
      fields[k] = Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
    } else {
      fields[k] = { stringValue: String(val) };
    }
  });

  const res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify({ fields: fields }),
    muteHttpExceptions: true
  });

  if (res.getResponseCode() >= 300) {
    throw new Error('Error Firestore (' + res.getResponseCode() + '): ' + res.getContentText());
  }
  return JSON.parse(res.getContentText());
}

function leerColeccionFirestore(coleccion) {
  const { projectId } = getProps();
  const token = obtenerTokenFirestore();
  const url =
    'https://firestore.googleapis.com/v1/projects/' +
    projectId +
    '/databases/(default)/documents/' +
    coleccion;

  const res = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: { Authorization: 'Bearer ' + token },
    muteHttpExceptions: true
  });

  if (res.getResponseCode() >= 300) return [];
  const data = JSON.parse(res.getContentText());
  return data.documents || [];
}