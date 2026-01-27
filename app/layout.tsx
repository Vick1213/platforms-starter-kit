import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Providers } from './providers';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
});

export const metadata: Metadata = {
  title: 'Supply Me - Connect with Asian Manufacturers',
  description: 'Your B2B platform to discover manufacturers in Asia, check tariffs, manage supply chains, and get transport quotes for your imports.'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
        <Providers>
          {children}
        </Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}
