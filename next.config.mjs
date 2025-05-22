/** @type {import('next').NextConfig} */
const nextConfig = {
  // Asegurarse de que las variables de entorno estén disponibles en el servidor
  serverRuntimeConfig: {
    // Solo disponible en el lado del servidor
    TWELVE_DATA_KEY: process.env.TWELVE_DATA_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
  // Variables de entorno disponibles tanto en el cliente como en el servidor
  publicRuntimeConfig: {
    // Disponible en el cliente y el servidor
    // No incluir claves API aquí para mantenerlas seguras
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
