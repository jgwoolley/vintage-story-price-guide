import EmotionRegistry from "@/components/EmotionRegistry";
import siteInfo from "@/utils/siteInfo";
import type { Metadata } from "next";
import LayoutComponent from "./LayoutComponent";

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
          <LayoutComponent>
            {children}
          </LayoutComponent>
        </EmotionRegistry>
      </body>
    </html>
  );
}
