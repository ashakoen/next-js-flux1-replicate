import { ThemeProvider } from 'next-themes';
import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: 'no',
}

export const metadata = {
  title: 'Replicate Image Generator',
  description: 'Generate images using Replicate API',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body className={`${inter.className} min-h-screen overflow-y-auto md:overflow-hidden`}>
        <ThemeProvider attribute="class">
          <main className="main-layout w-full h-screen overflow-y-auto md:overflow-hidden">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}