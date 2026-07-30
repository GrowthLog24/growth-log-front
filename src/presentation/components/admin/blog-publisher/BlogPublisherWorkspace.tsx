"use client";

import { ChangeEvent, useCallback, useMemo, useState } from "react";
import {
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  FileArchive,
  ImageIcon,
  LoaderCircle,
  LogIn,
  RefreshCw,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePlaywrightHelper } from "@/presentation/hooks/usePlaywrightHelper";
import {
  PLAYWRIGHT_HELPER_DOWNLOAD_URL,
  type TistoryDraftJob,
} from "@/shared/lib/playwrightHelper";
import { parseTistoryZip } from "@/shared/lib/tistoryPublisher";

const PUBLIC_BLOG_URL = "https://blog.growthlog.org";
const TISTORY_MANAGE_BLOG_URL = PUBLIC_BLOG_URL;
const MAX_TOTAL_POSTS = 30;

type FlowState = "done" | "current" | undefined;

function FlowStep({
  number,
  title,
  detail,
  state,
}: {
  number: number;
  title: string;
  detail: string;
  state?: FlowState;
}) {
  const numberClass = state === "done"
    ? "border-emerald-700 bg-emerald-700 text-white"
    : state === "current"
      ? "border-primary bg-white text-primary ring-4 ring-primary/10"
      : "border-border bg-white text-muted-foreground";

  return (
    <li className="flex min-h-12 gap-3">
      <span className={`grid size-6 shrink-0 place-items-center rounded-full border text-[10px] font-semibold ${numberClass}`}>
        {number}
      </span>
      <div>
        <strong className="block text-xs font-semibold">{title}</strong>
        <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{detail}</p>
      </div>
    </li>
  );
}

function statusBadge(job: TistoryDraftJob) {
  switch (job.status) {
    case "running":
      return <Badge className="gap-1 border-0 bg-blue-500 text-white hover:bg-blue-500"><LoaderCircle className="size-3 animate-spin" />처리 중</Badge>;
    case "done":
      return <Badge className="gap-1 border-0 bg-emerald-500 text-white hover:bg-emerald-500"><CheckCircle2 className="size-3" />저장 완료</Badge>;
    case "failed":
      return <Badge variant="destructive" className="gap-1"><CircleAlert className="size-3" />확인 필요</Badge>;
    default:
      return <Badge variant="outline">대기</Badge>;
  }
}

export function BlogPublisherWorkspace() {
  const {
    status,
    error,
    isWorking,
    check,
    pair,
    openTistoryLogin,
    saveTistoryDraft,
  } = usePlaywrightHelper();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [jobs, setJobs] = useState<TistoryDraftJob[]>([]);
  const [excludedKeywords, setExcludedKeywords] = useState("");
  const [category, setCategory] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [loginMessage, setLoginMessage] = useState("");

  const imageCount = useMemo(
    () => jobs.reduce((sum, job) => sum + job.attachments.length, 0),
    [jobs],
  );
  const savedCount = jobs.filter((job) => job.status === "done").length;

  const analyzeZips = useCallback(async (files: File[], keywords: string) => {
    setIsParsing(true);
    setJobs([]);
    try {
      const parsed: TistoryDraftJob[] = [];
      for (const file of files) {
        const fileJobs = await parseTistoryZip(file, keywords.split(","));
        parsed.push(...fileJobs.map((job) => ({
          ...job,
          source: `${file.name} / ${job.source}`,
        })));
        if (parsed.length > MAX_TOTAL_POSTS) {
          throw new Error(`여러 ZIP을 합쳐 최대 ${MAX_TOTAL_POSTS}개 글까지 처리할 수 있습니다.`);
        }
      }
      setJobs(parsed);
      toast.success(`${files.length}개 ZIP에서 ${parsed.length}개 글과 ${parsed.reduce((sum, job) => sum + job.attachments.length, 0)}개 이미지를 확인했습니다.`);
    } catch (parseError) {
      const message = parseError instanceof Error ? parseError.message : "ZIP 파일을 읽지 못했습니다.";
      toast.error(message);
    } finally {
      setIsParsing(false);
    }
  }, []);

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    setSelectedFiles(files);
    if (files.length) void analyzeZips(files, excludedKeywords);
  }, [analyzeZips, excludedKeywords]);

  const handleLogin = useCallback(async () => {
    const result = await openTistoryLogin(TISTORY_MANAGE_BLOG_URL);
    setLoginMessage(result.message);
  }, [openTistoryLogin]);

  const handlePublish = useCallback(async () => {
    if (status !== "connected") {
      toast.error("먼저 Growth Log 연결 앱을 연결해 주세요.");
      return;
    }
    if (jobs.length === 0) {
      toast.error("먼저 ZIP 파일을 선택해 주세요.");
      return;
    }

    setIsPublishing(true);
    let completed = jobs.filter((job) => job.status === "done").length;

    for (let index = 0; index < jobs.length; index += 1) {
      const job = jobs[index];
      if (job.status === "done") continue;

      setJobs((current) => current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, status: "running", message: "" } : item,
      ));

      const result = await saveTistoryDraft({
        blogUrl: TISTORY_MANAGE_BLOG_URL,
        category: category.trim(),
        title: job.title,
        html: job.html,
        tags: job.tags,
        attachments: job.attachments,
      });

      if (result.ok) completed += 1;
      setJobs((current) => current.map((item, itemIndex) =>
        itemIndex === index
          ? {
            ...item,
            status: result.ok ? "done" : "failed",
            message: result.message,
          }
          : item,
      ));

      if (result.code === "TISTORY_LOGIN_REQUIRED") {
        setLoginMessage(result.message);
        toast.error("전용 Chrome에서 티스토리 로그인 후 다시 실행해 주세요.");
        break;
      }
    }

    setIsPublishing(false);
    if (completed === jobs.length) {
      toast.success(`${completed}개 글을 모두 비공개 저장했습니다.`);
    } else {
      toast.info(`${jobs.length}개 중 ${completed}개 저장을 완료했습니다.`);
    }
  }, [category, jobs, saveTistoryDraft, status]);

  const isConnected = status === "connected";
  const connectionLabel = status === "checking"
    ? "연결 확인 중"
    : isConnected
      ? "연결 앱 준비됨"
      : status === "pairing"
        ? "연결 승인 필요"
        : "연결 앱 필요";

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Markdown과 이미지를 담은 ZIP을 분석해 로그인된 전용 Chrome에서 티스토리 글을 순서대로 비공개 저장합니다.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="py-4">
          <CardContent className="flex items-center gap-3 px-4">
            <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary"><FileArchive className="size-4" /></span>
            <div><span className="text-xs text-muted-foreground">등록 대기</span><strong className="block text-lg">{jobs.length}개 글</strong></div>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="flex items-center gap-3 px-4">
            <span className="grid size-9 place-items-center rounded-lg bg-blue-50 text-blue-600"><ImageIcon className="size-4" /></span>
            <div><span className="text-xs text-muted-foreground">연결 이미지</span><strong className="block text-lg">{imageCount}개</strong></div>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="flex items-center gap-3 px-4">
            <span className={`grid size-9 place-items-center rounded-lg ${isConnected ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
              {isConnected ? <CheckCircle2 className="size-4" /> : <CircleAlert className="size-4" />}
            </span>
            <div><span className="text-xs text-muted-foreground">자동화 상태</span><strong className="block text-sm">{connectionLabel}</strong></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.7fr)]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-base"><UploadCloud className="size-4 text-primary" />ZIP 일괄 등록</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div className="relative rounded-lg border-2 border-dashed border-border bg-muted/20 px-6 py-10 text-center transition-colors hover:border-primary/40 hover:bg-primary/[0.02]">
              <input
                id="tistory-zip-file"
                className="sr-only"
                type="file"
                accept=".zip,application/zip"
                multiple
                disabled={isParsing || isPublishing}
                onChange={handleFileChange}
              />
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
                {isParsing ? <LoaderCircle className="size-5 animate-spin" /> : <FileArchive className="size-5" />}
              </span>
              <h2 className="mt-4 text-sm font-semibold">Markdown ZIP을 한 개 이상 올려주세요</h2>
              <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
                `.md` 파일과 글에서 상대경로로 참조하는 PNG·JPG·GIF·WebP 이미지를 함께 압축하면 자동으로 연결합니다.
              </p>
              <Button className="mt-4" variant="outline" asChild>
                <label htmlFor="tistory-zip-file" className="cursor-pointer">
                  {isParsing ? "ZIP 분석 중…" : "ZIP 파일 여러 개 선택"}
                </label>
              </Button>
              <p className="mx-auto mt-3 max-w-xl truncate text-xs font-medium">
                {selectedFiles.length
                  ? `${selectedFiles.length}개 ZIP · ${selectedFiles.map((file) => file.name).join(", ")}`
                  : "선택된 파일 없음"}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="tistory-category">티스토리 카테고리 <span className="font-normal text-muted-foreground">(선택)</span></Label>
                <Input id="tistory-category" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="예: 프로젝트" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="exclude-keywords">제외할 파일명 키워드 <span className="font-normal text-muted-foreground">(선택)</span></Label>
                <div className="flex gap-2">
                  <Input
                    id="exclude-keywords"
                    value={excludedKeywords}
                    onChange={(event) => setExcludedKeywords(event.target.value)}
                    placeholder="쉼표로 구분"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={!selectedFiles.length || isParsing || isPublishing}
                    onClick={() => selectedFiles.length && void analyzeZips(selectedFiles, excludedKeywords)}
                    aria-label="제외 키워드 적용 후 다시 분석"
                  >
                    <RefreshCw className="size-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-700" />
                <div>
                  <strong className="block text-xs text-emerald-800">기본값은 비공개 저장</strong>
                  <p className="mt-0.5 text-[11px] text-emerald-900/70">태그와 이미지를 보존하면서 공개 전 검토할 수 있습니다.</p>
                </div>
              </div>
              <a className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline" href={PUBLIC_BLOG_URL} target="_blank" rel="noreferrer">
                블로그 열기 <ExternalLink className="size-3" />
              </a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-base"><LogIn className="size-4 text-amber-600" />티스토리 로그인</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <ol className="grid gap-2">
              <FlowStep number={1} title="운영진 로그인" detail="현재 어드민 계정으로 접근" state="done" />
              <FlowStep number={2} title="연결 앱 확인" detail="이 컴퓨터의 전용 Chrome 연결" state={isConnected ? "done" : "current"} />
              <FlowStep number={3} title="티스토리 로그인" detail="카카오 계정으로 직접 로그인" state={isConnected ? "current" : undefined} />
              <FlowStep number={4} title="ZIP 비공개 저장" detail="글과 이미지를 순서대로 등록" />
            </ol>

            <div className={`rounded-md border p-3 ${isConnected ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
              <strong className={`text-xs ${isConnected ? "text-emerald-800" : "text-amber-800"}`}>{connectionLabel}</strong>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                {isConnected
                  ? "로그인은 전용 Chrome에서 직접 처리하며 계정 정보는 이 페이지에 저장하지 않습니다."
                  : "KNOU 홍보 게시와 같은 Growth Log 연결 앱을 사용합니다."}
              </p>
              {error ? <p className="mt-2 text-[11px] font-medium text-destructive">{error}</p> : null}
            </div>

            {isConnected ? (
              <Button className="w-full" variant="outline" disabled={isWorking || isPublishing} onClick={() => void handleLogin()}>
                {isWorking ? <LoaderCircle className="size-4 animate-spin" /> : <LogIn className="size-4" />}
                티스토리 로그인 창 열기
              </Button>
            ) : (
              <div className="grid gap-2">
                <Button className="w-full" disabled={status === "checking"} onClick={() => void pair()}>연결 앱 열기</Button>
                <Button className="w-full" variant="outline" disabled={status === "checking"} onClick={() => void check()}>연결 다시 확인</Button>
                {PLAYWRIGHT_HELPER_DOWNLOAD_URL ? (
                  <Button variant="link" size="sm" asChild>
                    <a href={PLAYWRIGHT_HELPER_DOWNLOAD_URL} target="_blank" rel="noreferrer">연결 앱 설치 파일 받기</a>
                  </Button>
                ) : null}
              </div>
            )}
            {loginMessage ? <p className="text-center text-[11px] leading-relaxed text-muted-foreground">{loginMessage}</p> : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 border-b">
          <div>
            <CardTitle className="text-base">등록할 글</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">{jobs.length ? `${savedCount}/${jobs.length}개 저장 완료` : "ZIP을 선택하면 Markdown 글 목록이 표시됩니다."}</p>
          </div>
          <Button disabled={!jobs.length || !isConnected || isParsing || isPublishing} onClick={() => void handlePublish()}>
            {isPublishing ? <LoaderCircle className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
            {isPublishing ? "순서대로 저장 중…" : "모두 비공개 저장"}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {jobs.length ? (
            <ol className="divide-y">
              {jobs.map((job, index) => (
                <li key={`${job.source}-${index}`} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted font-mono text-[10px] font-semibold">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <strong className="block truncate text-sm">{job.title}</strong>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      {job.source} · 이미지 {job.attachments.length}개 · 태그 {job.tags.length}개
                    </p>
                    {job.message ? <p className={`mt-1 text-[11px] ${job.status === "failed" ? "text-destructive" : "text-emerald-700"}`}>{job.message}</p> : null}
                  </div>
                  <div className="shrink-0">{statusBadge(job)}</div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="grid min-h-40 place-items-center p-6 text-center">
              <div>
                <FileArchive className="mx-auto size-7 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">아직 분석한 ZIP 파일이 없습니다.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
