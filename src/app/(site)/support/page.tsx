import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, MapPin, MessageCircle } from "lucide-react";
import { FAQSection, type FAQCategory, type FAQItem } from "@/presentation/components/faq";
import { GoogleMap, MarkdownContent } from "@/presentation/components/common";
import { faqRepository } from "@/infrastructure/repositories/faqRepository";
import { faqCategoryRepository } from "@/infrastructure/repositories/faqCategoryRepository";
import { noticeRepository } from "@/infrastructure/repositories/noticeRepository";
import { siteConfigRepository } from "@/infrastructure/repositories/siteConfigRepository";
import { formatDate } from "@/shared/utils/date";

export const metadata: Metadata = {
  title: "Support",
  description: "그로스로그 공지사항, FAQ, 찾아오시는 길을 안내합니다.",
};

/**
 * FAQ 데이터를 카테고리별로 그룹화 (직렬화 가능한 형태로 변환)
 */
function groupFAQsByCategory(
  faqs: Awaited<ReturnType<typeof faqRepository.getFAQs>>,
  categories: Awaited<ReturnType<typeof faqCategoryRepository.getCategories>>
): { serializedCategories: FAQCategory[]; groupedFAQs: Record<string, FAQItem[]> } {
  // 카테고리 직렬화 (Timestamp 제거)
  const serializedCategories: FAQCategory[] = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    order: cat.order,
  }));

  // FAQ를 카테고리별로 그룹화 및 직렬화
  const groupedFAQs: Record<string, FAQItem[]> = {};

  // 카테고리 순서대로 초기화
  serializedCategories.forEach((cat) => {
    groupedFAQs[cat.name] = [];
  });

  // FAQ를 해당 카테고리에 추가 (직렬화)
  faqs.forEach((faq) => {
    if (groupedFAQs[faq.category]) {
      groupedFAQs[faq.category].push({
        id: faq.id,
        category: faq.category,
        question: faq.question,
        answerMd: faq.answerMd,
        order: faq.order,
        isActive: faq.isActive,
      });
    }
  });

  return { serializedCategories, groupedFAQs };
}

export default async function SupportPage() {
  // Firestore에서 데이터 가져오기
  const [faqs, categories, notices, siteConfig] = await Promise.all([
    faqRepository.getFAQs(),
    faqCategoryRepository.getCategories(),
    noticeRepository.getNotices(),
    siteConfigRepository.getSiteConfig(),
  ]);

  // 카테고리별로 FAQ 그룹화 및 직렬화
  const { serializedCategories, groupedFAQs } = groupFAQsByCategory(faqs, categories);

  return (
    <>
      {/* Notice Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-sm text-muted-foreground">NOTICE BOARD</span>
              <h1 className="text-3xl font-bold text-foreground mt-1">공지사항</h1>
            </div>
          </div>

          {/* Notice List */}
          <div className="border rounded-lg divide-y">
            {notices.map((notice) => (
              <Link
                key={notice.id}
                href={`/support/notice/${notice.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-6 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {notice.isPinned && (
                    <span className="shrink-0 px-2 py-0.5 bg-primary text-white text-xs rounded">
                      공지
                    </span>
                  )}
                  <span className="text-foreground truncate">{notice.title}</span>
                </div>
                <div className="flex items-center gap-4 shrink-0 ml-4">
                  <span className="text-sm text-muted-foreground hidden sm:block">
                    {formatDate(notice.publishedAt)}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-padding bg-gray-6">
        <div className="container-custom">
          <div className="text-center mb-12">
            <span className="text-sm text-muted-foreground">FAQ</span>
            <h2 className="text-3xl font-bold text-foreground mt-1">자주 묻는 질문</h2>
          </div>

          <FAQSection categories={serializedCategories} groupedFAQs={groupedFAQs} />
        </div>
      </section>

      {/* Location Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="mb-8">
            <span className="text-sm text-muted-foreground">GROWTH LOUNGE</span>
            <h2 className="text-3xl font-bold text-foreground mt-1">찾아 오시는 길</h2>
          </div>

          {/* Map */}
          <div className="aspect-[21/9] bg-gray-4 rounded-xl mb-8 overflow-hidden">
            {siteConfig?.address ? (
              <GoogleMap address={siteConfig.address} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                주소가 설정되지 않았습니다.
              </div>
            )}
          </div>

          {/* Location Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                오시는 길
              </h3>
              {siteConfig?.address && (
                <p className="text-foreground font-medium mb-2">
                  {siteConfig.address}
                  {siteConfig.addressDetail && ` ${siteConfig.addressDetail}`}
                </p>
              )}
              {siteConfig?.directionsText && (
                <MarkdownContent
                  content={siteConfig.directionsText}
                  className="text-muted-foreground"
                />
              )}
              {!siteConfig?.address && !siteConfig?.directionsText && (
                <p className="text-muted-foreground">
                  오시는 길 정보가 설정되지 않았습니다.
                </p>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                문의하기
              </h3>
              {siteConfig?.chatLink ? (
                <p className="text-muted-foreground">
                  문의가 있을 경우 아래 링크를 통해 문의 바랍니다.
                  <br />
                  <a
                    href={siteConfig.chatLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline mt-2 inline-block"
                  >
                    오픈 채팅 바로가기 →
                  </a>
                </p>
              ) : (
                <p className="text-muted-foreground">
                  문의 링크가 설정되지 않았습니다.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
