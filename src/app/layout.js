import "./globals.css";

export const metadata = {
  title: "Predict FotMob Clone - Football Predictions",
  description: "Make football predictions and compete with friends",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
