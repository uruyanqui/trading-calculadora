# Calculadora de Tamaño de Posición

Una herramienta interactiva para calcular el tamaño óptimo de posición para trading basado en gestión de riesgo y ATR.

## Características

- Cálculo de tamaño de posición basado en capital, riesgo y ATR
- Obtención de precios en tiempo real (con API key configurada)
- Cálculo automático de ATR20
- Historial de operaciones
- Información de margen utilizado y disponible

## Configuración

### Variables de Entorno

Para utilizar esta aplicación con datos en tiempo real, necesitas crear un archivo `.env.local` en la raíz del proyecto con la siguiente variable:

\`\`\`
TWELVE_DATA_KEY=tu_clave_api_aqui
\`\`\`

Puedes obtener una clave API gratuita registrándote en [TwelveData](https://twelvedata.com/).

### Modo Demo

Si no configuras una clave API, la aplicación funcionará en modo demo con datos simulados. Esto es útil para:
- Probar la funcionalidad de la calculadora
- Realizar demostraciones
- Desarrollo y pruebas

Los datos simulados son realistas pero no reflejan los precios actuales del mercado.

## Instalación y Ejecución

\`\`\`bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build

# Iniciar versión de producción
npm start
\`\`\`

## Tecnologías Utilizadas

- Next.js
- React
- TailwindCSS
- shadcn/ui
- TwelveData API (para datos en tiempo real)

## Próximas Mejoras

- Almacenamiento local del historial de operaciones
- Visualización gráfica de niveles de entrada y salida
- Soporte para múltiples timeframes de ATR
- Cálculo de posiciones para opciones
