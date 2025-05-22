/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración del runtime del servidor - solo disponible en el servidor
  serverRuntimeConfig: {
    // Solo disponible en el lado del servidor
    TWELVE_DATA_KEY: process.env.TWELVE_DATA_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
  // Variables de entorno públicas - disponibles tanto en cliente como servidor
  publicRuntimeConfig: {
    // Aquí irían variables que necesites en el cliente
    // NO incluir claves API aquí para mantenerlas seguras
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
