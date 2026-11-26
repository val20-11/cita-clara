# Migración del catálogo de Cita Clara a Firestore

## Qué se incorpora

- `catalogo_tramites.json`: exportación íntegra de los seis trámites que estaban en `datos.js`.
- `scripts/cargar_catalogo.py`: carga o actualiza cada trámite en `catalogo_tramites/{id}` mediante Firebase Admin SDK.
- `scripts/requirements-catalogo.txt`: dependencia del script administrativo.
- `nube.js`: agrega `leerCatalogo()` para consultar la colección.
- `app.js`: intenta cargar el catálogo antes de dibujar la primera pantalla; si tarda más de cinco segundos muestra el respaldo y actualiza la pantalla cuando la lectura termina.
- `datos.js`: conserva el catálogo local como respaldo sin conexión; sus variables pasan a ser reasignables para aceptar la respuesta de Firestore.
- `firestore.rules`: permite leer `catalogo_tramites` públicamente, pero bloquea su escritura desde el navegador.

## Estructura en Firestore

Colección: `catalogo_tramites`.

ID de documento: el valor de `id` de cada trámite (`efirma`, `ine`, `pasaporte`, `imss`, `csf`, `deudor`).

Cada documento conserva los campos del objeto original y agrega:

- `orden`: posición de presentación.
- `fechaConsulta`: fecha declarada en el catálogo fuente.
- `versionCatalogo`: versión del formato del catálogo.
- `actualizadoEn`: marca de tiempo del servidor.

La interfaz descarta esos metadatos antes de utilizar cada trámite.

## Carga inicial o actualización

Ejecuta desde la raíz del repositorio, en una computadora de confianza:

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r scripts/requirements-catalogo.txt
```

Descarga una clave JSON de una cuenta de servicio autorizada para escribir en Firestore y guárdala **fuera del repositorio**. No la subas a GitHub ni la incluyas en el sitio web.

Configura las variables de entorno:

```bash
# macOS/Linux
export GOOGLE_APPLICATION_CREDENTIALS="/ruta/segura/service-account.json"
export FIREBASE_PROJECT_ID="cita-clara-fd1b4"

# PowerShell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\ruta\segura\service-account.json"
$env:FIREBASE_PROJECT_ID="cita-clara-fd1b4"
```

Ejecuta:

```bash
python scripts/cargar_catalogo.py --archivo catalogo_tramites.json
```

El script valida los seis objetos y hace upsert por ID. No elimina documentos adicionales. Revisa la consola y la colección en Firebase antes de continuar.

## Reglas y despliegue

El cambio de reglas es necesario para que el navegador pueda leer el catálogo. Las reglas mantienen denegada la escritura pública en `catalogo_tramites`; Firebase Admin SDK opera en un entorno confiable y no depende de esas reglas.

Después de revisar las reglas y probarlas en el emulador o proyecto de desarrollo, despliega únicamente las reglas:

```bash
firebase deploy --only firestore:rules
```

Después de cargar los seis documentos, publica los archivos del sitio:

```bash
firebase deploy --only hosting
```

No ejecutes el despliegue contra producción hasta que el responsable del proyecto autorice la operación.

## Verificación funcional

1. Confirma que existen exactamente los seis documentos esperados.
2. Abre la aplicación y revisa la consola del navegador: debe aparecer `Catálogo cargado desde Firestore: 6 trámites.`
3. Comprueba la búsqueda, modalidad, las seis fichas, documentos, pasos, fuentes, problemas y sedes.
4. En la pestaña Network, comprueba la lectura de `catalogo_tramites`.
5. Verifica que una escritura desde cliente a `catalogo_tramites` sea rechazada por las reglas.
6. Desconecta temporalmente la red y comprueba que se presenta el respaldo local.
7. Revisa que los reportes sigan leyéndose y que sus escrituras sigan pasando por el backend de Apps Script.

## Consideraciones

- La exportación JSON conserva literalmente el contenido del catálogo actual; no certifica que los requisitos, costos, horarios o direcciones sigan vigentes. La revisión contra fuentes oficiales es una tarea separada.
- `datos.js` permanece temporalmente como respaldo. Una vez validada la lectura desde Firestore y definida una política de disponibilidad sin conexión, puede decidirse si se elimina el respaldo.
- El `index.html` que compartiste carga `datos.js` antes de `app.js` (líneas 77–78), por lo que el orden requerido ya está correcto. Como las rutas son relativas (`src="datos.js"` y `src="app.js"`), estos tres archivos deben quedar en el mismo directorio que `index.html`. `app.js` importa `./nube.js`, que también debe quedar en ese directorio. No es necesario modificar `index.html` para esta migración.
