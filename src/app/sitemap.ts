import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.reeefill.com';

  return [
    { url: `${baseUrl}/community` },
    { url: `${baseUrl}/lesson` },
    { url: `${baseUrl}/market` },
    { url: `${baseUrl}/musicmap` },
  ];
}
