import type {
  NextConfig,
} from "next";

const backendUrl =
  "https://baki-portfolio-backend.vercel.app";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.1.4",
  ],

  /* =========================================================
     CLOUDINARY IMAGES
     ========================================================= */

  images: {
    remotePatterns: [
      {
        protocol:
          "https",

        hostname:
          "res.cloudinary.com",

        pathname:
          "/lgx6odag/image/upload/**",
      },
    ],
  },

  /* =========================================================
     BACKEND PROXY
     ========================================================= */

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