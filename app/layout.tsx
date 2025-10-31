import type { Metadata } from 'next';

export const metadata: Metadata = {  title: 'Travoru – AI旅程ジェネレーター',
  description: 'AIが時間最適のリアルな旅程を自動生成。主要予約サイトへの導線も完備。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
