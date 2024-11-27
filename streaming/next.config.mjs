/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['실제 사용할 도메인']
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://3.36.103.8:8001/:path*'
      }
    ]
  }
}

export default nextConfig;
