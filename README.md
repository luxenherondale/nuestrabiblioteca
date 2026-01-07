# 📚 Nuestra Biblioteca

Aplicación web para gestionar una biblioteca personal compartida. Permite agregar libros por ISBN, categorizarlos, marcar estado de lectura por usuario y ver estadísticas.

## ✨ Características

- **Búsqueda por ISBN**: Obtiene información automática desde Google Books, Open Library e ISBN Chile
- **Gestión de libros**: Agregar, editar y eliminar libros de la biblioteca
- **Categorías personalizadas**: Organiza tus libros por categorías con colores distintivos
- **Estado de lectura**: Marca libros como leídos por cada usuario (Adaly y Sebastián)
- **Sistema de calificación**: Califica libros del 1 al 10 con estrellas
- **Reseñas**: Agrega reseñas y enlaces a Goodreads
- **Estadísticas**: Visualiza estadísticas de lectura con gráficos
- **Filtros avanzados**: Filtra por categoría, ubicación y estado de lectura
- **Diseño moderno**: Interfaz con colores pasteles y diseño responsive

## 🛠️ Tecnologías

### Frontend
- React 19
- Vite
- React Router DOM
- Axios
- Lucide React (iconos)
- Recharts (gráficos)

### Backend
- Node.js
- Express
- MongoDB con Mongoose
- Playwright (scraping ISBN Chile)

## 📋 Requisitos previos

- Node.js 18 o superior
- MongoDB (local o Atlas)
- npm o yarn

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone git@github.com:luxenherondale/nuestrabiblioteca.git
cd nuestrabiblioteca
```

### 2. Instalar dependencias

```bash
# Instalar todas las dependencias (raíz, frontend y server)
npm run install:all

# O instalar manualmente:
npm install
cd frontend && npm install
cd ../server && npm install
```

### 3. Configurar MongoDB

Asegúrate de tener MongoDB corriendo localmente en `mongodb://localhost:27017/nuestrabiblioteca`

O modifica la URI en `server/index.js` para usar MongoDB Atlas.

### 4. Configurar variables de entorno

Copia el archivo de ejemplo y configura tus variables:

```bash
cd server
cp .env.example .env
```

Edita `server/.env` y configura:
- `JWT_SECRET`: Una clave secreta segura para los tokens JWT
- `MONGODB_URI`: URI de conexión a MongoDB (opcional)

### 5. Instalar navegadores de Playwright (para scraping)

```bash
npx playwright install chromium
```

## ▶️ Ejecutar la aplicación

### Opción 1: Ejecutar por separado

```bash
# Terminal 1 - Backend (puerto 5000)
cd server
npm run dev

# Terminal 2 - Frontend (puerto 5173)
cd frontend
npm run dev
```

### Opción 2: Usar scripts del package.json raíz

```bash
# Backend
npm run dev:server

# Frontend (en otra terminal)
npm run dev:frontend
```

### 6. Importar libros de ejemplo (opcional)

Si deseas cargar los libros de ejemplo incluidos en el proyecto:

```bash
cd server
npm run seed-books
```

Esto importará automáticamente todos los libros de ejemplo con sus categorías y estado de lectura.

**Nota:** Los libros se importarán solo si no existen en la base de datos (se valida por ISBN).

### 7. Configurar usuarios iniciales

La primera vez que ejecutes la aplicación, necesitas crear los usuarios. Haz una petición POST a:

```bash
curl -X POST http://localhost:5000/api/auth/setup
```

Esto creará los siguientes usuarios:

| Usuario | Email | Contraseña inicial | Rol |
|---------|-------|-------------------|-----|
| Admin | admin@nuestrabiblioteca.com | admin123 | Administrador |
| Adaly | adaly@arcia.net | adaly123 | Usuario |
| Sebastian | tatan@rodrigo.lat | sebastian123 | Usuario |

**⚠️ Importante:** Cambia las contraseñas después del primer inicio de sesión.

### 7. Abrir en el navegador

- Frontend: http://localhost:5173
- API: http://localhost:5000/api

## 🔐 Sistema de Autenticación

La aplicación cuenta con un sistema de usuarios con los siguientes roles:

### Roles y Permisos

| Rol | Permisos |
|-----|----------|
| **Admin** | Acceso completo. Puede editar todas las reseñas. |
| **Adaly** | Puede ver todo, pero solo editar su propia reseña. |
| **Sebastian** | Puede ver todo, pero solo editar su propia reseña. |

### Características de seguridad

- Autenticación mediante JWT (JSON Web Tokens)
- Contraseñas hasheadas con bcrypt (12 rounds)
- Tokens con expiración de 7 días
- Protección de rutas en frontend y backend
- Validación de permisos para edición de reseñas

## 📁 Estructura del proyecto

```
nuestrabiblioteca/
├── frontend/                 # Aplicación React
│   ├── src/
│   │   ├── components/      # Componentes reutilizables
│   │   │   ├── Book/        # BookCard, BookDetailModal, AddBookModal, etc.
│   │   │   └── Layout/      # Layout principal
│   │   ├── contexts/        # LibraryContext (estado global)
│   │   ├── pages/           # HomePage, LibraryPage, StatisticsPage
│   │   ├── services/        # API client (axios)
│   │   └── App.jsx          # Componente principal con rutas
│   └── package.json
├── server/                   # API Express
│   ├── models/              # Modelos Mongoose (Book, Category)
│   ├── routes/              # Rutas API (books, categories, stats)
│   ├── services/            # BookService (Google Books, Open Library, ISBN Chile)
│   ├── index.js             # Servidor Express
│   └── package.json
├── package.json              # Scripts globales
└── README.md
```

## 🔌 API Endpoints

### Libros
- `GET /api/books` - Obtener todos los libros
- `GET /api/books/:id` - Obtener un libro por ID
- `POST /api/books/search-by-isbn` - Buscar libro por ISBN (sin agregar)
- `POST /api/books/add-by-isbn` - Agregar libro por ISBN
- `POST /api/books/add-manual` - Agregar libro manualmente
- `PUT /api/books/:id` - Actualizar libro
- `PUT /api/books/:id/reading-status` - Actualizar estado de lectura
- `DELETE /api/books/:id` - Eliminar libro

### Categorías
- `GET /api/categories` - Obtener todas las categorías
- `POST /api/categories` - Crear categoría
- `PUT /api/categories/:id` - Actualizar categoría
- `DELETE /api/categories/:id` - Eliminar categoría

### Estadísticas
- `GET /api/stats/overview` - Resumen general
- `GET /api/stats/reading-by-month` - Lecturas por mes
- `GET /api/stats/by-category` - Libros por categoría
- `GET /api/stats/by-location` - Libros por ubicación

## 💾 Gestión de datos de libros

### Exportar libros actuales

Si deseas guardar los libros actuales de tu biblioteca para compartir o respaldar:

```bash
cd server
npm run export-books
```

Esto creará un archivo `server/data/booksExample.json` con todos tus libros actuales.

### Importar libros desde el archivo

Para importar los libros guardados en otra instancia:

```bash
cd server
npm run seed-books
```

**Flujo completo:**
1. En tu instancia actual: `npm run export-books` → genera `booksExample.json`
2. Copia el archivo a otra instancia
3. En la nueva instancia: `npm run seed-books` → importa todos los libros

## 🌐 Página Pública

La aplicación incluye una página pública sin autenticación donde cualquiera puede buscar los libros disponibles:

**URL:** `/biblioteca-publica`

**Características:**
- Buscador en tiempo real por título, autor o ISBN
- Libros organizados por categorías
- Muestra portadas e información básica
- Completamente responsive
- Sin necesidad de login

**Para compartir con otros:**
```
https://tudominio.com/biblioteca-publica
```

## 🚀 Desplegar en un Servidor

### Preparación previa

1. **Exporta tus libros actuales** (si quieres mantenerlos):
```bash
cd server
npm run export-books
```

2. **Commit y push a GitHub:**
```bash
git add -A
git commit -m "Versión lista para producción"
git push origin main
```

### Opción 1: Desplegar en Heroku

1. **Instala Heroku CLI** desde https://devcenter.heroku.com/articles/heroku-cli

2. **Crea una aplicación en Heroku:**
```bash
heroku login
heroku create tu-app-name
```

3. **Configura variables de entorno:**
```bash
heroku config:set JWT_SECRET="tu-clave-secreta-segura"
heroku config:set MONGODB_URI="tu-mongodb-atlas-uri"
```

4. **Crea un archivo `Procfile` en la raíz:**
```
web: npm run build:all && npm run start:server
```

5. **Deploy:**
```bash
git push heroku main
```

### Opción 2: Desplegar en VPS (DigitalOcean, Linode, AWS, etc.)

1. **Conecta por SSH a tu servidor:**
```bash
ssh root@tu-ip-servidor
```

2. **Instala Node.js y npm:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Instala MongoDB (o usa MongoDB Atlas en la nube):**
```bash
# Opción: usar MongoDB Atlas (recomendado)
# Crea una cuenta en https://www.mongodb.com/cloud/atlas
```

4. **Clona el repositorio:**
```bash
git clone git@github.com:luxenherondale/nuestrabiblioteca.git
cd nuestrabiblioteca
```

5. **Instala dependencias:**
```bash
npm run install:all
```

6. **Configura variables de entorno:**
```bash
cd server
cp .env.example .env
# Edita .env con tus valores
nano .env
```

7. **Importa los libros (opcional):**
```bash
npm run seed-books
```

8. **Instala PM2 para mantener la app corriendo:**
```bash
sudo npm install -g pm2
```

9. **Inicia la aplicación con PM2:**
```bash
pm2 start "npm run dev:server" --name "biblioteca-backend"
pm2 start "npm run dev:frontend" --name "biblioteca-frontend"
pm2 save
pm2 startup
```

10. **Configura Nginx como reverse proxy:**
```bash
sudo apt-get install nginx
# Edita /etc/nginx/sites-available/default
# Configura para que apunte a localhost:5173 (frontend) y localhost:5000 (API)
```

### Opción 3: Desplegar con Docker

1. **Crea un `Dockerfile` en la raíz:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN cd frontend && npm install && npm run build
RUN cd server && npm install

EXPOSE 5000 5173

CMD ["npm", "run", "dev:server"]
```

2. **Construye la imagen:**
```bash
docker build -t nuestrabiblioteca .
```

3. **Ejecuta el contenedor:**
```bash
docker run -p 5000:5000 -p 5173:5173 \
  -e JWT_SECRET="tu-clave" \
  -e MONGODB_URI="tu-mongodb-uri" \
  nuestrabiblioteca
```

### Configuración de dominio

1. **Apunta tu dominio al servidor** en tu proveedor de DNS
2. **Configura SSL con Let's Encrypt:**
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d tudominio.com
```

3. **Actualiza Nginx con SSL:**
```bash
sudo nano /etc/nginx/sites-available/default
# Agrega configuración SSL
sudo systemctl restart nginx
```

## 📋 Checklist antes de desplegar

- [ ] Exportaste los libros: `npm run export-books`
- [ ] Configuraste variables de entorno (JWT_SECRET, MONGODB_URI)
- [ ] Instalaste Playwright: `npx playwright install chromium`
- [ ] Probaste localmente: `npm run dev:server` y `npm run dev:frontend`
- [ ] Hiciste commit y push a GitHub
- [ ] Configuraste MongoDB (Atlas o local)
- [ ] Configuraste dominio y DNS
- [ ] Configuraste SSL (HTTPS)

## 🔍 Fuentes de datos para ISBN

La aplicación busca información de libros en el siguiente orden:
1. **Google Books API** - Principal fuente de datos
2. **Open Library API** - Fallback gratuito
3. **ISBN Chile** - Scraping para libros chilenos (usando Playwright)

## 👥 Autores

- Adaly
- Sebastián

## 📄 Licencia

ISC
