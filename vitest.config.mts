import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * 순수 도메인 로직(출결 판정·좌표 검증) 단위 테스트 전용 설정.
 *
 * 방침: 순수 로직만 동결 TDD 대상으로 하고,
 * React 렌더링·프레임워크 배선은 테스트 대상에서 제외합니다.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts", "src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
