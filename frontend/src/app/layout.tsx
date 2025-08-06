import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "sonner";
import { PWAInstallPrompt } from "@/presentation/components/layout/PWAInstallPrompt";
import { ServiceWorkerRegistration } from "@/presentation/components/layout/ServiceWorkerRegistration";

const pretendard = localFont({
  src: "../../public/fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  weight: "45 920",
});

export const metadata: Metadata = {
  title: "Bespoke AI Suite",
  description: "AI 기반 마케팅 콘텐츠 자동화 플랫폼",
  keywords: ["AI", "마케팅", "콘텐츠", "자동화", "캠페인", "분석"],
  authors: [{ name: "Bespoke AI Team" }],
  creator: "Bespoke AI Suite",
  publisher: "Bespoke AI Suite",
  applicationName: "Bespoke AI Suite",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Bespoke AI",
    startupImage: [
      {
        url: "/startup-768x1004.png",
        media: "(device-width: 768px) and (device-height: 1024px)",
      },
      {
        url: "/startup-1536x2008.png",
        media: "(device-width: 1536px) and (device-height: 2048px)",
      },
    ],
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  icons: [
    {
      rel: "icon",
      url: "/favicon.ico",
    },
    {
      rel: "apple-touch-icon",
      sizes: "180x180",
      url: "/icon-192.png",
    },
  ],
  openGraph: {
    title: "Bespoke AI Suite",
    description: "AI 기반 마케팅 콘텐츠 자동화 플랫폼",
    siteName: "Bespoke AI Suite",
    type: "website",
    locale: "ko_KR",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Bespoke AI Suite",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bespoke AI Suite",
    description: "AI 기반 마케팅 콘텐츠 자동화 플랫폼",
    images: ["/og-image.png"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#00B06B",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Bespoke AI" />
        <meta name="msapplication-TileColor" content="#00B06B" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body
        className={`${pretendard.className} antialiased bg-background text-foreground no-tap-highlight`}
      >
        {children}
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          duration={5000}
          theme="light"
          toastOptions={{
            style: {
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "16px",
            },
          }}
        />
        <PWAInstallPrompt />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
