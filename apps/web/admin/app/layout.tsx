import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import { Providers } from "@/components/providers/providers";
import "./globals.css";

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  title: "آگروهوم | پنل ادمین",
  description: "پنل مدیریت محتوا و کاتالوگ آگروهوم",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
