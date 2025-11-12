import { ImageResponse } from 'next/og';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px', height: '630px', display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: 'linear-gradient(135deg,#0ea5e9,#6366f1)',
          color: 'white', fontSize: 72, fontWeight: 800, letterSpacing: -1.5, padding: 48
        }}
      >
        新規プラン作成 — Travoru
      </div>
    ),
    size
  );
}
