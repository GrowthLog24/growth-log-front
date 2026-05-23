import { SVGProps } from "react";

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

/**
 * 인스타그램 아이콘
 */
export function InstagramIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

/**
 * 티스토리 아이콘
 */
export function TistoryIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      <circle cx="12" cy="6" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="12" r="2.5" />
      <circle cx="12" cy="18" r="2.5" />
    </svg>
  );
}

/**
 * 카카오톡 아이콘
 */
export function KakaoTalkIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M12 3C6.48 3 2 6.58 2 11c0 2.76 1.78 5.18 4.46 6.56-.14.82-.52 2.98-.6 3.44 0 0-.01.08.04.11.05.03.11.01.11.01.15-.02 1.74-1.14 2.48-1.63.62.09 1.26.13 1.91.13 5.52 0 10-3.58 10-8-.04-4.42-4.52-8-10.04-8z" />
    </svg>
  );
}
