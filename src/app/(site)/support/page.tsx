import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, MapPin, Phone } from "lucide-react";
import { FAQSection } from "@/presentation/components/faq";
import { faqRepository } from "@/infrastructure/repositories/faqRepository";
import { faqCategoryRepository } from "@/infrastructure/repositories/faqCategoryRepository";
import { noticeRepository } from "@/infrastructure/repositories/noticeRepository";
import { formatDate } from "@/shared/utils/date";
import type { FAQ, FAQCategoryItem } from "@/domain/entities";

export const metadata: Metadata = {
  title: "Support",
  description: "그로스로그 공지사항, FAQ, 찾아오시는 길을 안내합니다.",
};

/**
 * FAQ 데이터를 카테고리별로 그룹화
 */
function groupFAQsByCategory(
  faqs: FAQ[],
  categories: FAQCategoryItem[]
): Record<string, FAQ[]> {
  const grouped: Record<string, FAQ[]> = {};

  // 카테고리 순서대로 초기화
  categories.forEach((cat) => {
    grouped[cat.name] = [];
  });

  // FAQ를 해당 카테고리에 추가
  faqs.forEach((faq) => {
    if (grouped[faq.category]) {
      grouped[faq.category].push(faq);
    }
  });

  return grouped;
}

export default async function SupportPage() {
  // Firestore에서 데이터 가져오기
  const [faqs, categories, notices] = await Promise.all([
    faqRepository.getFAQs(),
    faqCategoryRepository.getCategories(),
    noticeRepository.getNotices(),
  ]);

  // 카테고리별로 FAQ 그룹화
  const groupedFAQs = groupFAQsByCategory(faqs, categories);

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

          <FAQSection categories={categories} groupedFAQs={groupedFAQs} />
        </div>
      </section>

      {/* Location Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="mb-8">
            <span className="text-sm text-muted-foreground">GROWTH LOUNGE</span>
            <h2 className="text-3xl font-bold text-foreground mt-1">찾아 오시는 길</h2>
          </div>

          {/* Map Placeholder */}
          <div className="aspect-[21/9] bg-gray-4 rounded-xl mb-8">
            {/* 실제 지도 컴포넌트 또는 iframe 삽입 */}
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              지도 영역
            </div>
          </div>

          {/* Location Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                오시는 길
              </h3>
              <p className="text-muted-foreground">
                서울특별시 마포구 공덕동 123-45<br />
                공덕역 6번출구에서 도보 5분 → 스터디 카페
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" />
                문의하기
              </h3>
              <p className="text-muted-foreground">
                카카오톡 채널: @그로스로그<br />
                문의가 있을 경우 카카오톡으로 문의 바랍니다. → 오픈 채팅
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
