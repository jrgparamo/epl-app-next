import "./globals.css";
import { Noto_Sans, Geist } from "next/font/google";
import AuthProvider from "./components/AuthProvider";
import { warmupCache } from "@/lib/warmup";

const notoSans = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata = {
  title: "Top Picks - Football Predictions",
  description: "Make football predictions and compete with friends",
};

// Warmup cache on server start (production only)
if (typeof window === "undefined") {
  warmupCache().catch(console.error);
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`dark ${notoSans.variable} ${geist.variable}`}>
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
