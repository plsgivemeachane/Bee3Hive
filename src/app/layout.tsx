import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react"

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})


export const metadata: Metadata = {
  title: "Bee3Hive App",
  description: "Bee3Hive App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        {/* <nav className="bg-background p-2 flex justify-between mx-8">
          <p>Bee3Hive</p>
          <p>Do with ❤️ by quanvn</p>
        </nav> */}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
