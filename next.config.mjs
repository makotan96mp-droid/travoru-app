/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    allowedDevOrigins: ['http://192.168.0.23:3000', 'http://192.168.0.23']
  }
};
export default nextConfig;
