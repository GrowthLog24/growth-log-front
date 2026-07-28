"use client";

import { useCallback, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePlaywrightHelper } from "@/presentation/hooks/usePlaywrightHelper";

type StepState = "done" | "current" | undefined;

function FlowStep({ number, title, detail, state, last = false }: { number: number; title: string; detail: string; state?: StepState; last?: boolean }) {
  const numberClass = state === "done"
    ? "border-emerald-700 bg-emerald-700 text-white"
    : state === "current"
      ? "border-primary bg-white text-primary ring-4 ring-primary/10"
      : "border-border bg-white text-muted-foreground";

  return (
    <li className="relative flex min-h-14 gap-3">
      {!last && <i className="absolute top-7 bottom-0 left-3 hidden w-px bg-border xl:block" />}
      <span className={`relative z-10 grid size-6 shrink-0 place-items-center rounded-full border text-[10px] font-semibold ${numberClass}`}>{number}</span>
      <div>
        <strong className="block text-xs font-semibold">{title}</strong>
        <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{detail}</p>
      </div>
    </li>
  );
}

/** 운영진 로그인부터 게시 결과 확인까지의 방송대 홍보 게시 흐름과 자동 로그인 폼 */
export function LoginFlow() {
  const { status, isWorking, pair, autoLogin } = usePlaywrightHelper();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");

  const submitAutoLogin = useCallback(async () => {
    const result = await autoLogin({ username, password });
    setPassword("");
    setLoginMessage(result.message);
  }, [autoLogin, password, username]);

  return (
    <Card className="py-5 sm:py-6">
      <CardContent className="px-5 sm:px-6">
        <div className="flex items-center justify-between gap-5 border-b pb-4">
          <div>
            <span className="text-[10px] font-semibold tracking-wide text-amber-700 uppercase">안전한 연결</span>
            <h2 className="mt-1 text-base font-semibold">로그인 흐름</h2>
          </div>
          <span className="grid size-8 place-items-center rounded-full bg-amber-50 text-amber-700" aria-hidden="true">
            <ArrowUpRight className="size-4" />
          </span>
        </div>
        <ol className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1 xl:gap-0">
          <FlowStep number={1} title="운영진 로그인" detail="내부 운영 계정으로 접근" state="done" />
          <FlowStep number={2} title="방송대 공식 로그인" detail="전용 Chrome에서 로그인 처리" state="current" />
          <FlowStep number={3} title="게시 검토 및 승인" detail="대상과 내용을 마지막으로 확인" />
          <FlowStep number={4} title="게시 결과 확인" detail="링크와 상태를 자동 기록" last />
        </ol>
        <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-3">
          <strong className="text-[11px] text-emerald-700">비밀번호를 저장하지 않습니다</strong>
          <p className="mt-1 text-[11px] leading-relaxed text-emerald-900/70">
            입력한 비밀번호는 이 기기의 연결 앱으로만 즉시 전달되어 로그인에만 사용되고 저장되지 않습니다.
          </p>
        </div>

        <div className="mt-3 grid gap-2">
          <div className="grid gap-1.5">
            <Label className="text-[11px] text-muted-foreground">아이디</Label>
            <Input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-[11px] text-muted-foreground">비밀번호</Label>
            <Input autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>
          <Button
            className="w-full"
            disabled={status !== "connected" || isWorking || !username.trim() || !password}
            onClick={() => void submitAutoLogin()}
          >
            {isWorking ? "로그인 처리 중…" : "자동 로그인"}
          </Button>
          {loginMessage ? <p className="text-center text-[11px] leading-relaxed text-muted-foreground">{loginMessage}</p> : null}
          {status !== "connected" ? (
            <div className="grid gap-2 text-center">
              <p className="text-[11px] leading-relaxed text-amber-600">Growth Log 연결 앱이 연결되어야 자동 로그인을 사용할 수 있습니다.</p>
              <Button variant="outline" className="w-full" onClick={() => void pair()}>연결 앱 열기</Button>
            </div>
          ) : null}

          <p className="text-center text-[11px] leading-relaxed text-muted-foreground">로그인 여부는 자동으로 확인하지 않습니다.</p>
        </div>
      </CardContent>
    </Card>
  );
}
