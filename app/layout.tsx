import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NeoLingo",
  description: "Real conversations, word by word.",
  applicationName: "NeoLingo",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NeoLingo",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#17181c" },
    { media: "(prefers-color-scheme: light)", color: "#fff7f0" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
