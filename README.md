# Dashboard de Gestión de Gastos

Este es el proyecto frontend en React (Vite) para la aplicación de Gestión y Aprobación de Gastos.

## Requisitos previos

- Node.js (v18+)
- npm (v9+)

## Instalación

1. Clona o mueve este repositorio a tu entorno local (ej. a tu Escritorio).
2. Abre la carpeta en la terminal o consola de comandos.
3. Instala las dependencias ejecutando:

```bash
npm install
```

## Ejecución en Entorno de Desarrollo

Para iniciar el servidor local y ver la aplicación, ejecuta:

```bash
npm run dev
```

Esto abrirá la aplicación en tu navegador (por defecto en `http://localhost:5173/`).
Cualquier cambio que realices en el código se reflejará automáticamente (Hot Module Replacement).

## Estructura del Proyecto (Fase 1)

- `src/layouts/`: Contiene el esquema general de la app (Sidebar, Navbar).
- `src/pages/`: Vistas de cada pestaña (Login, Dashboard, Aprobaciones, Reportes).
- `src/App.jsx`: Configuración del enrutador principal (`react-router-dom`).
- `src/index.css`: Archivo base para el sistema de diseño Vanilla CSS.

## Librerías principales utilizadas

- **React Router DOM**: Para la navegación entre pestañas.
- **Recharts**: Para los gráficos y visualizaciones.
- **Lucide React**: Para la iconografía moderna.
