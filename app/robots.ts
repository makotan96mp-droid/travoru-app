import type { MetadataRoute } from 'next';

const isProd = (process.env.NEXT_PUBLIC_SITE_ENV ?? 'prod') === 'prod';
const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://travoru.app';

export default function robots(): MetadataRoute.Robots {
  return isProd
    ? { rules: [{ userAgent: '*', allow: '/' }], sitemap: `${base}/sitemap.xml` }
    : { rules: [{ userAgent: '*', disallow: '/' }] };
}
