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
        source: '/stream/:path*',
        destination: 'http://3.36.103.8:8000/:path*'
      },
      {
        source: '/socket/:path*',
        destination: 'http://3.36.103.8:8001/:path*'
      }
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.iamport.kr",
              "connect-src 'self' ws: wss: http: https:",
              "img-src 'self' blob: data:",
              "media-src 'self' blob:",
              "upgrade-insecure-requests",
            ].join('; ')
          }
        ]
      }
    ]
  }
}

export default nextConfig;