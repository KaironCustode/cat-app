import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shenzy - Cat Behavior Analyzer",
  description: "Scopri cosa pensa il tuo gatto con l'intelligenza artificiale",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#FFFBF7" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}