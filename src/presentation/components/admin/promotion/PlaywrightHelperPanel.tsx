import { Button } from "@/components/ui/button";
import {
  PLAYWRIGHT_HELPER_DOWNLOAD_URL,
  type PlaywrightHelperStatus,
} from "@/shared/lib/playwrightHelper";

type PlaywrightHelperPanelProps = {
  status: PlaywrightHelperStatus;
  error: string;
  isWorking: boolean;
  onCheck: () => void;
  onPair: () => void;
  onOpenLogin: () => void;
};

/** 운영진 PC의 Growth Log 연결 앱 연결 상태와 페어링 안내를 보여줍니다. */
export function PlaywrightHelperPanel({
  status,
  error,
  isWorking,
  onCheck,
  onPair,
  onOpenLogin,
}: PlaywrightHelperPanelProps) {
  const isConnected = status === "connected";
  const needsPairing = status === "pairing";

  return (
    <section
      className={`mt-4 rounded-md border p-3.5 ${
        isConnected ? "border-emerald-200 bg-emerald-50/70" : "border-amber-200 bg-amber-50/70"
      }`}
      aria-label="Growth Log 연결 앱"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`size-2 rounded-full ${
                status === "checking" ? "animate-pulse bg-muted-foreground" : isConnected ? "bg-emerald-500" : "bg-amber-500"
              }`}
              aria-hidden="true"
            />
            <h3 className="text-xs font-semibold">
              {status === "checking"
                ? "Growth Log 연결 앱 확인 중"
                : isConnected
                  ? "Growth Log 연결 앱 연결됨"
                  : needsPairing
                    ? "이 운영 프로그램의 연결 승인이 필요합니다"
                    : "Growth Log 연결 앱이 필요합니다"}
            </h3>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            {isConnected
              ? "전용 Chrome 프로필에서 한 번 로그인하면 수정 화면까지 자동으로 열고 내용을 채웁니다. 최종 저장은 직접 확인합니다."
              : needsPairing
                ? "연결 앱을 열고 현재 운영 프로그램 주소가 맞는지 확인한 뒤 연결을 허용하세요."
                : "연결 앱을 설치하고 실행하면 터미널 없이 방송대 자동화를 사용할 수 있습니다."}
          </p>
          {error ? <p className="mt-1 text-[11px] font-medium text-destructive">{error}</p> : null}
        </div>
        <div className="flex gap-2">
          {isConnected ? (
            <Button variant="outline" size="sm" disabled={isWorking} onClick={onOpenLogin}>
              {isWorking ? "Chrome 여는 중…" : "자동화 로그인 창 열기"}
            </Button>
          ) : null}
          {!isConnected ? (
            <Button variant="outline" size="sm" disabled={status === "checking"} onClick={onPair}>
              연결 앱 열기
            </Button>
          ) : null}
          <Button variant="outline" size="sm" disabled={status === "checking"} onClick={onCheck}>
            연결 확인
          </Button>
        </div>
      </div>

      {!isConnected && status !== "checking" ? (
        <div className="mt-3 grid gap-2 rounded-md border border-amber-200 bg-white px-3 py-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {PLAYWRIGHT_HELPER_DOWNLOAD_URL ? (
              <Button variant="outline" size="sm" asChild>
                <a href={PLAYWRIGHT_HELPER_DOWNLOAD_URL} rel="noreferrer" target="_blank">연결 앱 설치 파일 받기</a>
              </Button>
            ) : null}
            <span className="text-[11px] text-muted-foreground">최초 한 번 설치한 뒤에는 메뉴 막대에서 자동으로 연결할 수 있습니다.</span>
          </div>
          <details className="text-[11px] text-muted-foreground">
            <summary className="cursor-pointer font-medium">개발 환경에서 직접 실행</summary>
            <div className="mt-2 grid gap-1 rounded bg-muted p-2 font-mono">
              <code>npm install</code>
              <code>npm run companion:dev</code>
            </div>
          </details>
        </div>
      ) : null}
    </section>
  );
}
