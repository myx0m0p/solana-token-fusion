/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: { unoptimized: true },
  async rewrites() {
    return [
      {
        source: '/:any*', // Match all paths
        destination: '/', // Redirect to the main page
      },
    ];
  },
};

module.exports = nextConfig;
