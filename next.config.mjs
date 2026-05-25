/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    'mycelia-kernel-plugin',
    '@ligneous/auth',
    '@ligneous/authz',
    '@ligneous/prisma',
    '@ligneous/story-creator',
    '@ligneous/timeline-view',
    '@ligneous/album-view',
    '@ligneous/gedcom-events',
  ],
  env: {
    NEXT_PUBLIC_GO_API_URL: process.env.NEXT_PUBLIC_GO_API_URL || 'http://localhost:8092',
  },
};

export default nextConfig;
