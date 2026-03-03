import type { Metadata } from "next";
import "./globals.css";
import { MainLayout } from "@/components/MainLayout";

export const metadata: Metadata = {
  title: "考勤管理系统",
  description: "企业考勤管理与报表系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-100">
        {children}
      </body>
    </html>
  );
}
