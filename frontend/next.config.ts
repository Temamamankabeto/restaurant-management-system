import type { NextConfig } from "next";

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function stripApiSuffix(value: string) {
  return value.replace(/\/api\/?$/, "");
}

const rawBackendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:8000";

const backendOrigin = stripApiSuffix(stripTrailingSlash(rawBackendUrl));

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
