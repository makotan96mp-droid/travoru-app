/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    allowedDevOrigins: [
      "http://localhost",           "http://localhost:3000", "http://localhost:3001", "http://localhost:3020", "http://localhost:3030",
      "http://127.0.0.1",           "http://127.0.0.1:3000", "http://127.0.0.1:3001", "http://127.0.0.1:3020", "http://127.0.0.1:3030",
      "http://192.168.0.23",        "http://192.168.0.23:3000", "http://192.168.0.23:3001", "http://192.168.0.23:3020", "http://192.168.0.23:3030",
    ],
  },
};
export default nextConfig;
