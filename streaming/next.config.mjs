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
      },
      {
        source: '/stream/:path*',  // 8000포트용 경로
        destination: 'http://3.36.103.8:8000/:path*'
      },
      {
        source: '/socket/:path*',  // 8000포트용 경로
        destination: 'ws://3.36.103.8:8001/:path*',
        basePath: false
      }
    ]
  }
}

export default nextConfig;
