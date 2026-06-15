import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Nutri Craft - Petualangan Gizi Seimbang',
    short_name: 'Nutri Craft',
    description: 'Game edukasi simulasi pilihan makanan sehat dan gizi seimbang harian remaja berdasarkan prinsip Isi Piringku Kemenkes RI.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fffbeb',
    theme_color: '#10b981',
    icons: [
      {
        src: 'https://cdn-icons-png.flaticon.com/512/3050/3050125.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: 'https://cdn-icons-png.flaticon.com/512/3050/3050125.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      }
    ],
  };
}
