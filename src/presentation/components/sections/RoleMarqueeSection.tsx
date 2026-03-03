"use client";

const topRowTags = [
  "프론트엔드",
  "백엔드",
  "IT 프로젝트 사업관리",
  "IT 기획",
  "브랜드 마케팅",
  "데이터베이스",
  "iOS",
  "Android",
  "데브옵스",
];

const bottomRowTags = [
  "인공지능 데이터",
  "솔루션",
  "웹 디자이너",
  "데이터 엔지니어",
  "인공지능",
  "게임",
  "CG 아트 포지션",
  "마케팅 세일즈",
  "HR",
];

export function RoleMarqueeSection() {
  return (
    <section className="bg-gray-black overflow-hidden">
      {/* Divider */}
      <div className="container-custom">
        <div className="border-t border-white/10" />
      </div>

      {/* Content */}
      <div className="py-16">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-white/60 text-sm md:text-base">
            이외에도 많은 멤버분들이 함께하고 있어요
          </p>
        </div>

        {/* Top Row - Scrolls Left */}
        <div className="relative mb-4">
          <div className="flex animate-marquee-left-4">
            <MarqueeRow tags={topRowTags} />
            <MarqueeRow tags={topRowTags} />
            <MarqueeRow tags={topRowTags} />
            <MarqueeRow tags={topRowTags} />
          </div>
        </div>

        {/* Bottom Row - Scrolls Right */}
        <div className="relative">
          <div className="flex animate-marquee-right-4">
            <MarqueeRow tags={bottomRowTags} />
            <MarqueeRow tags={bottomRowTags} />
            <MarqueeRow tags={bottomRowTags} />
            <MarqueeRow tags={bottomRowTags} />
          </div>
        </div>
      </div>
    </section>
  );
}

function MarqueeRow({ tags }: { tags: string[] }) {
  return (
    <div className="flex gap-3 px-1.5">
      {tags.map((tag, index) => (
        <span
          key={`${tag}-${index}`}
          className="inline-flex items-center px-5 py-2 rounded-full border border-white/30 text-white text-sm whitespace-nowrap"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
