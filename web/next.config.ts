import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Тамга, гарын үсэг, логоны зураг (≤2MB) server action-аар орно
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
  async redirects() {
    // Хуучин апп-ыг нүүр дэлгэцэндээ суулгасан хүмүүс /index.html-ээр ордог
    return [{ source: "/index.html", destination: "/umgm/index.html", permanent: false }];
  },
};

export default nextConfig;
