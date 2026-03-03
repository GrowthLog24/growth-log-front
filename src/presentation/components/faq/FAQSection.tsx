"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MarkdownContent } from "@/presentation/components/common";
import type { FAQ, FAQCategoryItem } from "@/domain/entities";

interface FAQSectionProps {
  categories: FAQCategoryItem[];
  groupedFAQs: Record<string, FAQ[]>;
}

/**
 * FAQ 아코디언 섹션 (클라이언트 컴포넌트)
 * Radix UI Accordion의 SSR 하이드레이션 이슈를 방지하기 위해 분리
 */
export function FAQSection({ categories, groupedFAQs }: FAQSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {categories.map((category) => {
        const categoryFaqs = groupedFAQs[category.name] || [];
        if (categoryFaqs.length === 0) return null;

        return (
          <div key={category.id}>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full" />
              {category.name}
            </h3>
            <Accordion type="single" collapsible className="space-y-2">
              {categoryFaqs.map((faq) => (
                <AccordionItem
                  key={faq.id}
                  value={faq.id}
                  className="bg-white rounded-lg px-4"
                >
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent>
                    <MarkdownContent content={faq.answerMd} className="text-muted-foreground" />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        );
      })}
    </div>
  );
}
