import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/providers/Providers';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Banano Wallet Adapter',
  description: 'A lightweight template for Banano apps',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <meta name="color-scheme" content="light dark" />
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
