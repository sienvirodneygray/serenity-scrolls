import type { Metadata } from 'next'
import { GoogleAnalytics } from '@next/third-parties/google'
import { Providers } from './providers'
import '@/index.css'

export const metadata: Metadata = {
  title: 'Serenity Scrolls',
  description: 'AI-powered spiritual companion',
  icons: {
    icon: '/logo.png',
  },
}

import { Suspense } from 'react'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Suspense fallback={<div>Loading...</div>}>
            {children}
          </Suspense>
        </Providers>
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
      </body>
    </html>
  )
}
