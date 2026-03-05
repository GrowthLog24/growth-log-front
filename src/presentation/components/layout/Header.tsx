"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { NAV_ITEMS } from "@/shared/constants";
import { siteConfigRepository } from "@/infrastructure/repositories/siteConfigRepository";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [ctaText, setCtaText] = useState<string>("");
  const [ctaLink, setCtaLink] = useState<string>("/recruit");
  const [isRecruitmentOpen, setIsRecruitmentOpen] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const config = await siteConfigRepository.getSiteConfig();
        if (config) {
          setIsRecruitmentOpen(config.isRecruitmentOpen);
          if (config.isRecruitmentOpen) {
            // 모집 중: "{모집기수}기 지원하기"
            setCtaText(`${config.recruitmentGeneration}기 지원하기`);
            setCtaLink("/recruit");
          } else {
            // 모집 종료: "{현재기수+1}기 사전 등록하기"
            const nextGeneration = (config.currentGeneration || 0) + 1;
            setCtaText(`${nextGeneration}기 사전 등록하기`);
            setCtaLink("/pre-register");
          }
        }
      } catch (error) {
        console.error("Failed to fetch site config:", error);
        setCtaText("지원하기");
      }
    };

    fetchConfig();
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-custom flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/logo/logo-light.svg"
            alt="Growth Log"
            width={200}
            height={40}
            priority
            className="h-10 w-auto"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-4">
          {ctaText && (
            <Button asChild variant={isRecruitmentOpen ? "default" : "outline"}>
              <Link href={ctaLink}>{ctaText}</Link>
            </Button>
          )}
        </div>

        {/* Mobile Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">메뉴 열기</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px] px-8 py-10">
            <SheetTitle className="sr-only">네비게이션 메뉴</SheetTitle>
            <nav className="flex flex-col gap-6 mt-6">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="text-lg font-medium text-foreground transition-colors hover:text-primary"
                >
                  {item.label}
                </Link>
              ))}
              {ctaText && (
                <div className="mt-4 pt-4 border-t">
                  <Button asChild variant={isRecruitmentOpen ? "default" : "outline"} className="w-full">
                    <Link href={ctaLink} onClick={() => setIsOpen(false)}>
                      {ctaText}
                    </Link>
                  </Button>
                </div>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
