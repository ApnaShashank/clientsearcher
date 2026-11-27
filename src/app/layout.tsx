import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL || "https://localead.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "Creightweb — Work From Home Calling Job & CRM",
  description:
    "Join Creightweb as a Remote Telecaller (₹15,000–₹20,000/month + incentives) or manage leads with Creightweb Calling CRM.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/creightweb-logo.png",
    shortcut: "/creightweb-logo.png",
    apple: "/creightweb-logo.png",
  },
  openGraph: {
    title: "Creightweb — Work From Home Calling Job & CRM",
    description:
      "Earn ₹15,000–₹20,000/month + incentives working from home. Apply now & sign your digital agreement in 3 minutes.",
    url: appUrl,
    siteName: "Creightweb",
    images: [
      {
        url: "/creightweb-logo.png",
        width: 1200,
        height: 800,
        alt: "Creightweb Logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Creightweb — Work From Home Calling Job & CRM",
    description:
      "Earn ₹15,000–₹20,000/month + incentives working from home. Apply now.",
    images: ["/creightweb-logo.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FF5C1C",
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
