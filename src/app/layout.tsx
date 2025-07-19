import EmotionRegistry from "@/components/EmotionRegistry";
import siteInfo from "@/utils/siteInfo";
import type { Metadata } from "next";
import LayoutComponent from "./LayoutComponent";
import SnackbarProvider from "@/components/SnackbarProvider";

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
        <EmotionRegistry>
            <SnackbarProvider>
              <LayoutComponent>
                {children}
              </LayoutComponent>
            </SnackbarProvider>
        </EmotionRegistry>
      </body>
    </html>
  );
}
