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
    <div className="mb-6">
      <span className="mb-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wide text-primary">
        {eyebrow}
      </span>
      <h2 className="text-2xl font-bold text-foreground md:text-3xl">{title}</h2>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
