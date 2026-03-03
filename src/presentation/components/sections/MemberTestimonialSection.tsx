import { Badge } from "@/components/ui/badge";
import { testimonialRepository } from "@/infrastructure/repositories";
import { getStorageUrl } from "@/shared/utils";
import type { Testimonial } from "@/domain/entities";

// Fallback 데이터 - Firestore 데이터가 없을 때 사용
const fallbackTestimonials: Omit<Testimonial, "createdAt" | "updatedAt">[] = [
  {
    id: "1",
    category: "Back-End",
    content:
      "그로스로그 덕분에 사이드 프로젝트 개발 역량, 특히 배포와 인프라에 대한 능력을 많이 쌓을 수 있었습니다. 여러 분야의 개발자들과 협업하면서 시야가 넓어졌어요.",
    name: "이민경",
    generation: 3,
    order: 1,
    isActive: true,
  },
  {
    id: "2",
    category: "Mobile App",
    content:
      "주간 회의가 정말 많은 인사이트를 줬어요. 개발뿐만 아니라 기획이나 디자인에 대한 피드백도 받을 수 있어서 좋았습니다. 그로스로그를 통해 성장을 체감하고 있습니다.",
    name: "박예승",
    generation: 2,
    order: 2,
    isActive: true,
  },
  {
    id: "3",
    category: "Back-End",
    content:
      "그로스로그를 통해 다양한 분야의 개발자들을 만날 수 있었습니다. 서로의 경험을 공유하면서 새로운 관점을 얻게 되었고, 무엇보다 함께 성장하는 느낌이 좋았습니다.",
    name: "박지훈",
    generation: 4,
    order: 3,
    isActive: true,
  },
];

/**
 * 아바타 URL을 가져오는 헬퍼 함수
 */
function getAvatarUrl(testimonial: Partial<Testimonial>): string | null {
  if (testimonial.avatarPath) {
    return getStorageUrl(testimonial.avatarPath);
  }
  return null;
}

export async function MemberTestimonialSection() {
  // Firestore에서 활성화된 후기 3개 가져오기
  let testimonials = await testimonialRepository.getActiveTestimonials(3);

  // Firestore 데이터가 없으면 fallback 사용
  if (testimonials.length === 0) {
    testimonials = fallbackTestimonials as Testimonial[];
  }

  return (
    <section className="section-padding bg-gray-black">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-snug">
            다양한 분야에 종사하는
            <br />
            멤버분들과 함께하며
            <br />
            새로운 인사이트를 얻어요
          </h2>
        </div>

        {/* Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <TestimonialCard
              key={testimonial.id}
              testimonial={testimonial}
              avatarUrl={getAvatarUrl(testimonial)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * 후기 카드 컴포넌트
 */
function TestimonialCard({
  testimonial,
  avatarUrl,
}: {
  testimonial: Partial<Testimonial>;
  avatarUrl: string | null;
}) {
  return (
    <article className="bg-white rounded-2xl p-6 flex flex-col">
      {/* Category Badge */}
      <Badge
        variant="outline"
        className="self-start mb-4 text-xs font-medium"
      >
        {testimonial.category}
      </Badge>

      {/* Content */}
      <p className="text-sm text-muted-foreground leading-relaxed flex-1">
        {testimonial.content}
      </p>

      {/* Profile */}
      <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-5">
        <div className="w-10 h-10 rounded-full bg-gray-4 overflow-hidden">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={testimonial.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-3 to-gray-4 flex items-center justify-center">
              <span className="text-sm font-medium text-muted-foreground">
                {testimonial.name?.charAt(0)}
              </span>
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {testimonial.name}
          </p>
          <p className="text-xs text-muted-foreground">
            Growth Log {testimonial.generation}기
          </p>
        </div>
      </div>
    </article>
  );
}
