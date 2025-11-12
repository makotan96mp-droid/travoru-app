import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '新規プラン作成 — Travoru',
  description: '行き先・日程・目的を入れて旅程を自動生成。',
  alternates: { canonical: '/new' },
  openGraph: {
    type: 'website',
    url: '/new',
    siteName: 'Travoru',
    title: '新規プラン作成 — Travoru',
    description: '行き先・日程・目的を入れて旅程を自動生成。',
    images: ['/favicon.ico']
  },
  twitter: {
    card: 'summary_large_image',
    title: '新規プラン作成 — Travoru',
    description: '行き先・日程・目的を入れて旅程を自動生成。',
    images: ['/favicon.ico']
  }
};

export default function NewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
