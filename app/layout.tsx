import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Domain Image Scraper - Find Product Images from Specific Domains',
  description: 'Smart image scraper that finds product images from specific e-commerce domains using advanced search techniques.',
  keywords: 'image scraper, product images, domain search, e-commerce, google images',
  authors: [{ name: 'Domain Image Scraper' }],
  openGraph: {
    title: 'Domain Image Scraper',
    description: 'Find product images from specific domains',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
          {children}
        </div>
      </body>
    </html>
  )
}
