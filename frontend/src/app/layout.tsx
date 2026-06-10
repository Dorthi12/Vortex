import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "./providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NETRAVAAH | AI-Powered Governance Platform",
  description: "Enterprise-grade intelligence, simulation dashboards, policy verification, and predictive modeling for proactive civic governance.",
  keywords: ["governance", "civic tech", "predictive analysis", "AI simulations", "public policy"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground overflow-hidden">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
