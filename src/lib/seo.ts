import type { Metadata } from "next";

export const SITE_URL = "https://serenityscrolls.faith";
export const SITE_NAME = "Serenity Scrolls";

export type SeoMetadataConfig = {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  ogTitle?: string;
  ogDescription?: string;
  image?: string;
  twitterCard?: "summary" | "summary_large_image";
};

export const absoluteUrl = (path: string) => {
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

export const canonicalUrl = (path: string) => (
  path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`
);

export const buildSeoMetadata = ({
  title,
  description,
  path,
  noindex = false,
  ogTitle,
  ogDescription,
  image,
  twitterCard = image ? "summary_large_image" : "summary",
}: SeoMetadataConfig): Metadata => {
  const canonical = canonicalUrl(path);
  const imageUrl = image ? absoluteUrl(image) : undefined;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    robots: noindex
      ? {
          index: false,
          follow: true,
          googleBot: {
            index: false,
            follow: true,
          },
        }
      : {
          index: true,
          follow: true,
        },
    openGraph: {
      title: ogTitle || title,
      description: ogDescription || description,
      url: canonical,
      siteName: SITE_NAME,
      type: "website",
      ...(imageUrl
        ? {
            images: [
              {
                url: imageUrl,
                alt: `${SITE_NAME} Scripture scrolls and devotional tools`,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: twitterCard,
      title: ogTitle || title,
      description: ogDescription || description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  };
};

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: absoluteUrl("/logo.png"),
  contactPoint: {
    "@type": "ContactPoint",
    email: "info@serenityscrolls.faith",
    contactType: "customer support",
  },
};

export const webSiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
};

export const breadcrumbJsonLd = (items: Array<{ name: string; path: string }>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: canonicalUrl(item.path),
  })),
});

export const serenityProductsJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Serenity Scrolls Tube",
    image: absoluteUrl("/tube-product-real.png"),
    description:
      "A keepsake tube with 96 color-coded Bible verse scrolls organized by emotion for anxiety, gratitude, sadness, joy, frustration, and troubled moments.",
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    offers: {
      "@type": "Offer",
      price: "24.99",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: canonicalUrl("/shop"),
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Serenity Scrolls Reflection Journal",
    image: absoluteUrl("/journal-product.jpg"),
    description:
      "A guided Christian reflection journal for prayer, Scripture reflection, gratitude, emotional processing, and going deeper with Serenity Scrolls verses.",
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    offers: {
      "@type": "Offer",
      price: "39.99",
      priceCurrency: "USD",
      availability: "https://schema.org/PreOrder",
      url: canonicalUrl("/presale-journal"),
    },
  },
];

export const faqPageJsonLd = (
  faqs: Array<{ question: string; answer: string }>
) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
});
