export default function Head() {
  return (
    <>
      {/* Google Fonts への早期接続 */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />

      {/* ファビコン/OGなど（必要に応じて） */}

      {/* Above-the-fold で使う代表画像を事前読み込み（必要なら） */}
      <link rel="preload" as="image" href="/og/og-1200x630.jpg" />

      {/* ここに他の <meta> / <link> を追加可能 */}
    </>
  );
}
