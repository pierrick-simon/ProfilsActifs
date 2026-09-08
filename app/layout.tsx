import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/toast";
import SiteFooter from "@/components/site-footer";
import CandidateNotice from "@/components/candidate-notice";
import AccountMenu from "@/components/account-menu";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Profils Actifs",
  description: "Développer dans le cadre d'un projet pour le ministère Job et Bonheur",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-fond-page font-sans text-texte-principal">
        <CandidateNotice />
        <ToastProvider>
          <div className="flex flex-1 flex-col">{children}</div>
          <AccountMenu />
        </ToastProvider>
        <SiteFooter />
      </body>
    </html>
  );
}
