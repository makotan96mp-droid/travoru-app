/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    allowedDevOrigins: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.0.23:3000"
  ,
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://192.168.0.23:3001"
  ,
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://192.168.0.23:3001"
  ]
  }
};
export default nextConfig;
