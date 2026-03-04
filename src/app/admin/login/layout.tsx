/**
 * 로그인 페이지 레이아웃
 * 관리자 레이아웃을 사용하지 않고 독립적인 레이아웃 사용
 */
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-muted/30">
      {children}
    </div>
  );
}
