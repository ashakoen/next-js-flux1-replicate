/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'replicate.delivery',
      },
      // Add other domains if needed
    ],
    unoptimized: true,
  },
};

export default nextConfig;