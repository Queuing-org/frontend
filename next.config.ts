import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.googleusercontent.com", //구글 프로필 이미지
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "/vi/**", //유튜브 api 썸네일
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8080",
        pathname: "/uploads/**", //방 사진
      },
    ],
  },
};

export default nextConfig;
