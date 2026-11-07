/**
 * AI 인정상 루브릭 (grading-prompt.md 의 표와 같아야 한다)
 */
export const RUBRIC = [
  { key: "problem", label: "문제 정의·기획", max: 20 },
  { key: "core", label: "핵심 기능 작동", max: 25 },
  { key: "alignment", label: "기획-구현 일치", max: 15 },
  { key: "quality", label: "코드·저장소 품질", max: 15 },
  { key: "ai_process", label: "AI 활용·진행 과정", max: 10 },
  { key: "impact", label: "임팩트·창의성", max: 15 },
];

export const RUBRIC_MAX = RUBRIC.reduce((sum, item) => sum + item.max, 0);

/**
 * 채점 JSON 을 검증하고 저장할 점수 객체로 바꾼다. 문제가 있으면 Error 를 던진다.
 *
 * @param {unknown} raw - 채점 세션이 만든 JSON
 * @returns {{ criteria: Array<{key:string,label:string,score:number,max:number,comment:string}>, summary: string, total: number, max: number }}
 */
export function buildScore(raw) {
  if (!raw || typeof raw !== "object") throw new Error("JSON 객체가 아닙니다.");
  const input = /** @type {{criteria?: unknown, summary?: unknown}} */ (raw);
  if (!Array.isArray(input.criteria)) throw new Error("criteria 배열이 필요합니다.");
  if (typeof input.summary !== "string" || !input.summary.trim()) {
    throw new Error("summary 문자열이 필요합니다.");
  }
  const criteria = RUBRIC.map((item) => {
    const found = input.criteria.find((c) => c && c.key === item.key);
    if (!found) throw new Error(`항목 누락: ${item.key}`);
    const score = Number(found.score);
    if (!Number.isInteger(score) || score < 0 || score > item.max) {
      throw new Error(`${item.key} 점수는 0~${item.max} 정수여야 합니다. (받은 값: ${found.score})`);
    }
    const comment = typeof found.comment === "string" ? found.comment.trim() : "";
    return { key: item.key, label: item.label, score, max: item.max, comment };
  });
  const total = criteria.reduce((sum, c) => sum + c.score, 0);
  return { criteria, summary: input.summary.trim(), total, max: RUBRIC_MAX };
}
