import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "UdemyRadar – كوبونات يوديمي والمنح الدراسية",
  description:
    "منصة ذكية للطلاب العرب للحصول على كوبونات يوديمي المجانية والمنح الدراسية وأدوات التوظيف وخارطة الطريق المهنية",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased font-[family-name:var(--font-cairo)]">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
