import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LinguaChat",
  description: "Real conversations, word by word.",
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
