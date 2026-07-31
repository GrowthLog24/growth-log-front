export interface GrowthStage {
  label: "새싹" | "어린 나무" | "성장한 나무";
  stage: 1 | 2 | 3;
}

/** 회원 레벨을 화면에 표시할 성장 오브젝트 단계로 변환합니다. */
export function getGrowthStage(level: number): GrowthStage {
  if (level <= 3) return { label: "새싹", stage: 1 };
  if (level <= 5) return { label: "어린 나무", stage: 2 };
  return { label: "성장한 나무", stage: 3 };
}
