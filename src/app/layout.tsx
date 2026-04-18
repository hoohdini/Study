import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Study Archive",
  description: "학회와 전공 학습 내용을 정리하는 개인 아카이브",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
