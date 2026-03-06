"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KakaoMessageCopyCardProps {
  message: string;
}

/**
 * 카카오톡 문자 양식을 표시하고 복사할 수 있는 컴포넌트
 */
export function KakaoMessageCopyCard({ message }: KakaoMessageCopyCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">카카오톡 문자 양식</p>
      <div className="p-4 bg-gray-6 rounded-lg">
        <p className="text-sm whitespace-pre-line">{message}</p>
      </div>
      <Button
        onClick={handleCopy}
        variant="outline"
        size="sm"
        className="w-full"
      >
        {copied ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            복사 완료
          </>
        ) : (
          <>
            <Copy className="mr-2 h-4 w-4" />
            양식 복사하기
          </>
        )}
      </Button>
    </div>
  );
}
