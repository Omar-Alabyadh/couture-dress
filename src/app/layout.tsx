import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = new URL("https://www.couture-dress.com/");

export const viewport: Viewport = {
  themeColor: "#0b0b0f",
};

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: "كوتور للأزياء | COUTURE – بنغازي و طرابلس",
  description:
    "كوتور للأزياء – COUTURE متجر أزياء نسائية بفرعين في بنغازي و طرابلس. فساتين، عبايات، كاجوال وإكسسوارات. تواصلي معنا عبر واتساب.",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "كوتور للأزياء",
    description: "أزياء نسائية فاخرة ومختارة بعناية",
    url: siteUrl,
    type: "website",
    locale: "ar_LY",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "كوتور للأزياء",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
