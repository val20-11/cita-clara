# Cita Clara — Contexto del proyecto e indicaciones

## 1. Qué es esto
Proyecto final (30 %) de Temas Selectos de Computación: Computación en la Nube, FES Acatlán.
Hay que entregar:
- Una **plataforma web funcional** (MVP) publicada en la nube: https://cita-clara-fd1b4.web.app
- Un documento con la propuesta completa y el link público de la plataforma.
- Exposición de 5 minutos (exponen 2 integrantes, equipo de máximo 3).

Reglas clave del maestro:
- El maestro pide una solución conceptual; **el equipo decidió ir más allá y construir una página que funciona de verdad** (reportes guardados en base de datos, IA real), sin lanzarla al público para no generar costos.
- Se puede usar IA para generar el prototipo, **siempre que el equipo pueda explicar lo que construyó**.
- Debe alinearse con **Data, Machine Learning e IA en Google Cloud**.
- Preferentemente HTML, CSS y JavaScript.

Rúbrica (30 pts): problema y propuesta (5), MVP navegable y coherente (7), **al menos 5 servicios de Google Cloud** y su función en la arquitectura (7), alineación con Data/ML/IA (4), viabilidad e impacto (4), claridad de exposición (3).

## 2. Eje temático
**Servicios públicos** (transparencia, menor discrecionalidad, acceso equitativo a servicios).

## 3. Problema
Hacer un trámite en México es confuso:
- Los portales no dicen con claridad **qué documentos llevar** (ej.: para la e.firma del SAT hay que llevar una memoria USB; muchas personas no lo saben y tienen que regresar o buscar dónde imprimir).
- Los pasos están dispersos: hay que pasar por una página con texto largo donde el enlace importante está escondido.
- No queda claro **cuál es el sitio oficial y gratuito** frente a páginas de paga o intermediarios, ni si dos opciones son igual de válidas.
- Cuando algo falla (error de pago, pantalla que no avanza) no hay a dónde acudir.
- Quien va a una sede sin cita no sabe si ese día estará saturada.

Ya existen asistentes oficiales (Ventanilla 24/7 de gob.mx, el chatbot de WhatsApp del Gobierno de la CDMX, el chatbot MOVIMEX del Edomex). Cita Clara **no compite con ellos**: es una capa ciudadana que junta lo que los portales no explican (documentos reales, errores comunes, fuente oficial vs. no oficial y qué tan saturada suele estar cada sede).

## 4. Idea de la solución
Plataforma web donde la persona busca su trámite y recibe, en lenguaje simple:
1. **Checklist de documentos** marcable (qué llevar, en qué formato, cuántas copias, si hay que imprimir o llevar USB).
2. **Ruta paso a paso** con el enlace directo al sitio oficial.
3. **Etiqueta de fuente**: "Oficial gratuito", "Oficial con costo" o "Sitio no oficial / intermediario", con una explicación breve.
4. **Errores comunes** que reporta la gente y cómo resolverlos.
5. **Solo en trámites presenciales: sedes cercanas con semáforo de saturación y mejor día y hora para ir**, calculados con reportes de usuarios y un modelo de ML. Los trámites en línea se separan con un selector y no llevan esta parte.
6. **Asistente de chat** que responde dudas usando solo la información verificada de la plataforma.
7. **Panel de Data** para instituciones y para la exposición: qué trámites generan más dudas y qué errores se repiten más.

Público objetivo: jóvenes y adultos que hacen un trámite por primera vez, adultos mayores, personas que hacen trámites para un familiar.

## 5. Recorrido principal de la demo: cita del SAT (RFC / e.firma)
1. La persona entra y busca "RFC" o "e.firma".
2. Ve el resumen del trámite, si es gratuito y la etiqueta de fuente oficial.
3. Revisa el checklist (incluye "lleva una USB") y marca lo que ya tiene.
4. Ve el paso a paso con el enlace directo al portal oficial para sacar la cita.
5. Ve los módulos del SAT cercanos con semáforo de saturación y el mensaje "los martes por la mañana suelen estar más libres".
6. Revisa los errores comunes del trámite.
7. Al final, con un botón de un toque, reporta cómo le fue ("esperé 1 h 30 min").

## 6. De dónde sale la información (explicación para la exposición)
Hay tres tipos de información y cada uno tiene su origen:

**A) Información del trámite (documentos, pasos, costo, fuente oficial).**
- Es pública y cambia poco.
- En el MVP el equipo la captura a mano para solo 6 trámites.
- En una versión real, un proceso programado revisaría periódicamente las páginas oficiales, Gemini extraería los requisitos y, si detecta un cambio, avisaría a una persona para confirmarlo.
- Cada trámite muestra su **fecha de última verificación** y un botón "esto cambió".

**B) Reportes de usuarios (saturación y errores comunes).**
- Se capturan con formularios de un toque: "esperé X minutos", "me pasó este error".
- Los reportes llegan como mensajes pequeños (Pub/Sub) y se guardan en BigQuery.
- Se validan comparando varios reportes del mismo lugar y horario para filtrar datos falsos o extremos.

**C) Datos de las instituciones.** No se necesitan. Si en el futuro una institución quisiera conectar su calendario de citas, se haría mediante convenio.

**Límites que hay que reconocer en la exposición:**
- **No se ven los horarios de cita disponibles en tiempo real** de cada módulo: eso vive dentro del portal de la institución. Cita Clara ofrece una **estimación basada en reportes**, no un calendario en vivo.
- Hacer scraping de esos portales es frágil, puede exigir inicio de sesión y puede violar sus términos de uso, por lo que no es la base de la propuesta.
- **Al inicio hay pocos reportes.** Por eso se propone un **piloto** (pocos trámites, pocas sedes). Mientras no haya datos suficientes, la pantalla muestra "sin reportes recientes" y no inventa un semáforo.

## 7. Cómo "sabe" la plataforma cuáles son los errores comunes
- **Semilla inicial:** el equipo captura los errores que ya conoce (ej.: no avisan de la USB, error de pago que no deja cambiar el método, página que no avanza).
- **Reportes de usuarios:** cada persona puede tocar "me pasó esto" o describir su problema con texto libre.
- **Natural Language API** agrupa los textos parecidos y los clasifica por tema (pago, documentos, portal, sede). Así dos personas que lo explican distinto cuentan como el mismo error.
- Se muestran primero los errores con más reportes y la solución que ayudó a más gente.
- Una persona del equipo (o la institución) revisa las soluciones nuevas antes de publicarlas.

## 8. Cómo funciona la predicción de saturación (ML)
- **Qué predice:** minutos de espera, o semáforo (libre / medio / saturado), para un módulo, día y hora.
- **Datos de entrenamiento:** reportes de usuarios (módulo, trámite, día, hora, minutos de espera) y variables de contexto (inicio o fin de mes, periodos fiscales, días festivos).
- **Tipo de modelo:** aprendizaje supervisado. Regresión si predice minutos, clasificación si predice el semáforo.
- **En Google Cloud:** BigQuery ML entrena el modelo con SQL sobre los datos que ya están en BigQuery; Vertex AI sirve para un modelo más avanzado o para publicarlo.
- **Etapas, para ser honestos con pocos datos:** al inicio, promedios por día y hora; con más reportes, el modelo de ML que considera la época del mes y los festivos.
- En el MVP el modelo **no se entrena de verdad**: se simula con datos de ejemplo y se explica la arquitectura.

## 9. Servicios de Google Cloud (mínimo 5)
| Servicio | Para qué se usa |
|---|---|
| BigQuery | Catálogo verificado de trámites, reportes de usuarios y análisis para el panel |
| BigQuery ML / Vertex AI | Predicción de saturación por módulo, día y hora |
| Vertex AI (Gemini) | Asistente de chat que responde usando solo el catálogo (enfoque RAG) y explica en lenguaje simple; también apoya la revisión periódica de los requisitos |
| Natural Language API | Agrupa y clasifica los reportes de errores comunes |
| Pub/Sub | Recibe los reportes de usuarios como mensajes pequeños casi en tiempo real |
| Maps Platform | Muestra las sedes cercanas con su semáforo |
| Translation API | Interfaz en otros idiomas |
| Text-to-Speech | Lee en voz alta el checklist y los pasos (accesibilidad) |
| Looker Studio | Panel de transparencia: trámites con más dudas y errores |
| Firebase Hosting | Publicación del sitio (plan gratuito Spark) — **en funcionamiento** |
| Firestore | Base de datos de reportes ciudadanos — **en funcionamiento** |
| Gemini (Firebase AI Logic) | Asistente y clasificación de problemas — **en funcionamiento** |

(No se incluye revisión de documentos por foto: se descartó porque implica subir documentos personales y aporta poco frente al checklist.)

## 10. Pantallas de la plataforma
1. **Inicio:** buscador grande de trámites, **selector "En línea / Presencial"** y trámites populares.
2. **Resultado del trámite:** resumen, costo, etiqueta oficial/no oficial y fecha de última verificación. Los trámites en línea no muestran sedes ni semáforo; los presenciales sí.
3. **Checklist de documentos:** casillas marcables con avisos ("lleva USB", "imprime 2 copias").
4. **Paso a paso:** ruta numerada con enlace directo.
5. **Errores comunes:** lista ordenada por frecuencia, con solución y botón "me pasó esto".
6. **Sedes cercanas:** mapa o lista con semáforo, mejor día y hora, y botón "reportar cómo me fue". Si no hay reportes recientes, muestra "sin reportes recientes".
7. **Asistente:** responde con Gemini usando solo la información verificada.
8. **Panel de transparencia:** gráficas calculadas con los reportes reales.
9. **Reportar:** apartado con botones grandes para reportar espera o problemas; los textos libres los clasifica Gemini.

## 11. Trámites del piloto (6): en línea y presenciales
La plataforma separa los trámites en dos tipos, con un selector visible en el inicio: **"En línea"** y **"Presencial"**.

**En línea (2)**: aquí el valor es explicar los pasos, aclarar cuál es el sitio oficial y gratuito frente a los de paga, y reunir los errores comunes. No llevan semáforo de sedes porque no hay que ir a ningún lugar.
1. Constancia de no deudor alimentario (caso de ejemplo: hay un sitio de paga y otro gratuito del gobierno, y no queda claro si los dos son válidos).
2. Constancia de situación fiscal (SAT).

**Presencial (4)**: aquí se suma el checklist de qué llevar, las sedes cercanas y el semáforo de saturación con mejor día y hora.
3. Inscripción al RFC / e.firma (cita en módulo del SAT). **Es el recorrido principal.**
4. Credencial para votar (INE): cita en módulo.
5. Pasaporte (SRE): cita en oficina de enlace.
6. Trámite en clínica del IMSS sin cita (unifila en la UMF): qué documentos llevar y en qué horarios suele haber más gente.

Por qué esta mezcla: los trámites en línea son fáciles de implementar (solo se consulta información pública) y los presenciales son donde más aporta la predicción de saturación. Se dejaron fuera trámites que cambian según el estado (licencia de conducir, placas) para no depender de una entidad en particular; podrían entrar en una segunda fase.

**Todo el contenido es un ejemplo ilustrativo, por validar con fuentes oficiales** (incluido si cada trámite requiere cita). No inventar costos, requisitos ni horarios como si fueran reales: marcarlos visiblemente en la maqueta como "dato de ejemplo".

## 12. Indicaciones técnicas para Claude Code
- Una sola página o pocas páginas en **HTML, CSS y JavaScript puro**. Sin frameworks ni build, para que sea fácil de explicar.
- **Debe funcionar de verdad, como un sitio real** (no maqueta ni presentación de una idea): sin textos tipo "piloto", "simulado" o "arquitectura propuesta" dentro de la página. La arquitectura y lo propuesto se explican en la exposición y en `EXPLICACION.md`.
- El catálogo de trámites vive en `datos.js`; los reportes, en Firestore; el asistente y la clasificación usan Gemini. Los reportes de prueba se marcan con `demo: true`.
- **No usar Cloud Functions ni nada que pida tarjeta**, para quedarnos en el plan gratuito de Firebase. Se despliega en Firebase Hosting.
- Mapa interactivo real (Leaflet + mapa base de Esri) con unas 6 sedes reales por trámite presencial y botón "Abrir en Google Maps". Google Maps Platform se deja fuera porque pide tarjeta.
- Diseño responsive (celular primero), con **alto contraste, letra grande, navegación por teclado y etiquetas accesibles**.
- Apariencia limpia y amable, que se vea como plataforma real. Paleta sobria con un color de acento.
- No pedir ni guardar datos personales reales.
- Código comentado en español, en bloques cortos.

## 13. Lo que Claude Code debe entregar además del código
Como el maestro exige que podamos explicar lo que construimos:
1. `EXPLICACION.md` con:
   - qué hace cada archivo y cada función importante;
   - una tabla **"qué es simulado en la maqueta" vs "qué haría el servicio real de Google Cloud"**, pantalla por pantalla;
   - un diagrama sencillo (Mermaid) de la arquitectura conceptual.
2. Un guion de exposición de **5 minutos**, dividido entre 2 personas, siguiendo los puntos de la rúbrica.
3. Una lista de 8 preguntas difíciles que puede hacer el maestro, con respuesta. Incluir al menos: "¿de dónde sacan los datos?", "¿qué la hace distinta a Ventanilla 24/7?", "¿cómo evitan reportes falsos?", "¿qué pasa si nadie reporta?", "¿se podría llevar a la realidad?", "¿cómo mantienen actualizada la información?".
4. Pasos para publicar en Firebase Hosting (plan Spark) y obtener el link público.

## 14. Contenido del documento de propuesta (para el SEA)
Nombre de la plataforma · problema · eje temático · cómo usa Data, ML e IA · público objetivo · cómo funcionaría · servicios de nube y justificación · herramientas de IA/APIs · beneficio social · maqueta MVP · link público.

## 15. Pendientes del equipo
- Confirmar con el maestro que se acepta una plataforma para varios trámites con piloto en pocos.
- Verificar con fuentes oficiales los requisitos reales de los trámites antes de presentarlos.
- Revisar si Google Maps ya muestra afluencia en las sedes del piloto, por si preguntan.
- Confirmar que los trámites presenciales elegidos (SAT, INE, pasaporte) sí funcionan con cita y revisar cómo es el trámite sin cita en la UMF.
- Decidir el nombre final.
