/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['mycelia-kernel-plugin'],
  env: {
    NEXT_PUBLIC_GO_API_URL: process.env.NEXT_PUBLIC_GO_API_URL || 'http://localhost:8090',
  },
};

export default nextConfig;
