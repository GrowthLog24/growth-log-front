#!/usr/bin/env python3
"""Growth Log 관리자 에디터용 프롬프트 형식을 검사한다."""

from pathlib import Path
import re
import sys


def validate(text: str, base_dir: Path | None = None) -> list[str]:
    errors: list[str] = []
    count_match = re.search(r"^장수\s*:\s*(\d+)\s*$", text, re.MULTILINE)
    count = int(count_match.group(1)) if count_match else 0
    if not 4 <= count <= 10:
        errors.append("장수는 4~10이어야 합니다.")

    pages = [int(value) for value in re.findall(r"^\[카드(\d+)\]\s*$", text, re.MULTILINE)]
    if pages != list(range(1, count + 1)):
        errors.append("[카드1]부터 장수만큼 연속된 카드 구역이 필요합니다.")

    for page in pages:
        block_match = re.search(
            rf"^\[카드{page}\]\s*$([\s\S]*?)(?=^\[카드\d+\]\s*$|\Z)",
            text,
            re.MULTILINE,
        )
        block = block_match.group(1) if block_match else ""
        for field in ("라벨", "제목", "받침"):
            if not re.search(rf"^{field}\s*:\s*\S", block, re.MULTILINE):
                errors.append(f"카드{page}: {field}이 비어 있습니다.")

    for item in re.findall(r"^항목\s*:\s*(.*)$", text, re.MULTILINE):
        if not item.strip():
            errors.append("항목은 `항목: 문구` 형식으로 각 줄에 하나씩 써야 합니다.")
            continue
        if len(re.sub(r"\{\{|\}\}|\[\[|\]\]", "", item).strip()) > 22:
            errors.append(f"22자를 넘는 항목: {item.strip()}")

    if re.search(r"^제목\s*:.*\\n", text, re.MULTILINE):
        errors.append("제목 줄바꿈은 \\n 문자가 아닌 실제 줄바꿈을 사용해야 합니다.")

    for value in re.findall(r"^사진\s*:\s*(.+)$", text, re.MULTILINE):
        path = value.strip().replace("\\", "/")
        if (
            path.startswith(("/", "http://", "https://"))
            or ".." in Path(path).parts
            or Path(path).suffix.lower() not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}
        ):
            errors.append(f"사진은 ZIP 내 안전한 상대 경로여야 합니다: {value.strip()}")
        elif base_dir is not None and not (base_dir / path).is_file():
            errors.append(f"사진 파일이 없습니다: {path}")
    return errors


def self_test() -> None:
    valid = """장수: 4
[카드1]
라벨: 기술
제목: 제목
받침: 받침
사진: images/01.jpg
[카드2]
라벨: 기술
제목: 제목
받침: 받침
[카드3]
라벨: 기술
제목: 제목
받침: 받침
[카드4]
라벨: 행동
제목: 제목
받침: 받침
"""
    assert validate(valid) == []
    assert validate("장수: 11\n")
    assert validate("장수: 4\n제목: 잘못\\n줄바꿈\n")
    assert validate("장수: 4\n사진: https://example.com/a.jpg\n")
    assert validate("장수: 4\n항목:\n- 잘못된 항목\n")


def main() -> int:
    if len(sys.argv) == 2 and sys.argv[1] == "--self-test":
        self_test()
        print("self-test: ok")
        return 0
    if len(sys.argv) != 2:
        print("사용법: validate_prompt.py 프롬프트.md", file=sys.stderr)
        return 2
    prompt = Path(sys.argv[1])
    errors = validate(prompt.read_text(encoding="utf-8"), prompt.parent)
    if errors:
        print("\n".join(f"- {error}" for error in errors))
        return 1
    print("검사 통과")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
