"""
sembrar_demo.py — Carga reportes de DEMOSTRACIÓN en Firestore.

Para qué: al inicio no hay reportes reales y todas las sedes dirían
"Sin reportes recientes". Este script agrega reportes de ejemplo con
patrones creíbles (por ejemplo: menos espera los martes por la mañana).
Todos llevan demo: true, y la página muestra la etiqueta
"Incluye reportes de demostración".

Las reglas (firestore.rules) bloquean escrituras desde el navegador, así que
este script usa una cuenta de servicio, igual que cargar_catalogo.py.

Uso:
  pip install -r scripts/requirements-catalogo.txt
  $env:GOOGLE_APPLICATION_CREDENTIALS="C:\\ruta\\segura\\service-account.json"   (PowerShell)
  python scripts/sembrar_demo.py
Para borrarlos: consola de Firebase > Firestore > borrar las colecciones.
"""
import json
import os
import random
import secrets
import sys
import urllib.request

from google.auth.transport.requests import Request
from google.oauth2 import service_account

PROYECTO = os.getenv("FIREBASE_PROJECT_ID", "cita-clara-fd1b4")
URL = f"https://firestore.googleapis.com/v1/projects/{PROYECTO}/databases/(default)/documents:commit"
BASE = f"projects/{PROYECTO}/databases/(default)/documents"

random.seed(2026)

# Espera base (minutos) de cada sede. Algunas sedes (ine-152451, sre-iztapalapa,
# umf-63) se dejan sin reportes a propósito para mostrar "Sin reportes recientes".
SEDES = {
    "efirma": {"sat-naucalpan": 35, "sat-tlalnepantla": 60, "sat-cuautitlan": 40,
               "sat-cdmx-norte": 55, "sat-cdmx-centro": 75, "sat-cdmx-oriente": 50},
    "ine": {"ine-152252": 45, "ine-152251": 25, "ine-151551": 35, "ine-151951": 55},
    "pasaporte": {"sre-naucalpan": 100, "sre-santafe": 80, "sre-gam": 120, "sre-coyoacan": 95},
    "imss": {"umf-61": 105, "umf-97": 90, "umf-65": 70, "umf-51": 100, "umf-58": 120},
}

# Uso:  python scripts/sembrar_demo.py                -> todas las sedes + problemas
#       python scripts/sembrar_demo.py sede1 sede2    -> solo la espera de esas sedes
import sys
SOLO = set(sys.argv[1:])

# Ajuste por día de la semana (1 = lunes ... 5 = viernes)
AJUSTE_DIA = {1: 25, 2: -15, 3: 0, 4: 5, 5: 15}


def minutos_a_opcion(m):
    """Convierte minutos a una de las 4 opciones del formulario."""
    if m < 30:
        return 15
    if m < 67:
        return 45
    if m < 120:
        return 90
    return 150


def espera(tramite, base, dia, hora):
    m = base + AJUSTE_DIA[dia]
    if tramite == "imss":
        m += 35 if hora < 12 else -45      # en la UMF la mañana está más llena
    elif dia == 2 and hora < 12:
        m -= 10                            # martes temprano, más tranquilo
    return max(5, m + random.gauss(0, 15))


def doc_espera(tramite, sede, minutos, dia, hora):
    return {
        "update": {
            "name": f"{BASE}/reportes_espera/demo-{secrets.token_hex(8)}",
            "fields": {
                "tramite": {"stringValue": tramite},
                "sede": {"stringValue": sede},
                "minutos": {"integerValue": str(minutos)},
                "dia": {"integerValue": str(dia)},
                "hora": {"integerValue": str(hora)},
                "demo": {"booleanValue": True},
            },
        },
        "updateTransforms": [{"fieldPath": "creado", "setToServerValue": "REQUEST_TIME"}],
        "currentDocument": {"exists": False},
    }


def doc_error(tramite, error):
    return {
        "update": {
            "name": f"{BASE}/reportes_error/demo-{secrets.token_hex(8)}",
            "fields": {
                "tramite": {"stringValue": tramite},
                "error": {"stringValue": error},
                "demo": {"booleanValue": True},
            },
        },
        "updateTransforms": [{"fieldPath": "creado", "setToServerValue": "REQUEST_TIME"}],
        "currentDocument": {"exists": False},
    }


escrituras = []
for tramite, sedes in SEDES.items():
    for sede, base in sedes.items():
        if SOLO and sede not in SOLO:
            continue
        for _ in range(random.randint(22, 32)):
            dia = random.randint(1, 5)
            hora = random.choice([8, 9, 10, 11, 12, 13, 14, 15, 16, 17])
            escrituras.append(doc_espera(tramite, sede, minutos_a_opcion(espera(tramite, base, dia, hora)), dia, hora))

ERRORES = {
    "efirma": {"e1": 12, "e2": 9, "e3": 5, "e4": 3},
    "ine": {"i1": 6, "i2": 4},
    "pasaporte": {"p1": 7, "p2": 6},
    "imss": {"m1": 5, "m2": 3},
    "csf": {"c1": 8, "c2": 6},
    "deudor": {"d1": 7, "d2": 4},
}
for tramite, errores in ({} if SOLO else ERRORES).items():
    for error, cantidad in errores.items():
        escrituras += [doc_error(tramite, error) for _ in range(cantidad)]

ruta_cred = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
if not ruta_cred:
    sys.exit("Define GOOGLE_APPLICATION_CREDENTIALS con la ruta a la cuenta de servicio.")
cred = service_account.Credentials.from_service_account_file(
    ruta_cred, scopes=["https://www.googleapis.com/auth/datastore"]
)
cred.refresh(Request())

peticion = urllib.request.Request(
    URL,
    data=json.dumps({"writes": escrituras}).encode(),
    headers={"Content-Type": "application/json", "Authorization": f"Bearer {cred.token}"},
)
with urllib.request.urlopen(peticion) as respuesta:
    resultado = json.load(respuesta)
print(f"Reportes de demostración guardados: {len(resultado.get('writeResults', []))}")
