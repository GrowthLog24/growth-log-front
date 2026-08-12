"use client";

import { useCallback, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/presentation/components/admin";
import { usePlaywrightHelper } from "@/presentation/hooks/usePlaywrightHelper";
import type { PromotionBoard } from "@/domain/entities";
import type { HelperResult } from "@/shared/lib/playwrightHelper";
import { PlaywrightHelperPanel } from "./PlaywrightHelperPanel";

type CampaignDraftFormProps = {
  selectedBoards: PromotionBoard[];
  onNotice: (message: string) => void;
};

type PendingAction = "수정" | "게시" | null;

function createPreviewDocument(fragment: string) {
  const content = fragment.trim() || '<div class="preview-empty">HTML 조각을 붙여넣으면 여기에 미리보기가 표시됩니다.</div>';

  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; media-src https: data:; style-src 'unsafe-inline' https:; font-src https: data:; form-action 'none'; base-uri 'none'; frame-src 'none'; connect-src 'none'" />
    <style>
      :root { color-scheme: light; font-family: Arial, "Noto Sans KR", sans-serif; }
      * { box-sizing: border-box; }
      html, body { min-height: 100%; margin: 0; }
      body { padding: 20px; color: #1e293b; background: #ffffff; line-height: 1.6; overflow-wrap: anywhere; }
      img, video, iframe { max-width: 100%; }
      table { max-width: 100%; border-collapse: collapse; }
      pre { overflow: auto; white-space: pre-wrap; }
      .preview-empty { display: grid; min-height: 220px; place-items: center; color: #94a3b8; font-size: 12px; text-align: center; }
    </style>
  </head>
  <body>${content}</body>
</html>`;
}

/** 방송대 홍보 게시글 초안 작성 및 게시·수정 자동화 요청 폼 */
export function CampaignDraftForm({ selectedBoards, onNotice }: CampaignDraftFormProps) {
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [postRound, setPostRound] = useState("1");
  const postingRound = Math.max(1, Math.trunc(Number(postRound) || 1));
  const [postTitle, setPostTitle] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [autoSubmit, setAutoSubmit] = useState(false);
  const { status, error, isWorking, check, pair, openLogin, prepareModification, prepareCreation } = usePlaywrightHelper();
  const selectedCount = selectedBoards.length;
  // 선택한 게시판 중 각 작업을 실제로 실행할 수 있는(링크가 있는) 대상만 추립니다.
  const modifiableBoards = selectedBoards.filter(
    (board) => board.postings.find((posting) => posting.round === postingRound)?.postUrl,
  );
  const creatableBoards = selectedBoards.filter((board) => board.boardUrl);
  const previewDocument = useMemo(() => createPreviewDocument(htmlContent), [htmlContent]);
  const closeConfirmation = useCallback(() => setPendingAction(null), []);

  // 선택한 모든 게시판을 순차적으로 자동화합니다. 링크가 없는 게시판은 건너뛰고,
  // 처리·실패·건너뜀 결과를 한 번에 안내합니다.
  const confirmAction = useCallback(async () => {
    if (!pendingAction) return;
    setPendingAction(null);
    if (selectedBoards.length === 0) return;

    let success = 0;
    const failed: string[] = [];
    const skipped: string[] = [];

    for (const board of selectedBoards) {
      let result: HelperResult;
      if (pendingAction === "수정") {
        const posting = board.postings.find((item) => item.round === postingRound);
        if (!posting?.postUrl) {
          skipped.push(board.name);
          continue;
        }
        result = await prepareModification({
          boardId: board.id,
          boardName: board.name,
          postUrl: posting.postUrl,
          title: postTitle,
          html: htmlContent,
          confirmFinalSubmit: autoSubmit,
        });
      } else {
        if (!board.boardUrl) {
          skipped.push(board.name);
          continue;
        }
        result = await prepareCreation({
          boardId: board.id,
          boardName: board.name,
          boardUrl: board.boardUrl,
          title: postTitle,
          html: htmlContent,
          round: postingRound,
          confirmFinalSubmit: autoSubmit,
        });
      }
      if (result.ok) success += 1;
      else failed.push(board.name);
    }

    const label = pendingAction === "수정" ? "수정" : "게시";
    const parts = [`${selectedBoards.length}곳 중 ${success}곳 ${label} 요청 완료`];
    if (failed.length > 0) parts.push(`실패 ${failed.length}곳(${failed.join(", ")})`);
    if (skipped.length > 0) parts.push(`링크 없어 건너뜀 ${skipped.length}곳(${skipped.join(", ")})`);
    onNotice(parts.join(" · "));
  }, [
    autoSubmit,
    htmlContent,
    onNotice,
    pendingAction,
    postingRound,
    postTitle,
    prepareCreation,
    prepareModification,
    selectedBoards,
  ]);

  const openAutomationLogin = useCallback(async () => {
    const result = await openLogin();
    onNotice(result.message);
  }, [onNotice, openLogin]);

  // 수정·게시 공통 게이팅(선택→링크→연결→제목→내용)에서 각 작업의 링크 조건만 끼워
  // 비활성화 사유를 만듭니다. 사유가 없으면 빈 문자열(활성)을 반환합니다.
  const disabledReasonFor = (hasActionableBoard: boolean, noLinkReason: string): string => {
    if (selectedCount === 0) return "게시판을 먼저 선택하세요.";
    if (!hasActionableBoard) return noLinkReason;
    if (status !== "connected") return "Growth Log 연결 앱을 먼저 연결하세요.";
    if (!postTitle.trim()) return "게시글 제목을 입력하세요.";
    if (!htmlContent.trim()) return "게시글 HTML 내용을 입력하세요.";
    return "";
  };
  const modificationDisabledReason = disabledReasonFor(
    modifiableBoards.length > 0,
    `선택한 게시판 중 ${postingRound}차 게시글 링크가 있는 곳이 없습니다.`,
  );
  const creationDisabledReason = disabledReasonFor(
    creatableBoards.length > 0,
    "선택한 게시판 중 게시판 링크가 있는 곳이 없습니다.",
  );

  // 수정·게시 버튼이 비활성화된 이유를 버튼 아래에 항상 노출합니다.
  // 두 사유가 같으면 한 줄로, 다르면 각각 표시합니다.
  const actionHint = isWorking
    ? ""
    : modificationDisabledReason && modificationDisabledReason === creationDisabledReason
      ? modificationDisabledReason
      : [
          creationDisabledReason ? `게시: ${creationDisabledReason}` : "",
          modificationDisabledReason ? `수정: ${modificationDisabledReason}` : "",
        ]
          .filter(Boolean)
          .join(" · ");

  return (
    <>
      <Card className="py-5 sm:py-6">
        <CardContent className="px-5 sm:px-6">
          <div className="flex items-start justify-between gap-5 border-b pb-4">
            <div>
              <span className="text-[10px] font-semibold tracking-wide text-primary uppercase">빠른 시작</span>
              <h2 className="mt-1 text-base font-semibold">새 홍보 게시글 작성</h2>
              <p className="mt-1 text-xs text-muted-foreground">게시글을 입력하고 게시 대상을 선택하는 기본 화면입니다.</p>
            </div>
            <Badge variant="secondary">초안</Badge>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-[0.7fr_1.3fr]">
            <div className="grid gap-1.5">
              <Label htmlFor="postRound" className="text-[11px] text-muted-foreground">게시 회차</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="postRound"
                  name="postRound"
                  type="number"
                  min={1}
                  step={1}
                  value={postRound}
                  onChange={(event) => setPostRound(event.currentTarget.value)}
                  onBlur={() => setPostRound(String(postingRound))}
                />
                <span className="shrink-0 text-sm font-medium">게시</span>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-[11px] text-muted-foreground">게시글 제목</Label>
              <Input
                name="postTitle"
                value={postTitle}
                onChange={(event) => setPostTitle(event.target.value)}
                placeholder="게시판에 표시될 제목을 입력하세요"
              />
            </div>
            <div className="grid gap-3.5 sm:col-span-2 lg:grid-cols-2">
              <div className="grid gap-1.5">
                <Label className="text-[11px] text-muted-foreground">게시글 내용 (HTML)</Label>
                <Textarea
                  className="h-80 field-sizing-fixed resize-y overflow-auto font-mono text-xs leading-relaxed"
                  name="postHtml"
                  value={htmlContent}
                  onChange={(event) => setHtmlContent(event.target.value)}
                  placeholder="<div>게시할 HTML 조각을 붙여넣으세요.</div>"
                />
              </div>
              <div className="grid gap-1.5 text-[11px] font-medium text-muted-foreground">
                <div className="flex items-center justify-between gap-3">
                  <span>HTML 조각 미리보기</span>
                  <span className="text-[10px] font-medium text-emerald-600">스크립트 차단됨</span>
                </div>
                <iframe
                  className="h-80 w-full rounded-md border bg-white"
                  title="HTML 게시글 미리보기"
                  sandbox="allow-same-origin"
                  referrerPolicy="no-referrer"
                  srcDoc={previewDocument}
                />
              </div>
            </div>
          </div>

          <PlaywrightHelperPanel
            status={status}
            error={error}
            isWorking={isWorking}
            onCheck={() => void check()}
            onPair={() => void pair()}
            onOpenLogin={() => void openAutomationLogin()}
          />

          <div className="mt-4 flex w-full flex-wrap items-center justify-end gap-2">
            <label className="mr-auto flex items-center gap-2 text-xs text-muted-foreground">
              <Switch
                checked={autoSubmit}
                onCheckedChange={setAutoSubmit}
                aria-label="최종 저장까지 자동 실행"
              />
              <span>
                최종 저장까지 자동 실행
                {autoSubmit ? <span className="ml-1 text-amber-600">사람 확인 없이 바로 등록됩니다</span> : null}
              </span>
            </label>
            <span className="mr-1 text-xs text-muted-foreground">{selectedCount}개 게시판 선택</span>
            <Button variant="outline" onClick={() => onNotice("게시글 초안이 임시 저장됐습니다. 현재는 화면 예시입니다.")}>초안 저장</Button>
            <Button
              variant="outline"
              disabled={Boolean(modificationDisabledReason) || isWorking}
              title={modificationDisabledReason || "선택한 게시글의 수정 화면을 자동으로 준비합니다."}
              onClick={() => setPendingAction("수정")}
            >
              {isWorking ? "준비 중…" : "수정"}
            </Button>
            <Button
              disabled={Boolean(creationDisabledReason) || isWorking}
              title={creationDisabledReason || "선택한 게시판의 글쓰기 화면을 자동으로 준비합니다."}
              onClick={() => setPendingAction("게시")}
            >
              {isWorking ? "준비 중…" : "게시"}
            </Button>
            {actionHint ? (
              <p className="mt-1 basis-full text-right text-[11px] leading-relaxed text-amber-600">
                {actionHint}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={pendingAction !== null}
        onOpenChange={(open) => !open && closeConfirmation()}
        title={pendingAction === "수정" ? "게시글 수정 자동화" : "게시글 게시 자동화"}
        description={`선택한 게시판 ${selectedCount}곳에 대해 ${pendingAction === "수정" ? "수정" : "게시"} 화면을 자동으로 열고 내용을 채웁니다. ${
          autoSubmit
            ? "‘최종 저장까지 자동 실행’이 켜져 있어, 연결 앱이 지원하면 방송대 최종 저장·등록까지 사람 확인 없이 바로 진행됩니다."
            : "방송대의 최종 저장·등록 버튼은 직접 눌러야 합니다."
        }`}
        confirmText={autoSubmit ? (pendingAction === "수정" ? "수정·등록" : "게시·등록") : pendingAction === "수정" ? "수정 준비" : "게시 준비"}
        onConfirm={() => void confirmAction()}
      />
    </>
  );
}
