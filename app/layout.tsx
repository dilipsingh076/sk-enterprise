import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppNav } from "@/components/AppNav";
import { Main, RootBody, RootHtml } from "@/components/ui";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "e-bill — GST invoice PDF",
  description: "Create GST-style tax invoices and download PDF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RootHtml
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <RootBody className="flex min-h-full flex-col">
        <AppNav />
        <Main className="flex-1 bg-zinc-50">{children}</Main>
      </RootBody>
    </RootHtml>
  );
}
