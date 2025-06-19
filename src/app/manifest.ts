import siteInfo from '@/utils/siteInfo'
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteInfo.title,
    short_name: siteInfo.title,
    description: siteInfo.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/next.svg',
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any"
      },
    ],
  }
}