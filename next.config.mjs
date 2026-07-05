/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow remote poster/video hosts if you later reference generated media by
  // remote URL instead of downloading it. Local (public/) media needs nothing.
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};

export default nextConfig;
