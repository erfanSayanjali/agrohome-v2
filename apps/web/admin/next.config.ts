import type { NextConfig } from "next";

const apiOrigin = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  basePath: "/admin",
  async redirects() {
    return [
      {
        source: "/",
        destination: "/admin",
        permanent: false,
        basePath: false,
      },
    ];
  },
  async rewrites() {
    // basePath: false — /api and /uploads stay on site origin (not /admin/api)
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiOrigin}/api/v1/:path*`,
        basePath: false,
      },
      {
        source: "/uploads/:path*",
        destination: `${apiOrigin}/uploads/:path*`,
        basePath: false,
      },
    ];
  },
};

export default nextConfig;
