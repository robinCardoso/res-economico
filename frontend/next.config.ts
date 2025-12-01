import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  fallbacks: {
    document: '/offline',
  },
});

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: __dirname,
  },
  // Permitir requisições cross-origin em desenvolvimento para acesso na rede
  // Nota: allowedDevOrigins pode não estar disponível em Next.js 16.0.1
  // O aviso é apenas informativo e não impede o funcionamento
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
} as NextConfig;

export default withPWA(nextConfig);
