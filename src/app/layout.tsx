import type { Metadata } from 'next'
import { GoogleAnalytics } from '@next/third-parties/google'
import { Providers } from './providers'
import { StructuredData } from '@/components/StructuredData'
import {
  SITE_URL,
  buildSeoMetadata,
  organizationJsonLd,
  webSiteJsonLd,
} from '@/lib/seo'
import '@/index.css'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  ...buildSeoMetadata({
    title: 'Serenity Scrolls | Bible Verse Scrolls for Peace & Encouragement',
    description:
      'Find peace in every emotion with 96 color-coded Bible verse scrolls for anxiety, gratitude, sadness, joy, frustration, and troubled moments.',
    path: '/',
    image: '/tube-product-real.png',
  }),
  icons: {
    icon: '/logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <StructuredData data={organizationJsonLd} />
        <StructuredData data={webSiteJsonLd} />
        <Providers>
          {children}
        </Providers>
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
      </body>
    </html>
  )
}
