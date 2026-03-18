import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'VedaAI – AI Assessment Creator',
  description: 'Create AI-powered question papers for your students',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-page-bg text-text-primary antialiased`}>{children}</body>
    </html>
  );
}
