export default function Head() {
  const desc = "AIが時間最適のリアルな旅程を自動生成。主要予約サイトへの導線も完備。";
  return (
    <>
      <meta name="description" content={desc} />
      <meta property="og:description" content={desc} />
      <meta name="twitter:description" content={desc} />
      <meta name="x-probe" content="head-tsx-ok" />
    </>
  );
}
