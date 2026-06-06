import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // @sparticuz/chromium-min 通过相对路径解析二进制，必须让 Next.js 不去打包它，
  // 否则部署到 Vercel / Lambda 后会报 "The input directory does not exist"。
  // puppeteer-core 同理。
  serverExternalPackages: ['@sparticuz/chromium-min', 'puppeteer-core'],
};

export default nextConfig;
