"use client";

import { useState } from "react";
import { Copy, Check, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/shared/utils/analytics";

interface BankAccountCardProps {
  bankAccountText: string;
  generation: number;
}

/**
 * 입금 계좌 정보를 표시하고 복사할 수 있는 컴포넌트
 */
export function BankAccountCard({
  bankAccountText,
  generation,
}: BankAccountCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(bankAccountText);
    trackEvent("recruitment_action", {
      action_type: "copy_bank_account",
      generation,
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 bg-gray-6 rounded-lg space-y-3">
      <div className="flex items-center gap-2">
        <Landmark className="w-4 h-4 text-primary" />
        <p className="text-sm font-medium">입금 계좌</p>
      </div>
      <p className="text-sm font-semibold">{bankAccountText}</p>
      <Button
        onClick={handleCopy}
        variant="outline"
        size="sm"
      >
        {copied ? (
          <>
            <Check className="mr-2 h-3.5 w-3.5" />
            복사 완료
          </>
        ) : (
          <>
            <Copy className="mr-2 h-3.5 w-3.5" />
            계좌 복사
          </>
        )}
      </Button>
    </div>
  );
}
