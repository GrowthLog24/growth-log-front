"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";

export function KakaoTalkFloatingButton() {
  const KAKAO_CHAT_URL = "http://pf.kakao.com/_gKxhxcG/chat";

  return (
    <Link
      href={KAKAO_CHAT_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#FEE500] rounded-full shadow-lg hover:bg-[#FADA0A] transition-all hover:scale-110 active:scale-95 group"
      aria-label="카카오톡 채널 상담하기"
    >
      <MessageCircle className="w-7 h-7 text-[#3C1E1E] fill-[#3C1E1E]" />
      
      {/* 툴팁 (마우스 호버 시 표시) */}
      <span className="absolute right-16 bg-white text-gray-1 px-3 py-1.5 rounded-lg text-sm font-medium shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-gray-5">
        카톡 상담하기
      </span>
    </Link>
  );
}
