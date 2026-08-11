import localFont from "next/font/local";
import "./globals.css";
import { getSiteSettings } from "../lib/data/cms";

const IRANSans = localFont({
  src: [
    {
      path: '../fonts/woff2/IRANSansWeb_Black.woff2',
      weight: '900',
      style: 'normal',
    },
    {
      path: '../fonts/woff2/IRANSansWeb_Bold.woff2',
      weight: '800',
      style: 'normal',
    },
    {
      path: '../fonts/woff2/IRANSansWeb_Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../fonts/woff2/IRANSansWeb_Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../fonts/woff2/IRANSansWeb_UltraLight.woff2',
      weight: '200',
      style: 'normal',
    },
  ],
})

export async function generateMetadata() {
  const settings = await getSiteSettings();
  if (!settings.faviconUrl) return {};
  return {
    icons: {
      icon: settings.faviconUrl,
    },
  };
}

export default function RootLayout({children}) {
  return (
    <html lang="fa" dir="rtl" >
      <body
      className={IRANSans.className}
      >
        {children}
      </body>
    </html>
  );
}
