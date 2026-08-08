import type {
  NextConfig,
} from "next";

const backendUrl =
  "https://baki-portfolio-backend.vercel.app";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.1.4",
  ],

  async rewrites() {
    return [
      {
        source:
          "/backend/:path*",

        destination:
          `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;