import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SymbioseDB RAG App",
  description: "AI-powered search and Q&A with SymbioseDB",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
