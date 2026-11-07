"use client";

import { useQrDataUrl } from "./useQrDataUrl";
import { toDisplayUrl } from "./liveFormat";

interface QrTileProps {
  /** QR에 담을 전체 주소 */
  url: string;
  /** QR 한 변 길이 (--u 배수) */
  sizeU: number;
  /** QR 위 제목 */
  title: string;
  /** 주소 글자 크기 클래스 */
  urlClassName?: string;
}

/**
 * QR 코드와 짧은 주소를 함께 보여 주는 타일입니다.
 *
 * @param {QrTileProps} props - QR 주소와 크기
 */
export function QrTile({ url, sizeU, title, urlClassName = "hl-t-sm" }: QrTileProps) {
  const dataUrl = useQrDataUrl(url);
  const side = `calc(var(--u) * ${sizeU})`;

  return (
    <figure className="flex flex-col items-center gap-3">
      <figcaption className="hl-label text-center">{title}</figcaption>
      <div
        className="grid place-items-center rounded-[calc(var(--u)*1.6)] bg-white p-[calc(var(--u)*0.8)] shadow-[0_0_calc(var(--u)*5)_rgb(100_205_82/0.25)]"
        style={{ width: side, height: side }}
      >
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- DataURL은 next/image 최적화 대상이 아님
          <img src={dataUrl} alt={`${title} QR 코드`} className="size-full" />
        ) : (
          <span className="hl-t-sm text-[var(--hl-dim)]">QR 준비 중</span>
        )}
      </div>
      <p className={`${urlClassName} font-semibold text-[var(--hl-mint)] tracking-tight`}>
        {toDisplayUrl(url)}
      </p>
    </figure>
  );
}
