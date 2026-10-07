import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // Хуучин апп-ыг нүүр дэлгэцэндээ суулгасан хүмүүс /index.html-ээр ордог
    return [{ source: "/index.html", destination: "/umgm/index.html", permanent: false }];
  },
};

export default nextConfig;
