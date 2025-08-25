/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },
  // 优化性能
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  output: 'standalone',
  devIndicators: {
    position: 'top-right', // 将挂件移动到右下角
  },
};

module.exports = nextConfig;