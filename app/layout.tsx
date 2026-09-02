  import type { Metadata } from "next";
import { Inter, Spectral } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spectral = Spectral({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-spectral",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Profils Actifs",
  description: "Développer dans le cadre d'un projet pour le ministère Job et Bonheur",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${spectral.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-fond-page font-sans text-texte-principal">
        {children}
      </body>
    </html>
  );
}
