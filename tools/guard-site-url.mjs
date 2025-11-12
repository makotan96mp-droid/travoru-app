const u = process.env.NEXT_PUBLIC_SITE_URL || "";
const isCI = !!process.env.CI;
if (isCI && (!u || /^https?:\/\/localhost/i.test(u))) {
  console.error(`❌ NEXT_PUBLIC_SITE_URL is invalid in CI: "${u}"`);
  process.exit(1);
}
console.log(`✅ NEXT_PUBLIC_SITE_URL=${u||"(empty, non-CI ok)"}`);
