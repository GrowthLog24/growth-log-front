import { Target, Sprout, Rocket } from "lucide-react";

const introItems = [
  {
    icon: Target,
    title: "도전",
    description: "매일 새로운 도전이 기다리고 있어요",
  },
  {
    icon: Sprout,
    title: "성장",
    description: "함께라서 더 빠르게 성장하고 있어요",
  },
  {
    icon: Rocket,
    title: "기회",
    description: "기회는 준비된 사람에게!",
  },
];

export function IntroSection() {
  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4">
            WHAT'S GROWTH LOG
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            그로스로그는 어떤 모임인가요?
          </h2>
        </div>

        {/* Icon Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
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

        {/* Description */}
        <p className="text-center text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          우리는 개발자로서 매일 새로운 영역에 도전하고, 꾸준히 성장하며
          <br className="hidden md:block" />
          준비된 상태로 멋진 기회를 만들고 있습니다.
        </p>
      </div>
    </section>
  );
}
