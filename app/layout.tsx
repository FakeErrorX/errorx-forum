import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DefaultSeo } from 'next-seo';
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AuthSessionProvider } from "@/components/session-provider";
import { GoogleAnalyticsComponent } from "@/components/analytics/google-analytics";
import { defaultSEO } from "@/lib/seo";

// Validate required environment variables
const requiredEnvVars = {
  SITE_URL: process.env.SITE_URL,
  TWITTER_HANDLE: process.env.TWITTER_HANDLE,
  TWITTER_SITE: process.env.TWITTER_SITE,
};

for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  preload: false, // Disable preloading to reduce warnings
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false, // Disable preloading to reduce warnings
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
  metadataBase: new URL(process.env.SITE_URL!),
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
    creator: process.env.TWITTER_HANDLE!,
    site: process.env.TWITTER_SITE!,
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
        <GoogleAnalyticsComponent gaId={process.env.NEXT_PUBLIC_GA_ID || ''} />
      </body>
    </html>
  );
}
