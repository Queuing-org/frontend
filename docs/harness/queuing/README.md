# Queuing Harness

이 폴더는 queuing-org 프로젝트 전용 하네스 산출물을 보관한다.

## Canonical Files

- `team-spec.md`: 역할 구조, 라우팅, 인수인계, 실패 정책
- `incidents/`: 반복되는 실패와 재발 방지 규칙
- `templates/`: `_workspace/`와 incident 작성용 템플릿

## Operating Rule

`docs/portfolio-notes/`는 성능개선, 트러블슈팅, 포트폴리오 초안용 로컬 기록이고 git에 추적하지 않는다. 팀이 반복해서 써야 하는 규칙이나 확인된 장애 패턴만 `docs/harness/queuing/incidents/`로 승격한다.
