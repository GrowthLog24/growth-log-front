import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { NAV_ITEMS, SITE_METADATA } from "@/shared/constants";
import { siteConfigRepository } from "@/infrastructure/repositories/siteConfigRepository";

export async function Footer() {
  const currentYear = new Date().getFullYear();
  const siteConfig = await siteConfigRepository.getSiteConfig();

  const fullAddress = siteConfig?.address
    ? `${siteConfig.address}${siteConfig.addressDetail ? ` ${siteConfig.addressDetail}` : ""}`
    : null;

  return (
    <footer className="border-t border-border bg-gray-6">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Slogan & Address & Copyright */}
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
            <p className="mt-2 text-sm text-muted-foreground max-w-md">
              다양한 분야에 종사하는 멤버들과 함께하며 새로운 인사이트를 얻어가요.
            </p>
            {fullAddress && (
              <p className="mt-3 text-sm text-muted-foreground flex items-start gap-1.5">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{fullAddress}</span>
              </p>
            )}
            {/* 소셜 채널 아이콘 */}
            {(siteConfig?.instagramLink || siteConfig?.blogLink || siteConfig?.chatLink) && (
              <div className="mt-4 flex items-center gap-4">
                {siteConfig?.instagramLink && (
                  <a
                    href={siteConfig.instagramLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-70 transition-opacity"
                    aria-label="인스타그램"
                  >
                    <Image
                      src="/instagram.svg"
                      alt="Instagram"
                      width={20}
                      height={20}
                      className="w-5 h-5"
                    />
                  </a>
                )}
                {siteConfig?.blogLink && (
                  <a
                    href={siteConfig.blogLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-70 transition-opacity"
                    aria-label="블로그"
                  >
                    <Image
                      src="/tistory.svg"
                      alt="Tistory"
                      width={20}
                      height={20}
                      className="w-5 h-5"
                    />
                  </a>
                )}
                {siteConfig?.chatLink && (
                  <a
                    href={siteConfig.chatLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-70 transition-opacity"
                    aria-label="카카오톡 채널"
                  >
                    <Image
                      src="/kakao.svg"
                      alt="KakaoTalk"
                      width={20}
                      height={20}
                      className="w-5 h-5"
                    />
                  </a>
                )}
              </div>
            )}
            <p className="mt-4 text-sm text-muted-foreground">
              © Copyright 2024-{currentYear} {SITE_METADATA.title}. All rights reserved.
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
              {siteConfig?.chatLink && (
                <li>
                  <a
                    href={siteConfig.chatLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    카카오톡 채널
                  </a>
                </li>
              )}
              <li>
                <a
                  href="mailto:contact@growthlog.org"
                  className="hover:text-foreground transition-colors"
                >
                  contact@growthlog.org
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
