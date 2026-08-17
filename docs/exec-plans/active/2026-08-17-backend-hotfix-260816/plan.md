# backend hotfix/260816 프론트엔드 계약 전환

## 상태

- CI 확인 중
- 실행일: 2026-08-17
- 브랜치: `dev`
- 기준: `main`
- 전달 대상: PR #50이 2026-08-16 18:28 UTC에 이미 merge되어 successor Draft PR #51로 게시했다.

## 범위

- 폐기된 `/random-selection`, `ownerOrderLocked`, 개인 큐 잠금 분기를 제거한다.
- 이동 전 join과 `room.already-participating` 확인 재요청을 홈·검색·랜덤·비밀번호·직접 URL 흐름에 적용한다.
- 방 생성 conflict, 랜덤 후보 없음, 명시적 leave 지연 계약을 반영한다.
- `ownerOrdered`를 표시용 상태로만 보존하고 모든 개인 pending 곡을 재정렬 대상으로 사용한다.
- PR #50의 미해결 리뷰 3건을 코드와 테스트로 수정하되 GitHub 답변·resolve는 하지 않는다.
- 새 계약과 충돌하는 repo-local API/UI 스킬 규칙을 갱신한다.

## 선택한 스킬

- `queuing-pr-review-cycle`
- `github:gh-fix-ci`
- `github:gh-address-comments`
- `queuing-feature-delivery`
- `queuing-orchestrator`
- `queuing-api-boundary`
- `queuing-ui-flow`
- `frontend-architecture-guardrails`
- `queuing-qa-reviewer`

## 수용 기준

- join 오류가 `data.slug/title`을 보존하고 첫 충돌에서는 target leave를 보내지 않는다.
- 충돌 모달 동안 같은 socket lease를 유지하고 확인 시 동일 target/password로 join을 정확히 한 번 재전송한다.
- 홈·검색·랜덤·비밀번호·직접 URL 흐름이 성공 후에만 이동하고 취소 동작은 기존 `data.slug` 방으로 이동한다.
- 생성 conflict, `GET /api/v1/rooms/random`, 후보 없음 안내, leave 후 500ms 지연을 검증한다.
- `ownerOrdered: true`인 내 pending 곡도 drag/PATCH/optimistic order에 포함되고 잠금 문구와 분기가 사라진다.
- 리뷰 3건 각각 회귀 테스트가 있다.
- targeted tests, lint, 전체 test, build, diff-check, fresh read-only QA가 통과한다.

## 커밋 계획

1. `fix(review): PR 피드백 회귀 수정`
2. `feat(room): hotfix 입장 전환 계약 적용`
3. `refactor(queue): ownerOrdered 대기열 계약 전환`
4. `docs(delivery): hotfix 계약 전환 검증 기록`

## 진행

- [x] 저장소·브랜치·PR #50 상태 확인
- [x] PR #50 CI와 미해결 스레드 분류
- [x] API/UI 경계와 기존 테스트 구조 조사
- [x] 리뷰 3건 수정 및 targeted verification
- [x] 방 생성·입장·랜덤·나가기 계약 구현 및 targeted verification
- [x] 큐 계약과 repo-local 스킬 규칙 갱신 및 targeted verification
- [x] 전체 검증 및 fresh read-only QA
- [x] 기능별 커밋, push, 실제 PR 전달 경로 확정
- [ ] PR #51 CI와 미해결 리뷰 상태 재확인

## 잔여 위험

- PR #50은 이미 merge되어 새 커밋을 포함할 수 없었다. 기존 PR은 건드리지 않고 successor Draft PR #51로 전달했다.
- 실제 백엔드/STOMP 통합 환경 검증은 로컬 자동 테스트와 별개다.
- 홈·검색 전체 화면 E2E는 없고 공유 hook·dialog·직접 URL 테스트로 계약을 분할 검증했다.
