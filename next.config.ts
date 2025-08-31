import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/signin",
        permanent: true, 
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'files.uloons.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',  
      },
    ],
  },
};

export default nextConfig;