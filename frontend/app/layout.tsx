import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { ConnectWalletTopRight } from "@/components/ConnectWalletTopRight";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: "HelpCrypt - Compassion with Confidentiality",
  description: "Privacy-preserving aid platform using FHE encryption. Beneficiaries submit encrypted applications, donors verify needs without exposing personal details.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">
        {/* Background Effect */}
        <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-background via-background to-card z-[-20]" />
        
        <Providers>
          {/* Navigation */}
          <nav className="fixed top-0 left-0 right-0 z-50 flex w-full px-6 md:px-12 h-20 justify-between items-center bg-background/80 backdrop-blur-sm border-b border-border/50">
            <div className="flex items-center gap-3">
              <Logo />
              <span className="text-xl font-bold text-foreground hidden sm:block">HelpCrypt</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <ConnectWalletTopRight />
            </div>
          </nav>
          
          {/* Main Content with top padding for fixed nav */}
          <main className="pt-20">
            {children}
          </main>
          
          {/* Footer */}
          <footer className="border-t border-border/50 py-8 px-6">
            <div className="container mx-auto max-w-6xl text-center text-sm text-muted-foreground">
              <p>Powered by Zama FHE Technology</p>
              <p className="mt-2">All data encrypted with Fully Homomorphic Encryption</p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
