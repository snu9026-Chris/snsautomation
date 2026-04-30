import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { PlatformsProvider } from '@/lib/context/PlatformsContext';
import Header from '@/components/layout/Header';
import AppShell from '@/components/layout/AppShell';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'LoopDrop — 멀티플랫폼 콘텐츠 발행',
  description: '하나의 영상을 5개 플랫폼에 한 번에 발행하는 커맨드 센터',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${inter.variable} h-full antialiased`}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="h-full overflow-hidden">
        <AuthProvider>
          <PlatformsProvider>
            <Header />
            <AppShell>{children}</AppShell>
          </PlatformsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
