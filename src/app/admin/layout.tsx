import { auth } from "@/auth";
import { AdminLayout } from "@/presentation/components/admin";

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // 로그인 페이지는 레이아웃 없이 렌더링
  // 이 체크는 middleware에서 주로 처리하지만, 안전을 위해 추가
  return (
    <AdminLayout
      user={{
        name: session?.user?.name,
        email: session?.user?.email,
        image: session?.user?.image,
      }}
    >
      {children}
    </AdminLayout>
  );
}
