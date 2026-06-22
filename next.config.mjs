/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Allow images from all major rental listing sources
    remotePatterns: [
      // Facebook / Meta CDN
      { protocol: "https", hostname: "**.fbcdn.net" },
      { protocol: "https", hostname: "**.facebook.com" },
      { protocol: "https", hostname: "scontent.**.fna.fbcdn.net" },
      // Zillow
      { protocol: "https", hostname: "**.zillowstatic.com" },
      { protocol: "https", hostname: "photos.zillowstatic.com" },
      // Apartments.com
      { protocol: "https", hostname: "**.apartments.com" },
      { protocol: "https", hostname: "images1.apartments.com" },
      // Craigslist
      { protocol: "https", hostname: "images.craigslist.org" },
      // Generic / other sources
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
}

export default nextConfig
