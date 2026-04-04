import type { Metadata } from "next";
import { MapPin, MessageCircle } from "lucide-react";
import { FAQSection, type FAQCategory, type FAQItem } from "@/presentation/components/faq";
import { GoogleMap, MarkdownContent } from "@/presentation/components/common";
import { NoticeList } from "@/presentation/components/support";
import { faqRepository } from "@/infrastructure/repositories/faqRepository";
import { faqCategoryRepository } from "@/infrastructure/repositories/faqCategoryRepository";
import { noticeRepository } from "@/infrastructure/repositories/noticeRepository";
import { siteConfigRepository } from "@/infrastructure/repositories/siteConfigRepository";
import { serializeFirestoreData } from "@/shared/utils/serialize";
import type { FAQ, FAQCategoryItem } from "@/domain/entities";

export const dynamic = "force-dynamic";

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
): { serializedCategories: FAQCategory[]; groupedFAQs: Record<string, FAQItem[]> } {
  // 카테고리 직렬화
  const serializedCategories: FAQCategory[] = serializeFirestoreData(categories);

  // FAQ를 카테고리별로 그룹화 및 직렬화
  const groupedFAQs: Record<string, FAQItem[]> = {};

  // 카테고리 순서대로 초기화
  serializedCategories.forEach((cat) => {
    groupedFAQs[cat.name] = [];
  });

  // FAQ를 해당 카테고리에 추가
  const serializedFaqs = serializeFirestoreData(faqs);
  serializedFaqs.forEach((faq) => {
    if (groupedFAQs[faq.category]) {
      groupedFAQs[faq.category].push(faq);
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

  // 데이터 직렬화
  const serializedNotices = serializeFirestoreData(notices);
  const serializedSiteConfig = serializeFirestoreData(siteConfig);

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

          {/* Notice List with Load More */}
          <NoticeList notices={serializedNotices} />
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
            {serializedSiteConfig?.address ? (
              <GoogleMap address={serializedSiteConfig.address} />
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
              {serializedSiteConfig?.address && (
                <p className="text-foreground font-medium mb-2">
                  {serializedSiteConfig.address}
                  {serializedSiteConfig.addressDetail && ` ${serializedSiteConfig.addressDetail}`}
                </p>
              )}
              {serializedSiteConfig?.directionsText && (
                <MarkdownContent
                  content={serializedSiteConfig.directionsText}
                  className="text-muted-foreground"
                />
              )}
              {!serializedSiteConfig?.address && !serializedSiteConfig?.directionsText && (
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
              {serializedSiteConfig?.chatLink ? (
                <p className="text-muted-foreground">
                  문의가 있을 경우 아래 링크를 통해 문의 바랍니다.
                  <br />
                  <a
                    href={serializedSiteConfig.chatLink}
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
