import { Header, Footer } from "@/presentation/components/layout";
import { KakaoTalkFloatingButton } from "@/presentation/components/common/KakaoTalkFloatingButton";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <KakaoTalkFloatingButton />
    </>
  );
}
