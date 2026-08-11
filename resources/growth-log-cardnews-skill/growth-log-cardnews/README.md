# Growth Log Card News Skill

Codex와 Claude에서 함께 쓸 수 있는 카드뉴스 제작 스킬이다.

## 설치

- Codex: 압축을 풀어 `~/.codex/skills/growth-log-cardnews/`에 둔다.
- Claude Code: 압축을 풀어 프로젝트의 `.claude/skills/growth-log-cardnews/`에 둔다.

두 경우 모두 설치 경로 바로 아래에 `SKILL.md`가 보여야 한다.

## 사용 예

```text
$growth-log-cardnews
첨부한 원문을 바탕으로 Growth Log 카드뉴스를 만들어줘.
블로그 URL이면 본문 사진도 가져와 카드에 연결해줘.
개발자 또는 개발에 관심이 있고 함께 성장할 커뮤니티를 찾는 사람이
흥미를 느끼게 구성해줘. 완성된 프롬프트.md, 캡션.md, 원문.md를 ZIP으로 묶어줘.
```

생성된 ZIP을 Growth Log 관리자 페이지의 `프롬프트 ZIP 가져오기`에 넣으면 된다.
