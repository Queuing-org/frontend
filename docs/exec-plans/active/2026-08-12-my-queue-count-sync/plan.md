# 내 신청곡 카운트 동기화

## 범위

- 전체 트랙 탭에서 본인 곡 신청 성공 시 비활성 상태인 내 신청곡 첫 페이지를 갱신한다.
- 기존 탭별 지연 로딩 정책과 전체 큐 실시간 갱신은 유지한다.
- 새 테스트 코드는 작성하지 않는다.

## 선택한 스킬

- queuing-feature-delivery
- queuing-api-boundary
- queuing-ui-flow
- frontend-architecture-guardrails
- queuing-qa-reviewer

## 진행

- [x] 원인 및 상태 소유권 확인
- [x] 비활성 내 신청곡 캐시 갱신 구현
- [x] 기존 관련 테스트, lint, build 검증
- [x] QA 완료
- [ ] main 직접 커밋·푸시

## 인수 조건

- 전체 트랙 탭에서 신청 성공 직후 내 신청곡 탭 숫자가 서버 값으로 갱신된다.
- 내 신청곡 탭이 활성 상태일 때의 기존 실시간 재조회는 유지된다.
- 신청 실패가 성공 UI나 카운트를 잘못 변경하지 않는다.

## 검증

- 관련 기존 테스트: 3 files / 4 tests 통과
- 방 생성 플레키 단독 재검증: 1 file / 16 tests 통과
- 전체 테스트: 114 files / 389 tests 통과
- `npm run lint`: 통과
- `npm run build`: 통과
- `git diff --check`: 통과

## QA

- 결과: pass
- 신청 성공 `QUEUE_ADDED`를 확인한 뒤에만 내 신청곡 캐시를 갱신함.
- 내 신청곡 쿼리가 활성 상태면 기존 실시간 invalidation을 유지함.
- 비활성 상태면 인증·비밀번호가 동일한 `mine=true` 첫 페이지를 조회해 서버의 `totalPendingCount`로 교체함.
- 별도 갱신 실패 시 기존 invalidation과 다음 탭 진입 재조회를 fallback으로 유지함.
