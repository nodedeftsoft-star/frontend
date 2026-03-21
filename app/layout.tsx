import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import QueryProvider from "@/providers/queryProvider";
import { SubscriptionProvider } from "@/context/SubscriptionContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "ClosR",
  description: "Real Estate Listing Management App Built for Agents by Agent.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${inter.variable} ${geistMono.variable} antialiased flex items-start max-h-screen`}
      >
        <QueryProvider>
          <SubscriptionProvider>
            {children}
            <Toaster position="top-center" richColors />
          </SubscriptionProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
