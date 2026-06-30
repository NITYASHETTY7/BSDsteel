import type { Metadata } from "next";
import { Oswald, Montserrat } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import AuthGuard from "@/components/AuthGuard";
import Providers from "@/components/Providers";
import ThemeProvider from "@/components/ThemeProvider";

const oswald = Oswald({
  variable: "--font-display",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BSD Steel - Inventory & Receivables",
  description: "Strength Forged in Trust, est. 1983",
  icons: {
    icon: "/images/bsd-logo.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${oswald.variable} ${montserrat.variable}`}>
      <body className="flex h-screen overflow-hidden bg-background">
        <ThemeProvider>
          <Providers>
            <AuthGuard>
              <AppShell>{children}</AppShell>
            </AuthGuard>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
