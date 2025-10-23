/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Vercel deployment optimizations
  swcMinify: true,
  poweredByHeader: false,
  reactStrictMode: true,
}

module.exports = nextConfig
