/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove output: 'export' as we want server-side features
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;