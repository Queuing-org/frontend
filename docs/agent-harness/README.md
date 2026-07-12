# Queuing Harness

이 폴더는 queuing-org 프로젝트 전용 하네스 산출물을 보관한다.

## Canonical Files

- `team-spec.md`: 역할 구조, 라우팅, 인수인계, 실패 정책
- `context-ledger.md`: 세션이 바뀌어도 유지해야 하는 프로젝트/하네스 맥락
- `incidents/`: 반복되는 실패와 재발 방지 규칙
- `templates/`: `docs/exec-plans/active/{run}/`와 incident 작성용 템플릿

## Operating Rule

`docs/portfolio-notes/`는 성능개선, 트러블슈팅, 포트폴리오 초안용 로컬 기록이고 git에 추적하지 않는다. 팀이 반복해서 써야 하는 규칙이나 확인된 장애 패턴만 `docs/agent-harness/incidents/`로 승격한다.

세션 재개가 필요한 작업은 `docs/exec-plans/active/` 아래 해당 run의 `handoff.md`에 현재 상태를 남긴다. 다음 세션은 `AGENTS.md`, `context-ledger.md`, 관련 active run과 `handoff.md` 순서로 읽고 시작한다.
