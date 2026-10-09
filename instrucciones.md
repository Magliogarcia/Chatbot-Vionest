# PROYECTO: CHATBOT INTERNO DE VIONEST

## 1. Objetivo general

Desarrolla una aplicación web local para el personal autorizado de Vionest que permita consultar información de clientes mediante preguntas en lenguaje natural en español.

El chatbot debe conectarse a la base de datos MongoDB existente, interpretar las preguntas mediante la API de Google Gemini y responder utilizando exclusivamente información recuperada y verificada en la base de datos.

No construyas una demostración con datos ficticios ni reemplaces la base de datos actual. Implementa una aplicación funcional, conectada a los datos reales, con autenticación, historial de conversaciones, búsquedas, manejo de coincidencias y una interfaz profesional.

Trabaja dentro de la carpeta del proyecto existente. Antes de crear, modificar o eliminar archivos, inspecciona el contenido del proyecto y conserva los recursos útiles que ya existan.

## 2. Skill de diseño obligatoria

Existe una skill UI UX Pro Max instalada localmente en:

`C:\Users\PCWORLD\3D Objects\Chat Bot\.agents\skills\ui-ux-pro-max\`

Su archivo principal es:

`C:\Users\PCWORLD\3D Objects\Chat Bot\.agents\skills\ui-ux-pro-max\SKILL.md`

Antes de diseñar o programar la interfaz:

1. Lee las instrucciones de `SKILL.md`.
2. Inspecciona las referencias, catálogos y scripts pertinentes de la skill.
3. Utiliza sus recomendaciones y recursos para establecer un sistema visual coherente.
4. Aplica las directrices relevantes de experiencia de usuario, accesibilidad, tipografía, colores, espaciado, componentes, estados interactivos y rendimiento.
5. Adapta las recomendaciones al stack tecnológico seleccionado.
6. Valida la interfaz final y corrige los problemas encontrados.

No omitas esta skill ni sustituyas sus directrices por un diseño genérico. No afirmes que ejecutaste scripts o pruebas de la skill si no lo hiciste.

## 3. Stack tecnológico

Utiliza, salvo que la inspección del proyecto justifique una alternativa compatible:

- Frontend: React con Vite.
- Estilos: Tailwind CSS.
- Backend: Node.js con Express.
- Base de datos: MongoDB.
- Modelo de lenguaje: Google Gemini mediante la API de Google AI Studio.
- Validación de datos y solicitudes: una biblioteca adecuada para el stack elegido.
- Autenticación: sesiones seguras o tokens almacenados de manera segura, preferiblemente mediante cookies `HttpOnly`, `Secure` cuando corresponda y `SameSite`.
- Pruebas: herramientas compatibles con el proyecto para comprobar las funcionalidades principales.

Mantén una separación clara entre frontend, backend, acceso a datos, autenticación, lógica de conversación e integración con Gemini.

No conectes el navegador directamente a MongoDB ni a Google Gemini. Las credenciales y todas las operaciones sensibles deben permanecer en el backend.

## 4. Conexión a MongoDB

La instancia existente está instalada localmente y actualmente no utiliza usuario ni contraseña de MongoDB.

Configuración conocida:

- Host: `127.0.0.1`
- Puerto: `27017`
- Base de datos: `vionest`
- Colección principal: `clientes`
- Colección auxiliar: `clientes_telefonos_verificacion`

La conexión inicial será local, exclusivamente desde esta computadora.

Utiliza variables de entorno para configurar la conexión. No publiques la aplicación en Internet ni expongas MongoDB a redes externas.

Antes de implementar el acceso a datos, verifica la conectividad y la estructura real de ambas colecciones. No recrees, elimines, renombres, importes nuevamente ni modifiques los registros existentes.

### Colección `clientes`

Los documentos contienen campos como los siguientes:

- `_id`
- `Estatus actual`
- `Escuadrón Asignado`
- `Nombre de la Empresa`
- `Número telefónico`
- `instagram`
- `Correo electrónico`
- `Contacto Principal`
- `Ubicación exacta`
- `Investigador Asignado`
- `URL Investigación Rastreador`
- `URL Análisis del Cliente`
- `Desarrollador Asignado`
- `URL Demo`
- `URL Repositorio`
- `Fecha Primer Contacto`
- `Fecha Re-Contacto`
- `Discovery`
- `Fecha de Cita`
- `Feedback Llamada`
- `Halcón Asignado`
- `Feedback de la cita`
- `Tipo de Desarrollo`
- `Plan activo`
- `Fecha de Firma`
- `URL Contrato`
- `URL Cronograma`
- `URL Desarrollo`
- `Fecha de Desactivación`
- `Motivo`
- `Observaciones`
- `Teléfono Limpio (Búsqueda)`
- `Estatus de Teléfono`

La lista anterior es orientativa y corresponde a la estructura conocida. Verifica los campos reales en MongoDB antes de utilizarlos y contempla cualquier otro campo que efectivamente exista.

Ejemplo de documento conocido:

- Empresa: Academia de idiomas Let's Talk
- Teléfono: 0414-4006888
- Estatus actual: No interesado
- Escuadrón Asignado: Escuadrón 2 (Cóndor)
- Contacto Principal: Oriana
- Investigador Asignado: Ada

Este ejemplo sirve para entender la estructura; no lo codifiques como un registro fijo ni como una respuesta predefinida.

### Colección `clientes_telefonos_verificacion`

Los campos conocidos son:

- `_id`
- `Nombre / Empresa`
- `numero`
- `En maestro`

Utiliza esta colección para verificar la presencia de números telefónicos cuando la pregunta o la consulta lo requiera.

La verificación debe distinguir entre:
- Número encontrado en la colección auxiliar.
- Número encontrado en el maestro de clientes.
- Coincidencia en ambas colecciones.
- Número no encontrado.
- Resultado indeterminado por falta de información o error de consulta.

No afirmes que un número es válido, pertenece actualmente a una empresa o fue verificado por una fuente externa si la base de datos no respalda esa conclusión.

Si los valores de `En maestro` tienen formatos diferentes, inspecciona los datos reales y adapta la interpretación a sus valores, sin inventar una semántica.

## 5. Política de acceso y protección de datos

La versión inicial del chatbot será de solo lectura respecto a los datos de clientes.

Está prohibido que el chatbot:
- Inserte nuevos clientes.
- Edite datos existentes.
- Elimine registros.
- Cambie estatus, escuadrones, asignaciones o fechas.
- Ejecute operaciones de escritura arbitrarias.
- Permita que el modelo genere y ejecute comandos MongoDB sin validación.

Implementa una capa de acceso a datos con consultas explícitas, validadas y controladas por el backend.

No aceptes nombres de colecciones, operadores MongoDB, pipelines ni consultas arbitrarias enviados por el modelo o por el usuario.

No devuelvas todos los documentos ni todos los campos si la pregunta requiere solamente una parte de la información.

Cuando sea viable, configura un usuario de base de datos con permisos de solo lectura para las colecciones de clientes. Si esto requiere modificar la configuración local de MongoDB, no lo hagas automáticamente: documenta el procedimiento y solicita autorización antes de cambiar la configuración de la instancia.

La colección del historial y las colecciones necesarias para autenticación deben gestionarse de forma separada y con permisos limitados.

## 6. Autenticación y cuentas de empleados

La aplicación es exclusivamente para personal autorizado de Vionest.

Implementa:
- Pantalla de inicio de sesión.
- Cierre de sesión.
- Sesiones individuales.
- Protección de todas las rutas privadas.
- Creación de cuentas únicamente por el administrador autorizado.
- Contraseñas almacenadas mediante un algoritmo de hash seguro.
- Validación de entradas y limitación de intentos de inicio de sesión.
- Manejo seguro de sesiones, cookies y errores de autenticación.

No implementes registro público abierto.

El primer usuario de prueba tendrá el nombre de usuario `admin` y la contraseña inicial `123`, exclusivamente para el entorno local de desarrollo. No almacenes la contraseña en texto plano, no la incluyas en el código fuente y no la publiques en el repositorio.

Inicializa esta cuenta mediante un procedimiento de configuración o script de seed seguro, con las credenciales obtenidas de variables de entorno. El sistema debe exigir el cambio de la contraseña temporal antes de utilizar la aplicación fuera del entorno de prueba.

No inventes credenciales adicionales.

Deja preparada una arquitectura que permita añadir posteriormente roles y permisos administrativos más avanzados, sin implementar capacidades de edición de clientes en esta primera versión.

## 7. Integración con Google AI Studio y Gemini

Ya existe una cuenta de Google AI Studio, pero todavía es necesario crear la API key.

La implementación debe incluir instrucciones claras para crear la clave y configurarla localmente.

Requisitos:

1. Selecciona un modelo Gemini compatible con la API y disponible en el nivel gratuito vigente al momento de la implementación.
2. Verifica el identificador real del modelo y las condiciones aplicables. No inventes nombres de modelos ni prometas disponibilidad o uso gratuito ilimitado.
3. Lee la clave desde una variable de entorno del backend, por ejemplo `GEMINI_API_KEY`.
4. Lee el identificador del modelo desde otra variable de entorno, por ejemplo `GEMINI_MODEL`.
5. Incluye un archivo `.env.example` sin credenciales reales.
6. Asegúrate de que `.env` esté excluido de Git.
7. No muestres la API key en el frontend, el historial, las respuestas de error ni los registros de depuración.
8. Maneja errores de conexión, cuotas agotadas, límites de solicitudes, respuestas inválidas y modelos no disponibles.
9. Evita realizar llamadas innecesarias a Gemini cuando una consulta pueda resolverse de forma determinista.
10. No envíes al modelo más datos personales de los necesarios para resolver la consulta.

Gemini debe servir para interpretar preguntas en español, identificar la intención, ayudar a extraer los parámetros de búsqueda y redactar respuestas naturales. No debe actuar como fuente independiente de datos sobre los clientes.

La información factual debe provenir de MongoDB. Si no existe evidencia suficiente, el chatbot debe indicarlo claramente.

## 8. Funcionamiento conversacional

La interfaz y las respuestas serán exclusivamente en español.

El empleado debe poder escribir preguntas como:

- ¿Qué información tenemos de Academia de idiomas Let's Talk?
- ¿Cuál es el teléfono de esa empresa?
- ¿Qué empresas están asignadas al Escuadrón 2?
- ¿Qué clientes tienen estatus No interesado?
- ¿Quién es el investigador asignado a este cliente?
- ¿Hay un número registrado para esta empresa en la colección de verificación?
- ¿Cuándo fue el primer contacto?
- ¿Qué observaciones tenemos de ese cliente?
- Muéstrame el enlace de su demo.
- ¿Qué información tenemos sobre su último contacto registrado?

Estas preguntas son ejemplos de capacidades esperadas, no respuestas fijas. El chatbot debe recuperar los datos reales antes de contestar.

Debe admitir consultas por:
- Nombre de empresa.
- Número telefónico.
- Estatus.
- Escuadrón.
- Contacto principal.
- Investigador o desarrollador asignado.
- Fechas.
- Otros campos reales de ambas colecciones, cuando la pregunta lo justifique.

Debe interpretar referencias a clientes mencionados previamente dentro de la misma conversación, siempre que la identidad del cliente esté suficientemente determinada.

Si el contexto es ambiguo, pregunta al empleado antes de asumir a qué empresa se refiere.

## 9. Búsqueda aproximada y coincidencias múltiples

Implementa búsqueda exacta y búsqueda aproximada de nombres para tolerar:
- Errores tipográficos.
- Diferencias entre mayúsculas y minúsculas.
- Espacios adicionales.
- Variaciones razonables en la escritura.
- Diferencias menores de puntuación o acentuación.

Respeta las limitaciones de los índices existentes y evalúa un mecanismo de búsqueda aproximada apropiado sin eliminar ni reconstruir los índices actuales innecesariamente.

Cuando varias empresas coincidan razonablemente con la búsqueda:
1. Presenta una lista numerada con las posibles coincidencias.
2. Incluye solamente información mínima para diferenciarlas, como nombre y, cuando resulte útil, teléfono o ubicación.
3. Espera a que el empleado seleccione una opción.
4. No reveles información detallada del cliente antes de que se aclare su identidad.
5. Conserva la selección en el contexto de la conversación para las preguntas posteriores.

Nunca selecciones automáticamente una empresa cuando existan varias coincidencias plausibles.

Si no se encuentra ninguna coincidencia, informa que no hay resultados y permite probar otra búsqueda. No inventes empresas ni datos.

## 10. Respuestas y presentación de los datos

Responde con texto conversacional claro, profesional y natural.

No obligues a presentar todos los resultados en tablas o fichas. Utiliza listas o formatos estructurados solo cuando ayuden a comprender la respuesta.

Reglas:
- Muestra únicamente los campos pertinentes a la pregunta.
- Permite que el empleado solicite más detalles posteriormente.
- Respeta los nombres y valores originales de los campos.
- No inventes ni completes datos vacíos.
- Diferencia entre un campo vacío, un campo inexistente y un error de consulta cuando sea posible.
- Si un dato no está disponible, dilo expresamente.
- Conserva los enlaces reales cuando el usuario solicite una URL.
- Presenta las fechas según los valores almacenados, sin inventar fechas ni alterar su significado.
- No afirmes que un registro es el más reciente, vigente o válido si no se puede demostrar con los datos disponibles.
- Si la consulta devuelve demasiados resultados, presenta una cantidad razonable y permite refinar la búsqueda.
- No muestres información sensible innecesaria en las listas de coincidencias.

## 11. Historial de conversaciones

Guarda el historial en MongoDB en una colección separada, por ejemplo `chat_conversations`, con los mensajes necesarios para reconstruir las conversaciones.

Cada conversación debe tener, como mínimo, una referencia al usuario autenticado, un identificador propio, fecha de creación y actualización, y los mensajes necesarios para mantener el contexto.

Requisitos:
- Cada empleado puede ver exclusivamente sus conversaciones.
- Un empleado no puede acceder al historial de otro cambiando un identificador en una URL o solicitud.
- Las conversaciones deben persistir después de cerrar la sesión o reiniciar la aplicación.
- El empleado puede abrir una conversación anterior y continuarla.
- Debe poder iniciar una conversación nueva.
- La interfaz debe mostrar una lista de conversaciones anteriores con títulos útiles.
- Los títulos pueden generarse a partir del primer mensaje, sin enviar datos innecesarios a Gemini.
- Las consultas del historial deben validarse siempre en el backend con el usuario autenticado.
- No guardes API keys, contraseñas, tokens de sesión ni secretos en los mensajes.
- No registres indiscriminadamente documentos completos de clientes en los logs.

La persistencia del historial es distinta de la memoria temporal de una conversación. Implementa ambas de forma coherente para que el contexto se mantenga al abrir una conversación anterior, sin mezclar historiales de distintos usuarios.

## 12. Diseño de la interfaz

Crea una interfaz profesional, moderna y fácil de utilizar para una herramienta interna de trabajo.

Utiliza UI UX Pro Max para establecer las decisiones visuales. No te limites a un formulario básico con una caja de texto.

La aplicación debe incluir:
- Inicio de sesión limpio y profesional.
- Área principal de conversación.
- Lista lateral o panel de historial.
- Indicador visual de la conversación actual.
- Mensajes diferenciados entre empleado y asistente.
- Indicadores de carga y procesamiento.
- Presentación clara de las coincidencias de empresas.
- Acciones para iniciar una conversación y cerrar sesión.
- Diseño adaptable a distintos tamaños de ventana.
- Estados vacíos, errores y mensajes de confirmación.
- Accesibilidad de teclado, contraste adecuado y controles comprensibles.
- Enlaces visibles y utilizables cuando se devuelvan URLs.

Evita animaciones excesivas, interfaces recargadas y elementos decorativos que dificulten las consultas.

No incluyas gráficos o estadísticas ficticias. La interfaz debe priorizar la búsqueda y consulta de clientes.

## 13. Seguridad y operación local

La aplicación se ejecutará inicialmente en esta computadora.

- Vincula el servidor de desarrollo y los servicios locales a interfaces locales cuando corresponda.
- No abras puertos externos ni configures acceso remoto automáticamente.
- Protege las rutas de backend y valida que cada operación requiera autenticación.
- Implementa protección contra solicitudes no autorizadas y acceso horizontal entre usuarios.
- Valida las entradas para evitar inyección, abuso de filtros y consultas excesivamente costosas.
- Configura límites de tamaño para solicitudes y mensajes.
- Evita revelar detalles internos, claves, rutas sensibles o trazas completas en errores visibles al usuario.
- Mantén los secretos fuera del control de versiones.
- No utilices servicios externos adicionales sin necesidad y sin documentar qué información se envía.
- No instales paquetes o modifiques configuraciones globales del equipo sin necesidad.
- No elimines archivos ni datos existentes para solucionar errores.

## 14. Configuración y ejecución

Incluye un `README.md` en español que explique:

1. Requisitos previos.
2. Estructura del proyecto.
3. Cómo instalar las dependencias.
4. Cómo crear la API key en Google AI Studio.
5. Cómo configurar `.env` a partir de `.env.example`.
6. Cómo inicializar el usuario administrador de prueba.
7. Cómo ejecutar frontend y backend localmente.
8. Cómo verificar la conexión con MongoDB.
9. Cómo crear cuentas adicionales desde el mecanismo autorizado.
10. Cómo resolver errores frecuentes.
11. Cómo ejecutar las pruebas.
12. Qué limitaciones tiene el nivel gratuito de Gemini.
13. Qué pasos de seguridad son obligatorios antes de cualquier despliegue fuera del equipo local.

No incluyas valores reales de claves o contraseñas en los archivos de ejemplo.

## 15. Pruebas obligatorias

Implementa y ejecuta pruebas que cubran, como mínimo:

- Conexión con la base de datos existente.
- Búsqueda exacta por nombre de empresa.
- Búsqueda por número telefónico.
- Verificación del número en la colección auxiliar.
- Coincidencias aproximadas y selección entre varias empresas.
- Consulta de campos individuales y varios campos relacionados.
- Manejo de campos vacíos.
- Manejo de clientes no encontrados.
- Errores y cuotas de Gemini.
- Inicio y cierre de sesión.
- Protección de rutas privadas.
- Separación de conversaciones entre usuarios.
- Rechazo de intentos de modificar o eliminar clientes.
- Ausencia de credenciales en el frontend y en los archivos versionados.
- Renderizado de la interfaz y estados de carga y error.

Utiliza datos de prueba aislados para las pruebas automatizadas. No modifiques los datos reales de clientes para preparar las pruebas.

Si una prueba requiere servicios que no están configurados, identifica claramente el requisito pendiente en lugar de afirmar que pasó.

## 16. Plan de implementación

Trabaja en etapas verificables:

Fase 1: inspeccionar el proyecto, la skill, las dependencias y la estructura real de MongoDB.

Fase 2: definir la arquitectura y configurar las variables de entorno sin exponer secretos.

Fase 3: implementar backend, conexión a MongoDB y consultas seguras de solo lectura.

Fase 4: implementar autenticación y aislamiento de usuarios.

Fase 5: implementar integración con Gemini, interpretación de preguntas y búsqueda de coincidencias.

Fase 6: implementar historial persistente y privado.

Fase 7: implementar la interfaz utilizando UI UX Pro Max.

Fase 8: ejecutar pruebas, corregir errores y documentar la instalación.

Si descubres que un requisito no puede cumplirse con la configuración actual, detente en ese punto, explica el impedimento y solicita únicamente la información o autorización necesaria. No sustituyas silenciosamente un requisito por una solución diferente.

## 17. Criterios de finalización

El proyecto solo se considerará terminado cuando:

- La aplicación pueda ejecutarse localmente siguiendo el README.
- El inicio de sesión funcione.
- El backend se conecte a la base `vionest`.
- Se puedan consultar ambas colecciones sin modificar los datos originales.
- Las preguntas en español produzcan respuestas basadas en los registros reales.
- Las coincidencias múltiples requieran una selección del empleado.
- El historial persista y permanezca aislado por usuario.
- La API key se encuentre exclusivamente en el entorno del backend.
- La interfaz aplique la skill UI UX Pro Max.
- Las pruebas ejecutadas estén documentadas con sus resultados reales.

Al finalizar, presenta un resumen de lo implementado, los archivos principales, las instrucciones para iniciar la aplicación, las pruebas ejecutadas y cualquier configuración que todavía deba completar manualmente el usuario.

No afirmes que una funcionalidad está terminada si no ha sido implementada y verificada.