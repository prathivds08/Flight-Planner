import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SkyRoute — Intelligent Flight Route Optimizer",
  description:
    "Find the cheapest, fastest, and most efficient flight routes between Indian cities using advanced graph algorithms powered by BFS and Dijkstra.",
  keywords: [
    "flight planner",
    "route optimizer",
    "cheap flights India",
    "travel planner",
    "Dijkstra shortest path",
  ],
  openGraph: {
    title: "SkyRoute — Intelligent Flight Route Optimizer",
    description:
      "Find optimal flight routes between Indian cities using advanced graph algorithms.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}
