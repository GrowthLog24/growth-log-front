import { Bot, Sprout, Rocket } from "lucide-react";

const introItems = [
  {
    icon: Bot,
    title: "AI × 실전",
    description:
      "Claude, Cursor, Copilot을 실무처럼. AI 페어코딩으로 혼자서는 못 만들던 걸 만들어봅니다.",
  },
  {
    icon: Sprout,
    title: "함께 성장",
    description:
      "다양한 분야의 멤버들과 성장일지를 쓰고, 스터디하고, 서로의 코드를 리뷰합니다.",
  },
  {
    icon: Rocket,
    title: "기회로 연결",
    description:
      "프로젝트 · 경진대회 · 커리어 세미나로 배움을 실제 결과물과 기회로 이어갑니다.",
  },
];

export function IntroSection() {
  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4">
            WHAT&apos;S GROWTH LOG
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            혼자 배우면 도구, 함께 배우면 문화
          </h2>
          <p className="mt-4 text-muted-foreground">
            AI 시대의 개발자에게 필요한 세 가지를 한 곳에서.
          </p>
        </div>

        {/* Icon Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {introItems.map((item) => (
            <div
              key={item.title}
              className="group flex flex-col items-center text-center p-8 rounded-2xl bg-gray-6 hover:bg-primary hover:shadow-lg transition-all duration-300"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 group-hover:bg-white/20 flex items-center justify-center mb-6 transition-colors duration-300">
                <item.icon className="w-8 h-8 text-primary group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-bold text-foreground group-hover:text-white mb-2 transition-colors duration-300">
                {item.title}
              </h3>
              <p className="text-sm text-muted-foreground group-hover:text-white/80 transition-colors duration-300">
                {item.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
