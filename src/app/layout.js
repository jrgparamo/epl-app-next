import "./globals.css";
import AuthProvider from "./components/AuthProvider";
import { warmupCache } from "@/lib/warmup";

export const metadata = {
  title: "Predict FotMob Clone - Football Predictions",
  description: "Make football predictions and compete with friends",
};

// Warmup cache on server start (production only)
if (typeof window === "undefined") {
  warmupCache().catch(console.error);
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
