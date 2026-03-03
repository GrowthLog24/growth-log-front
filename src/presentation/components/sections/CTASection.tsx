import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MessageCircle, ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="section-padding bg-primary">
      <div className="container-custom">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Left: Text */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              다양한 분야에 종사하는
              <br />
              멤버들과 함께하며
              <br />
              새로운 인사이트를 얻어요
            </h2>
            <p className="mt-4 text-lg text-white/80 max-w-lg">
              이미 많은 멤버들이 그로스로그와 함께 성장하고 있습니다.
            </p>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="bg-white text-primary hover:bg-white/90"
            >
              <Link href="/recruit" className="flex items-center gap-2">
                5기 지원하기
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="bg-transparent text-white border-white hover:bg-white/10"
            >
              <a
                href="https://pf.kakao.com/_xgxkxkxj"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                카카오톡 문의
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
