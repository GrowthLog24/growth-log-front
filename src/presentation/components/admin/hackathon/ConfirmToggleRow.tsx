"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/presentation/components/admin";

interface ConfirmToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  /** 확인 후 호출. 성공하면 true를 반환합니다. */
  onConfirm: (next: boolean) => Promise<boolean>;
}

/**
 * 확인 다이얼로그를 거쳐 켜고 끄는 스위치 행
 */
export function ConfirmToggleRow({
  label,
  description,
  checked,
  onConfirm,
}: ConfirmToggleRowProps) {
  const [pending, setPending] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  const confirm = async () => {
    if (pending === null) return;
    setSaving(true);
    const ok = await onConfirm(pending);
    setSaving(false);
    if (ok) setPending(null);
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
      <div className="space-y-0.5">
        <Label className="text-sm font-semibold">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className={checked ? "text-sm font-semibold text-primary" : "text-sm text-muted-foreground"}>
          {checked ? "켜짐" : "꺼짐"}
        </span>
        <Switch checked={checked} onCheckedChange={(next) => setPending(next)} aria-label={label} />
      </div>
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && !saving && setPending(null)}
        title={`${label}: ${pending ? "켜기" : "끄기"}`}
        description={`${description} 정말 ${pending ? "켜시겠습니까" : "끄시겠습니까"}?`}
        confirmText={pending ? "켜기" : "끄기"}
        variant={pending ? "default" : "destructive"}
        loading={saving}
        onConfirm={confirm}
      />
    </div>
  );
}
