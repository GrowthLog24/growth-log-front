import { Badge } from "@/components/ui/badge";
import { testimonialRepository } from "@/infrastructure/repositories";
import type { Testimonial } from "@/domain/entities";
import { serializeFirestoreData, type SerializedFirestoreData } from "@/shared/utils/serialize";

export async function MemberTestimonialSection() {
  // Firestore에서 활성화된 후기 3개 가져오기
  const testimonials = await testimonialRepository.getActiveTestimonials(3);

  // 데이터가 없으면 섹션을 렌더링하지 않음
  if (testimonials.length === 0) {
    return null;
  }

  // Client Component로 전달하기 위해 Plain Object로 직렬화
  const serializedTestimonials = serializeFirestoreData(testimonials);

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
          {serializedTestimonials.map((testimonial: SerializedFirestoreData<Testimonial>) => (
            <TestimonialCard
              key={testimonial.id}
              testimonial={testimonial}
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
}: {
  testimonial: SerializedFirestoreData<Testimonial>;
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
          {testimonial.avatarPath ? (
            <img
              src={testimonial.avatarPath}
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
