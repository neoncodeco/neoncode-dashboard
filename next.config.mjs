import path from "path";
import { fileURLToPath } from "url";
import {
  userDashboardCanonicalRewrites,
  userDashboardLegacyRedirects,
  userDashboardRoutes,
} from "./lib/userDashboardRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  async redirects() {
    return [
      {
        source: userDashboardRoutes.root,
        destination: userDashboardRoutes.dashboard,
        permanent: true,
      },
      ...userDashboardLegacyRedirects.map(({ source, destination }) => ({
        source,
        destination,
        permanent: true,
      })),
    ];
  },
  async rewrites() {
    return userDashboardCanonicalRewrites;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "i.ibb.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
