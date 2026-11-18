// Static export for GitHub Pages: https://pako64038-ship-it.github.io/Hassen-Equipment/
const isProd = process.env.NODE_ENV === 'production';
const basePath = isProd ? '/Hassen-Equipment' : '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
