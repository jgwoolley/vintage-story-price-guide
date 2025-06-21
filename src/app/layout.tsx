import type { Metadata } from "next";
import "./globals.css";
import siteInfo from "@/utils/siteInfo";

export const metadata: Metadata = {
  title: siteInfo.title,
  description: siteInfo.description,
  manifest: "manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
