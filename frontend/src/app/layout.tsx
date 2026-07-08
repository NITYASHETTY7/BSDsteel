import type { Metadata } from "next";
import { Oswald, Montserrat } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import AuthGuard from "@/components/AuthGuard";
import Providers from "@/components/Providers";
import ThemeProvider from "@/components/ThemeProvider";
import { Toaster } from "react-hot-toast";

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
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: "inherit",
              fontSize: "13px",
              fontWeight: 600,
              borderRadius: "12px",
              padding: "12px 16px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
              maxWidth: "420px",
            },
            success: {
              style: {
                background: "#0f4c35",
                color: "#ffffff",
                border: "1px solid #1a7a52",
              },
              iconTheme: { primary: "#4ade80", secondary: "#0f4c35" },
            },
            error: {
              style: {
                background: "#7f1d1d",
                color: "#ffffff",
                border: "1px solid #b91c1c",
              },
              iconTheme: { primary: "#f87171", secondary: "#7f1d1d" },
              duration: 6000,
            },
          }}
        />
      </body>
    </html>
  );
}
