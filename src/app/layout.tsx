import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Creightweb Calling CRM",
  description:
    "Mobile-first telecalling CRM for Creightweb — smart lead assignment, one-tap calling, and full tracking.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#F5F5F3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-[#F5F5F3] text-[#111111] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
