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

    blocks: dict[int, str] = {}
    for page in pages:
        block_match = re.search(
            rf"^\[카드{page}\]\s*$([\s\S]*?)(?=^\[카드\d+\]\s*$|\Z)",
            text,
            re.MULTILINE,
        )
        block = block_match.group(1) if block_match else ""
        blocks[page] = block
        for field in ("라벨", "제목", "받침"):
            if not re.search(rf"^{field}\s*:\s*\S", block, re.MULTILINE):
                errors.append(f"카드{page}: {field}이 비어 있습니다.")

    system_match = re.search(r"^시스템\s*:\s*(성장일지|정기모임|프로젝트|그로스톡)\s*$", text, re.MULTILINE)
    system = system_match.group(1) if system_match else ""
    required_photos = {
        "성장일지": {3},
        "정기모임": {1, 2, 3, 4},
        "프로젝트": {1, 2, 3, 4},
        "그로스톡": {1, 3},
    }.get(system, set())
    for page in sorted(required_photos.intersection(pages)):
        if not re.search(r"^사진\s*:\s*\S", blocks[page], re.MULTILINE):
            errors.append(f"카드{page}: {system} 고정 사진 슬롯에 사진이 필요합니다.")
    if system == "성장일지" and 3 in blocks and not re.search(r"^캡션\s*:\s*\S", blocks[3], re.MULTILINE):
        errors.append("카드3: 성장일지 사진 캡션이 필요합니다.")
    if system == "그로스톡" and 3 in blocks and not re.search(r"^캡션\s*:\s*\S", blocks[3], re.MULTILINE):
        errors.append("카드3: 그로스톡 사진 캡션이 필요합니다.")

    for page in [value for value in pages if value >= 5]:
        block = blocks[page]
        items = re.findall(r"^항목\s*:\s*\S", block, re.MULTILINE)
        if not items and not re.search(r"^사진\s*:\s*\S", block, re.MULTILINE):
            errors.append(f"카드{page}: 추가 카드는 사진 또는 항목으로 하단 영역을 채워야 합니다.")

    if count in blocks:
        last = blocks[count]
        if len(re.findall(r"^항목\s*:\s*\S", last, re.MULTILINE)) != 3:
            errors.append("마지막 카드는 항목이 정확히 3개여야 합니다.")
        sources = [value.strip() for value in re.findall(r"^출처\s*:\s*(.*)$", last, re.MULTILINE)]
        signoff = "더 많은 이야기는 그로스로그에서"
        if signoff not in sources:
            errors.append("마지막 카드의 첫 출처 줄에 사인오프가 필요합니다.")
        if not any(value and value != signoff for value in sources):
            errors.append("마지막 카드에 원문 출처가 필요합니다.")

    if re.search(r"^사인오프\s*:", text, re.MULTILINE):
        errors.append("`사인오프:`는 에디터가 인식하지 않습니다. 첫 `출처:` 줄을 사용하세요.")

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
    valid = """시스템: 성장일지
장수: 4
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
사진: images/03.jpg
캡션: 원문 사진
[카드4]
라벨: 행동
제목: 제목
받침: 받침
항목: 첫 번째
항목: 두 번째
항목: 세 번째
출처: 더 많은 이야기는 그로스로그에서
출처: 매체명 '제목' (2026.08)
"""
    assert validate(valid) == []
    assert validate("장수: 11\n")
    assert validate("장수: 4\n제목: 잘못\\n줄바꿈\n")
    assert validate("장수: 4\n사진: https://example.com/a.jpg\n")
    assert validate("장수: 4\n항목:\n- 잘못된 항목\n")
    assert validate(valid.replace("사진: images/03.jpg\n", ""))
    assert validate(valid.replace("출처: 더 많은 이야기는 그로스로그에서\n", "사인오프: 더 많은 이야기는 그로스로그에서\n"))

    valid_growthtalk = valid.replace("시스템: 성장일지", "시스템: 그로스톡")
    assert validate(valid_growthtalk) == []
    assert validate(valid_growthtalk.replace("사진: images/01.jpg\n", ""))


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
