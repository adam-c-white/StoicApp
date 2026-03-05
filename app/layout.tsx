import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StoicApp",
  description:
    "A daily companion for Stoic philosophy — quotes, reflections, and journaling.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
