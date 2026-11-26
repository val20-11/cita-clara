#!/usr/bin/env python3
"""Carga/actualiza el catálogo JSON en Firestore usando Firebase Admin SDK.

Uso desde la raíz del repositorio:
  pip install -r scripts/requirements-catalogo.txt
  export GOOGLE_APPLICATION_CREDENTIALS="/ruta/segura/service-account.json"
  export FIREBASE_PROJECT_ID="cita-clara-fd1b4"
  python scripts/cargar_catalogo.py --archivo catalogo_tramites.json

El script hace upsert por ID. No elimina documentos de Firestore que no estén
presentes en el JSON, para evitar borrados accidentales.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any

import firebase_admin
from firebase_admin import credentials, firestore

COLLECTION = "catalogo_tramites"
CAMPOS_OBLIGATORIOS = {
    "id", "nombre", "nombreCorto", "institucion", "institucionNombre",
    "tipo", "claves", "resumen", "costo", "requiereCita", "fuente",
    "documentos", "pasos", "fuentes", "errores",
}


def validar_catalogo(payload: dict[str, Any]) -> tuple[str, list[dict[str, Any]]]:
    fecha = payload.get("fechaConsulta")
    tramites = payload.get("tramites")
    if not isinstance(fecha, str) or not fecha:
        raise ValueError("El JSON debe incluir fechaConsulta como texto.")
    if not isinstance(tramites, list) or not tramites:
        raise ValueError("El JSON debe incluir una lista no vacía en tramites.")

    ids: set[str] = set()
    for posicion, tramite in enumerate(tramites, start=1):
        if not isinstance(tramite, dict):
            raise ValueError(f"El trámite {posicion} no es un objeto JSON.")
        faltantes = CAMPOS_OBLIGATORIOS - tramite.keys()
        if faltantes:
            raise ValueError(f"Trámite {posicion}: faltan campos {sorted(faltantes)}.")
        identificador = tramite["id"]
        if not isinstance(identificador, str) or not identificador.strip():
            raise ValueError(f"Trámite {posicion}: ID inválido.")
        if identificador in ids:
            raise ValueError(f"ID duplicado: {identificador}.")
        ids.add(identificador)
        if tramite["tipo"] not in {"presencial", "linea"}:
            raise ValueError(f"{identificador}: tipo debe ser presencial o linea.")
        for campo in ("documentos", "pasos", "fuentes", "errores"):
            if not isinstance(tramite[campo], list):
                raise ValueError(f"{identificador}: {campo} debe ser una lista.")

    return fecha, tramites


def main() -> int:
    parser = argparse.ArgumentParser(description="Carga el catálogo de Cita Clara en Firestore.")
    parser.add_argument(
        "--archivo", default="catalogo_tramites.json",
        help="Ruta al JSON del catálogo (por defecto: catalogo_tramites.json).",
    )
    args = parser.parse_args()

    ruta = Path(args.archivo).expanduser().resolve()
    if not ruta.is_file():
        print(f"No existe el archivo: {ruta}", file=sys.stderr)
        return 1

    try:
        payload = json.loads(ruta.read_text(encoding="utf-8"))
        fecha, tramites = validar_catalogo(payload)
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        print(f"Catálogo inválido: {exc}", file=sys.stderr)
        return 1

    project_id = os.getenv("FIREBASE_PROJECT_ID", "cita-clara-fd1b4")
    cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if not cred_path:
        print(
            "Define GOOGLE_APPLICATION_CREDENTIALS con la ruta local a una cuenta de servicio "
            "autorizada para escribir en Firestore.",
            file=sys.stderr,
        )
        return 1

    try:
        cred = credentials.Certificate(cred_path)
        try:
            firebase_admin.get_app()
        except ValueError:
            firebase_admin.initialize_app(cred, {"projectId": project_id})

        db = firestore.client()
        batch = db.batch()
        coleccion = db.collection(COLLECTION)
        for orden, tramite in enumerate(tramites, start=1):
            documento = {
                **tramite,
                "orden": orden,
                "fechaConsulta": fecha,
                "versionCatalogo": 1,
                "actualizadoEn": firestore.SERVER_TIMESTAMP,
            }
            batch.set(coleccion.document(tramite["id"]), documento, merge=False)
        batch.commit()
    except Exception as exc:  # muestra el error del SDK sin imprimir credenciales
        print(f"No se pudo escribir en Firestore: {exc}", file=sys.stderr)
        return 1

    print(f"Carga completada: {len(tramites)} trámites en '{COLLECTION}'.")
    print(f"Fecha de consulta del catálogo: {fecha}.")
    print("Operación upsert; no se eliminaron documentos adicionales.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
