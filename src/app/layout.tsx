import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/ui/AppShell";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "GlucoScan - Glycemic Impact Estimator",
  description:
    "Estimate the glycemic impact of packaged foods by scanning barcodes or searching by name. For informational purposes only.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GlucoScan",
  },
  openGraph: {
    title: "GlucoScan",
    description: "Estimate the glycemic impact of packaged foods",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B6E72",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="font-sans antialiased bg-background text-text-primary min-h-screen">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
