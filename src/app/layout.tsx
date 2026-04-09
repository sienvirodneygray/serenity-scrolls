import type { Metadata } from 'next'
import { Providers } from './providers'
import '@/index.css'

export const metadata: Metadata = {
  title: 'Serenity Scrolls',
  description: 'AI-powered spiritual companion',
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
      </body>
    </html>
  )
}
