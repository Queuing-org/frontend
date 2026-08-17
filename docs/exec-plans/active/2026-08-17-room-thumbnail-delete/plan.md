# 방 생성·수정 썸네일 UI 통일과 삭제

## 목표

- 방 수정의 썸네일 설정을 방 생성과 동일한 두 카드 선택 UI로 맞춘다.
- 공용 썸네일 UI의 조건부 X를 제거하고 기본 이미지 카드로 선택을 해제한다.
- 수정에서 기본 이미지를 저장하면 기존 썸네일을 DELETE 계약으로 제거한다.

## 선택한 스킬

- `queuing-feature-delivery`
- `queuing-orchestrator`
- `queuing-api-boundary`
- `queuing-ui-flow`
- `frontend-architecture-guardrails`
- `queuing-qa-reviewer`

## 구현 순서

1. `feat(room): 방 썸네일 삭제 계약과 선택 UI 통합`
2. `docs(delivery): 방 썸네일 삭제 검증 기록`

## 수용 기준

- 생성·수정 모두 업로드/기본 이미지 카드와 동일한 선택 스타일을 사용하고 X를 표시하지 않는다.
- 수정에서 서버 이미지가 있으면 업로드 카드가, 없으면 기본 이미지 카드가 초기 선택된다.
- 기본 이미지 저장은 `DELETE /api/v2/rooms/{slug}/thumbnail`, 새 파일 저장은 기존 PUT만 호출한다.
- 일반 정보 저장 뒤 썸네일 삭제 실패를 재시도해도 PATCH가 중복되지 않는다.
- 관련 캐시를 무효화하고 오류·pending 상태를 기존 폼 피드백에 연결한다.

## 진행

- [x] 요청·API/UI 경계 확정
- [x] API와 mutation 구현
- [x] 공용 UI와 수정 폼 상태 구현
- [x] targeted/full QA
- [x] fresh QA와 로컬 커밋
- [ ] push와 Draft PR #51 갱신

## 검증

- targeted Vitest
- `npm run lint`
- `npm run test`
- `npm run build`
- `git diff --check`

## 잔여 위험

- 저장소 문서의 `thumbnailUrl(s)` 의미와 썸네일 교체 API가 혼재한다. 이번 작업은 사용자가 확정한 v2 DELETE 계약과 현재 수정 PUT 흐름을 기준으로 한다.
- GitHub CLI 인증이 만료되어 로컬 완료 뒤 push와 PR 갱신은 인증 복구가 필요하다.
