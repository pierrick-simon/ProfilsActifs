import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Profils Actifs",
  description: "Développer dans le cadre d'un projet pour le ministère Job et Bonheur",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
