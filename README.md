# Cita Clara

Plataforma ciudadana de orientación sobre trámites (proyecto de Computación en la Nube, FES Acatlán).

**Sitio publicado:** https://cita-clara-fd1b4.web.app

## Documentos del proyecto
- `CONTEXTO_CITA_CLARA.md`: contexto, problema y requisitos del proyecto.
- `EXPLICACION.md`: qué hace cada archivo, qué es real y qué es propuesto, y la arquitectura.


## Estructura
```
public/          Página web (lo que se publica)
  index.html     Estructura de la página
  styles.css     Estilos generales
  tramite.css    Estilos de la página de trámite
  datos.js       Catálogo de los 6 trámites
  app.js         Pantallas y lógica
  nube.js        Conexión con Firestore y Gemini
firestore.rules  Reglas de seguridad de la base de datos
scripts/         Script para cargar reportes de demostración
```

## Cómo trabajar en equipo

1. **Bajar el proyecto** (solo la primera vez):
   ```
   git clone https://github.com/val20-11/cita-clara.git
   cd cita-clara
   ```
2. **Antes de empezar a editar**, trae lo último:
   ```
   git pull
   ```
3. **Probar en tu computadora**:
   ```
   npm install -g firebase-tools   # solo la primera vez
   firebase serve
   ```
   Abre http://localhost:5000
4. **Guardar y subir tus cambios**:
   ```
   git add .
   git commit -m "Describe brevemente qué cambiaste"
   git push
   ```
5. **Publicar en el sitio** (necesitas acceso al proyecto de Firebase):
   ```
   firebase login
   firebase deploy
   ```

Recomendación: avisen en el grupo antes de publicar, para no pisarse los cambios.
