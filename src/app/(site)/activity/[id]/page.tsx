import { redirect, notFound } from "next/navigation";
import { collection, doc, getDoc } from "firebase/firestore";
import { db, COLLECTIONS } from "@/infrastructure/firebase";
import type { Activity } from "@/domain/entities";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * 활동 상세 페이지
 * 새 구조에서는 클릭 가능한 활동(프로젝트, 성장일지)은
 * 외부 링크로 직접 이동하므로, 이 페이지 접근 시 리다이렉트 처리
 */
export default async function ActivityDetailPage({ params }: PageProps) {
  const { id } = await params;

  // Firestore에서 직접 활동 조회
  const docRef = doc(collection(db, COLLECTIONS.ACTIVITIES), id);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    notFound();
  }

  const activity = { id: snapshot.id, ...snapshot.data() } as Activity;

  // 카테고리별 리다이렉트 처리
  switch (activity.category) {
    case "project":
      // 프로젝트 PDF 리다이렉트 비활성화 (발표 PPT 공유 금지 정책)
      // if (activity.pdfUrl) {
      //   redirect(activity.pdfUrl);
      // }
      break;
    case "growth-log":
      // 성장일지는 블로그 URL로 리다이렉트
      if (activity.blogUrl) {
        redirect(activity.blogUrl);
      }
      break;
    default:
      // 클릭 불가능한 활동은 목록 페이지로 리다이렉트
      redirect("/activity");
  }

  // 외부 URL이 없는 경우 목록 페이지로 리다이렉트
  redirect("/activity");
}
