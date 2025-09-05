import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from 'sonner';
import "./globals.css";

export const metadata: Metadata = {
  title: "TextureGen - AI-Powered 3D Texture Generation",
  description: "Revolutionary AI-powered texture generation for 3D models. Upload your model, describe your vision, and watch as AI creates professional-grade PBR textures in real-time.",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
  themeColor: '#111827',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans`}>
        {children}
        <Toaster 
          position="top-center"
          toastOptions={{
            style: {
              background: 'var(--background)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
            },
          }}
          closeButton
        />
      </body>
    </html>
  );
}
