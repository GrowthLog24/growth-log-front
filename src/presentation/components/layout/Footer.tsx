import Link from "next/link";
import Image from "next/image";
import { NAV_ITEMS, SITE_METADATA } from "@/shared/constants";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-gray-6">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Slogan & Copyright */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-block -ml-2">
              <Image
                src="/images/logo/logo-light.svg"
                alt="Growth Log"
                width={192}
                height={38}
                className="h-10 w-auto"
              />
            </Link>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              다양한 분야에 종사하는 멤버들과 함께하며 새로운 인사이트를 얻어가요.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              © {currentYear} {SITE_METADATA.title}. All rights reserved.
            </p>
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">바로가기</h3>
            <ul className="space-y-3">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">문의하기</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a
                  href="http://pf.kakao.com/_gKxhxcG/chat"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  카카오톡 채널
                </a>
              </li>
              <li>
                <a
                  href="mailto:contact@growth-log.com"
                  className="hover:text-foreground transition-colors"
                >
                  contact@growth-log.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
