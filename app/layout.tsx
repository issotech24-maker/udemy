import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import ShellWrapper from "@/components/ShellWrapper";

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
        <ShellWrapper>
          <main className="flex-1">{children}</main>
        </ShellWrapper>
      </body>
    </html>
  );
}
