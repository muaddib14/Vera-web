import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import SolanaWalletProvider from "@/components/SolanaWalletProvider";
import ThemeProvider from "@/components/ThemeProvider";
import "./globals.css";

// Runs before paint, straight in <head> — sets data-theme from localStorage
// so the page never flashes dark-then-light (or vice versa) on load.
const THEME_INIT_SCRIPT = `
(function() {
  try {
    var t = localStorage.getItem('vera-theme');
    document.documentElement.dataset.theme = t === 'light' ? 'light' : 'dark';
  } catch (e) {}
})();
`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "VERA — See the rug before you sign",
  description:
    "A Solana swap router that checks freeze authority, mint authority, LP lock, and holder concentration inline with your quote — not a score, a verifiable checklist.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <SolanaWalletProvider>{children}</SolanaWalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
