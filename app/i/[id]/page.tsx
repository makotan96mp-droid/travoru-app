import type { Metadata, ResolvingMetadata } from "next";
import Image from "next/image";
// "@/lib/seo" が使えない場合は下行に切り替え:
// import { CITY_META, absoluteImage, SITE_URL } from "../../lib/seo";
import { CITY_META, absoluteImage, SITE_URL } from "@/lib/seo";

// Next.js 16: params は Promise なので await が必要
type Props = { params: Promise<{ id: string }> };

export async function generateMetadata(
  { params }: Props,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const key = id?.toLowerCase();
  const city = CITY_META[key as keyof typeof CITY_META];

  const title = city?.title ?? "Travoru";
  const description = city?.description ?? "あなたの旅程をサクッと作成。";
  const ogImage = absoluteImage(city?.image ?? "/images/hero-poster.jpg");
  const url = `${SITE_URL}/i/${key ?? ""}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    robots: { index: true, follow: true },
  };
}

export default async function CityPage({ params }: Props) {
  const { id } = await params;
  const key = id?.toLowerCase();
  const city = CITY_META[key as keyof typeof CITY_META];
  if (!city) return <main className="min-h-dvh p-8">Not found</main>;

  return (
    <main className="min-h-dvh p-8 space-y-6">
      <h1 className="text-3xl font-semibold">{city.title}</h1>
      <p className="text-white/80 max-w-prose">{city.description}</p>
      <div className="rounded-2xl overflow-hidden border border-white/15 max-w-3xl">
        <Image
          src={city.image}
          alt={city.title}
          width={1600}
          height={900}
          sizes="(max-width: 768px) 100vw, 75vw"
          className="w-full h-auto object-cover"
          priority
        />
      </div>
    </main>
  );
}
