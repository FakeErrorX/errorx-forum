import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DefaultSeo } from 'next-seo';
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AuthSessionProvider } from "@/components/session-provider";
import { defaultSEO } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: defaultSEO.defaultTitle,
  description: defaultSEO.description,
  keywords: defaultSEO.additionalMetaTags?.find(tag => tag.name === 'keywords')?.content,
  authors: [{ name: 'ErrorX Forum' }],
  creator: 'ErrorX Forum',
  publisher: 'ErrorX Forum',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://errorx.org'),
  alternates: {
    canonical: defaultSEO.canonical,
  },
  openGraph: {
    title: defaultSEO.openGraph?.title,
    description: defaultSEO.openGraph?.description,
    url: defaultSEO.openGraph?.url,
    siteName: defaultSEO.openGraph?.siteName,
    images: defaultSEO.openGraph?.images ? defaultSEO.openGraph.images.map(img => ({
      url: img.url,
      width: img.width || 1200,
      height: img.height || 630,
      alt: img.alt || 'ErrorX Forum',
    })) : undefined,
    locale: defaultSEO.openGraph?.locale,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: defaultSEO.openGraph?.title,
    description: defaultSEO.openGraph?.description,
    images: defaultSEO.openGraph?.images ? defaultSEO.openGraph.images.map(img => ({
      url: img.url,
      width: img.width || 1200,
      height: img.height || 630,
      alt: img.alt || 'ErrorX Forum',
    })) : undefined,
    creator: '@FakeErrorX',
    site: '@FakeErrorX',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code', // Replace with actual verification code
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthSessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
