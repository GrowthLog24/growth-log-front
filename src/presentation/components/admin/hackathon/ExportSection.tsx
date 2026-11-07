"use client";

import { toast } from "sonner";
import { Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  Hackathon,
  HackathonScore,
  HackathonSubmission,
  HackathonVote,
} from "@/domain/hackathon/types";
import { buildExportJson, buildSubmissionsMarkdown } from "@/shared/lib/hackathonExport";
import { copyToClipboard } from "./copyToClipboard";

interface ExportSectionProps {
  config: Hackathon;
  submissions: readonly HackathonSubmission[];
  scores: readonly HackathonScore[];
  votes: readonly HackathonVote[];
}

/**
 * 내보내기: 전체 제출물 Markdown 복사(AI 채점 세션용), 전체 데이터 JSON 다운로드
 */
export function ExportSection({ config, submissions, scores, votes }: ExportSectionProps) {
  const copyMarkdown = () =>
    void copyToClipboard(
      buildSubmissionsMarkdown({ hackathon: config, submissions, generatedAt: Date.now() }),
      `제출물 ${submissions.length}건을 Markdown으로 복사했습니다.`
    );

  const downloadJson = () => {
    try {
      const exportedAt = Date.now();
      const json = buildExportJson({ hackathon: config, submissions, scores, votes, exportedAt });
      const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `hackathon-${config.id}-${exportedAt}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("JSON 파일을 내려받았습니다.");
    } catch (error) {
      console.error("[hackathon-admin] json export", error);
      toast.error("JSON 내보내기에 실패했습니다.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">내보내기</CardTitle>
        <CardDescription>
          Markdown은 AI 채점 세션에 그대로 붙여 넣는 용도입니다. 팀별 복사는 &apos;제출 현황&apos;에서 행을 펼쳐 사용하세요.
          JSON에는 팀 제출 코드가 포함되지 않습니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button onClick={copyMarkdown}>
          <Copy className="mr-1 h-4 w-4" /> 전체 제출물 Markdown 복사
        </Button>
        <Button variant="outline" onClick={downloadJson}>
          <Download className="mr-1 h-4 w-4" /> JSON 다운로드
        </Button>
      </CardContent>
    </Card>
  );
}
