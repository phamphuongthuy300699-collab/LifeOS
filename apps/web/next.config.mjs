/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async rewrites() {
    const rawApiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
    if (!rawApiBase || !rawApiBase.startsWith('http')) {
      return [];
    }
    const normalized = rawApiBase.replace(/\/$/, '');
    const destination = normalized.endsWith('/api/v1')
      ? `${normalized}/:path*`
      : `${normalized}/api/v1/:path*`;
    return [
      {
        source: '/api/v1/:path*',
        destination,
      },
    ];
  },

  // PWA headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];
  },
};

export default nextConfig;
