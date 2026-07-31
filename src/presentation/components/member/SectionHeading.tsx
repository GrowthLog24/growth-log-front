interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
}

/**
 * 업적 페이지 공통 섹션 제목
 */
export function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div className="mb-7 max-w-xl" data-member-reveal>
      <span className="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-primary">
        {eyebrow}
      </span>
      <h2 className="text-2xl font-semibold tracking-[-0.04em] text-foreground md:text-4xl">{title}</h2>
      {description && (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
