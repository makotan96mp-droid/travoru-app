/** @type {import('next').NextConfig} */
const config = {
  experimental: {
    optimizeCss: true,      // ← これで Critters が有効化され、レンダーブロッキングCSSをインライン化
  },
  // 既存の他設定があればここに追記してOK
};
module.exports = config;
