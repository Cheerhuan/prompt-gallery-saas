import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/prompt-gallery-saas',
  images: {
    unoptimized: true, // GitHub Pages 不支持 Next.js 的圖片優化伺服器
  },
  trailingSlash: true, // 確保路徑在靜態環境下能正確對應到 .html 文件
};

export default nextConfig;
