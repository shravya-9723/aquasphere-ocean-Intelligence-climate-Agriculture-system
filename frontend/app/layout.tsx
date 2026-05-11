import type { Metadata } from "next";
import Link from "next/link";

import "./globals.css";

export const metadata: Metadata = {
  title: "AquaSphere",
  description: "Where Oceans Meet Agriculture Intelligence",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>

        {/* 🌊 NAVBAR */}
        <header style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "12px 20px",
          background: "#0a1f2e",
          color: "white"
        }}>
          <div>🌊 AquaSphere</div>

          <nav style={{ display: "flex", gap: "15px" }}>
            <Link href="/map">Map</Link>
            <Link href="/ai">AI</Link>
            <Link href="/data">Data</Link>
            <Link href="/trends">Trends</Link>
            <Link href="/trade">Trade</Link>
            <Link href="/profile">Profile</Link>
          </nav>
        </header>

        {/* CONTENT */}
        <main>{children}</main>

      </body>
    </html>
  );
}
