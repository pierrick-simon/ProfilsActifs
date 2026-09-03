  import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Marianne — typographie officielle de l'État, imposée par la charte graphique.
const marianne = localFont({
  src: [
    { path: "../public/fontes web/Marianne-Thin.woff2", weight: "100", style: "normal" },
    { path: "../public/fontes web/Marianne-Thin_Italic.woff2", weight: "100", style: "italic" },
    { path: "../public/fontes web/Marianne-Light.woff2", weight: "300", style: "normal" },
    { path: "../public/fontes web/Marianne-Light_Italic.woff2", weight: "300", style: "italic" },
    { path: "../public/fontes web/Marianne-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fontes web/Marianne-Regular_Italic.woff2", weight: "400", style: "italic" },
    { path: "../public/fontes web/Marianne-Medium.woff2", weight: "500", style: "normal" },
    { path: "../public/fontes web/Marianne-Medium_Italic.woff2", weight: "500", style: "italic" },
    { path: "../public/fontes web/Marianne-Bold.woff2", weight: "700", style: "normal" },
    { path: "../public/fontes web/Marianne-Bold_Italic.woff2", weight: "700", style: "italic" },
    { path: "../public/fontes web/Marianne-ExtraBold.woff2", weight: "800", style: "normal" },
    { path: "../public/fontes web/Marianne-ExtraBold_Italic.woff2", weight: "800", style: "italic" },
  ],
  variable: "--font-marianne",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Profils Actifs",
  description: "Développer dans le cadre d'un projet pour le ministère Job et Bonheur",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${marianne.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-fond-page font-sans text-texte-principal">
        {children}
      </body>
    </html>
  );
}
