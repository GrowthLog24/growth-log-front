import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["madkr.tplinkdns.com"],
  /**
   * 정적 위키(/public/wiki/index.html)를 /wiki 로 서빙한다.
   *
   * public 의 파일은 경로 그대로만 서빙되므로 /wiki 는 404 가 난다.
   * (/wiki/ 는 trailingSlash 기본값에 따라 308 로 /wiki 로 보내지고, 결국 같이 404)
   * 위키의 canonical 이 /wiki 이므로 이 rewrite 가 없으면 색인이 404 를 가리킨다.
   *
   * 그로스톡 REA 실습 핸드아웃(/public/growthtalk/index.html)도 같은 방식으로 /growthtalk 에 연결한다.
   * 폰트는 상대경로가 /fonts 로 풀리지 않도록 /growthtalk/fonts/... 절대경로로 참조한다.
   */
  async rewrites() {
    return [
      { source: "/wiki", destination: "/wiki/index.html" },
      { source: "/growthtalk", destination: "/growthtalk/index.html" },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
