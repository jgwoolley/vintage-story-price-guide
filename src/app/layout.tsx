import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NiFi FlowFile Tools",
  description: "Various tools for interacting with Apache NiFi.",
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
