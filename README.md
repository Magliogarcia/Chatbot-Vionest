# Chatbot Interno de Clientes - Vionest

Aplicación web local desarrollada para el personal autorizado de Vionest que permite consultar, verificar y analizar información de clientes mediante preguntas en lenguaje natural en español, conectada en tiempo real y en modo de **estricta solo lectura** a la base de datos MongoDB local existente (`vionest`).

---

## 1. Requisitos Previos

- **Node.js**: Versión 18 o superior (probado con v22.x).
- **npm**: Versión 9 o superior (probado con v10.x).
- **MongoDB**: Instancia local ejecutándose en `127.0.0.1:27017` con la base de datos `vionest` cargada con las colecciones:
  - `clientes` (1,737 documentos).
  - `clientes_telefonos_verificacion` (851 documentos).
- **Google AI Studio API Key**: Opcional para lenguaje natural avanzado con Gemini (el sistema incluye motor de búsqueda y respuestas deterministas de respaldo si no está configurada).

---

## 2. Estructura del Proyecto

```text
Chat Bot/
├── .agents/                    # Configuración de agentes y skill UI UX Pro Max
├── design-system/              # Sistema de diseño generado por UI UX Pro Max
│   └── vionest-chatbot/
│       └── MASTER.md
├── server/                     # Backend Node.js + Express
│   ├── src/
│   │   ├── config/             # Variables de entorno y configuración
│   │   ├── db/                 # Conexión singleton a MongoDB (127.0.0.1)
│   │   ├── middleware/         # Autenticación JWT, Rate Limiting, Sanitización de Errores
│   │   ├── models/             # Acceso de solo lectura a clientes, usuarios y conversaciones
│   │   │   ├── clientQuery.js  # Búsquedas exactas, difusas, verificación telefónica (SOLO LECTURA)
│   │   │   ├── conversationModel.js # Historial aislado por usuario
│   │   │   └── userModel.js    # Cuentas y hash de contraseñas con bcrypt
│   │   ├── routes/             # Endpoints /api/auth, /api/chat, /api/system
│   │   ├── scripts/            # Scripts inspect-db y seed-admin
│   │   ├── services/           # Orquestador conversacional, Gemini API, Parser determinista
│   │   └── index.js            # Servidor Express vinculado a localhost
│   ├── tests/                  # Pruebas automatizadas del backend y rutas API
│   ├── .env.example            # Plantilla de variables de entorno
│   └── package.json
├── client/                     # Frontend React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/         # LoginScreen, Navbar, Sidebar, MessageBubble, ChatInput, Modales
│   │   ├── context/            # AuthContext (Sesión y credenciales seguras)
│   │   ├── services/           # Cliente HTTP hacia la API del backend
│   │   ├── App.jsx             # Área principal de trabajo conversacional
│   │   ├── index.css           # Estilos base y tokens de diseño UI UX Pro Max
│   │   └── main.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── .env.example                # Plantilla raíz de configuración
├── .gitignore                  # Exclusión estricta de .env, node_modules y logs
├── package.json                # Scripts unificados de ejecución
└── README.md                   # Documentación técnica completa
```

---

## 3. Instalación de Dependencias

Ejecuta en la raíz del proyecto para instalar las dependencias de ambos entornos:

```bash
# 1. Dependencias del backend
cd server
npm install

# 2. Dependencias del frontend
cd ../client
npm install

# 3. Volver a la raíz
cd ..
```

---

## 4. Cómo Crear la API Key en Google AI Studio

1. Ingresa a la consola oficial de [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Inicia sesión con la cuenta de Google autorizada de Vionest.
3. Haz clic en el botón azul **"Create API key"** (Crear clave de API).
4. Selecciona un proyecto de Google Cloud existente o crea uno nuevo de forma automática.
5. Copia la clave generada (empieza por `AIzaSy...`).
6. **No compartas ni publiques esta clave** en repositorios, chats o código fuente.

---

## 5. Cómo Configurar `.env`

Copia el archivo de ejemplo en la carpeta `server`:

```bash
cp server/.env.example server/.env
```

Edita `server/.env` con tus parámetros locales:

```env
# Servidor Backend
PORT=3001
CLIENT_ORIGIN=http://localhost:5173

# Conexión a MongoDB (Instancia local)
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB_NAME=vionest

# Seguridad JWT
JWT_SECRET=genera_una_clave_aleatoria_segura_de_al_menos_32_caracteres
JWT_EXPIRES_IN=24h

# Usuario Administrador Inicial de Prueba
ADMIN_INITIAL_USERNAME=admin
ADMIN_INITIAL_PASSWORD=123

# Google Gemini API
GEMINI_API_KEY=AIzaSyTuClaveRealDeGoogleAIStudioAqui
GEMINI_MODEL=gemini-2.5-flash
```

> **Nota:** Si aún no has generado la clave `GEMINI_API_KEY`, puedes dejarla vacía. El backend funcionará de forma determinista resolviendo consultas directas, desambiguaciones y filtros sin interrumpir la operación.

---

## 6. Inicialización del Usuario Administrador de Prueba

El sistema cuenta con un script seguro de seed para crear el primer usuario de prueba (`admin` con contraseña inicial `123`), almacenando únicamente su hash con **bcrypt** (salt rounds = 10):

```bash
# Desde la raíz del proyecto:
npm run seed-admin

# O directamente desde server:
cd server
npm run seed-admin
```

El script es idempotente: si el usuario ya existe, no sobrescribe ni duplica el registro.

---

## 7. Ejecución Local (Frontend y Backend)

### Opción A: Modo Desarrollo (con recarga en vivo)

Abre dos terminales:

**Terminal 1 (Backend):**
```bash
npm run server
# El servidor iniciará en http://127.0.0.1:3001
```

**Terminal 2 (Frontend):**
```bash
npm run client
# La interfaz estará disponible en http://127.0.0.1:5173
```

### Opción B: Modo Integrado (Servido por Express)

Compila el frontend una vez:
```bash
npm run build
```
Inicia el backend:
```bash
npm start
```
Abre en tu navegador `http://127.0.0.1:3001`. El backend servirá tanto la API como la interfaz gráfica completa.

---

## 8. Verificación de la Conexión con MongoDB

Para verificar la conectividad y la estructura de las colecciones sin iniciar la interfaz gráfica, ejecuta el script de inspección de solo lectura:

```bash
npm run inspect-db
```

Este script comprobará:
- Conexión a `127.0.0.1:27017`.
- Conteo de documentos en `clientes` (~1,737).
- Conteo en `clientes_telefonos_verificacion` (~851).
- Lista de índices existentes (sin modificarlos).
- Valores reales de campos de búsqueda (`Estatus actual`, `Escuadrón Asignado`, `Investigador Asignado`).

También puedes comprobar el estado desde el navegador o mediante `curl`:
```bash
curl http://127.0.0.1:3001/api/system/status
```

---

## 9. Creación de Cuentas Adicionales

El registro público está **estrictamente deshabilitado**. La creación de cuentas se gestiona de forma controlada:

1. Inicia sesión como administrador con la cuenta `admin`.
2. En la barra superior, haz clic en el botón **"Crear Usuario"**.
3. Ingresa el nombre de usuario (mínimo 3 caracteres), contraseña temporal (mínimo 6 caracteres) y rol (`employee` o `admin`).
4. El empleado podrá iniciar sesión inmediatamente y tendrá la posibilidad de actualizar su contraseña desde el botón de la llave en la barra superior.

---

## 10. Resolución de Errores Frecuentes

| Error / Síntoma | Causa Probable | Solución |
|---|---|---|
| `MongoServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017` | El servicio local de MongoDB no está ejecutándose. | Inicia el servicio local de MongoDB en tu equipo (`net start MongoDB` o desde Servicios de Windows). |
| `Credenciales incorrectas` en pantalla de inicio de sesión | El usuario `admin` no ha sido inicializado o se ingresó una contraseña distinta. | Ejecuta `npm run seed-admin` para asegurar la creación del usuario inicial. |
| `Modo Determinista Activo / Sin API Key` en el estado del sistema | `GEMINI_API_KEY` está vacía en `server/.env`. | Configura una clave válida de Google AI Studio y reinicia el backend. |
| `429 Quota Exceeded` en Gemini | Se alcanzó el límite de solicitudes por minuto del nivel gratuito de la API. | El chatbot alternará automáticamente al formateador determinista de respaldo sin detenerse. Espera un minuto para nuevas consultas al LLM. |
| `401 No autorizado` en peticiones | La sesión expiró o las cookies están bloqueadas por el navegador. | Vuelve a iniciar sesión desde la pantalla de login. |

---

## 11. Ejecución de Pruebas

El proyecto cuenta con un conjunto de pruebas automatizadas que cubren todos los aspectos requeridos:

```bash
# Ejecutar suite de pruebas:
npm test
```

Las pruebas verifican:
1. Conexión y existencia de ambas colecciones.
2. Búsqueda exacta por empresa.
3. Búsqueda por número telefónico.
4. Verificación telefónica distinguiendo los 5 estados (ambas colecciones, solo auxiliar, solo maestro, no encontrado, indeterminado).
5. Coincidencias aproximadas y desambiguación.
6. Consulta de campos específicos y manejo de campos vacíos.
7. Manejo de empresas no encontradas.
8. Autenticación, generación de JWT y rechazo de credenciales incorrectas.
9. Separación estricta y aislamiento de conversaciones entre distintos usuarios.
10. Ausencia total de métodos mutadores de datos de clientes (solo lectura).
11. Flujo conversacional y memoria de contexto de la empresa activa.
12. Rutas HTTP protegidas y rechazo con código 401 a peticiones anónimas.
13. No exposición de credenciales ni secretos en las respuestas públicas de estado.

---

## 12. Limitaciones del Nivel Gratuito de Gemini

Al utilizar la API de Google AI Studio en su nivel gratuito (*Free Tier*):
- **Límites de frecuencia**: Aproximadamente 15 solicitudes por minuto (RPM) y 1,500 solicitudes por día (RPD) según el modelo (`gemini-2.5-flash` o `gemini-1.5-flash`).
- **Respaldo determinista**: El sistema de Vionest está diseñado para no depender exclusivamente de la API: si la cuota se agota, el parser determinista sigue extrayendo filtros, buscando en MongoDB y respondiendo con datos precisos.
- **Protección de datos**: Las consultas nunca envían toda la base de datos a Gemini. Solo se envían los campos pertinentes estrictamente requeridos para redactar la respuesta final.

---

## 13. Pasos de Seguridad Obligatorios Antes de Despliegues Externos

Antes de migrar o desplegar esta aplicación fuera del entorno local:

1. **Crear usuario de solo lectura en MongoDB**: Configurar autenticación en la instancia de MongoDB y crear un usuario con el rol `read` restringido exclusivamente a la base de datos `vionest`.
2. **Generar un secreto JWT robusto**: Modificar `JWT_SECRET` en `.env` utilizando un generador criptográfico seguro (por ejemplo, `openssl rand -hex 32`).
3. **Cambiar la contraseña inicial**: Actualizar la contraseña del usuario `admin` inmediatamente.
4. **Habilitar HTTPS**: Si se expone en red local o institucional, habilitar certificados TLS/SSL y activar la bandera `secure: true` en las cookies de sesión.
5. **Aislamiento de red**: Mantener el puerto de MongoDB (`27017`) enlazado a `127.0.0.1` o protegido mediante firewall perimetral, impidiendo cualquier acceso desde Internet.
