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

### 6. Configurar usuarios iniciales

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
