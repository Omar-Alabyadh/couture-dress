import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = new URL("https://www.couture-dress.com/");

export const viewport: Viewport = {
  themeColor: "#0b0b0f",
};

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: "كوتور للأزياء | COUTURE – بنغازي بلعون",
  description:
    "كوتور للأزياء – COUTURE متجر أزياء نسائية في بنغازي/بلعون. فساتين، عبايات، كاجوال وإكسسوارات. تواصلي معنا عبر واتساب.",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/assets/logo.jpeg", type: "image/jpeg" }],
  },
  openGraph: {
    title: "كوتور للأزياء | COUTURE",
    description:
      "أزياء نسائية راقية في بنغازي/بلعون. تشكيلة مختارة وجودة ممتازة.",
    url: siteUrl,
    type: "website",
    images: [{ url: "/assets/logo.jpeg" }],
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
