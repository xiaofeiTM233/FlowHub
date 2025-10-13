import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import LayoutProvider from '@/components/LayoutProvider'; // 引入我们的客户端布局提供者
import "@/app/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FlowHub",
  description: "基于Next.js开发的新媒体内容跨平台分发工具。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-cn">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ background: 'var(--background)', color: 'var(--foreground)', minHeight: '100vh', margin: 0 }}
      >
        <LayoutProvider showSidebar={true} showNavbar={true}>
          {children}
        </LayoutProvider>
      </body>
    </html>
  );
}
