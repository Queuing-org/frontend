# 닉네임 카운터·테스트/room 구조 최적화

## 상태

- ci-pending
- 실행일: 2026-08-17
- 브랜치: `dev`
- 전달 대상: 기존 Draft PR #51

## 기준 수치

- 테스트: 138 files / 15,784 lines
- 최대 테스트: `RoomProfilePanel.test.tsx` 1,030 lines
- 운영 TS/TSX: 27,127 lines
- 최대 운영 컴포넌트: `RoomPlaybackScreen.tsx` 1,011 lines
- 테스트 내 직접 `new QueryClient(...)`: 26 files, 49 occurrences

## 최종 수치

- 테스트 파일: 140 files / 15,739 lines
- 공통 test helper 포함 유효 테스트 코드: 15,774 lines (`-10`)
- 최대 테스트: `useRoomRealtimeEvents.test.tsx` 858 lines (`-172`)
- 테스트 내 직접 `new QueryClient(...)`: 24 files, 32 occurrences (`-17`)
- 운영 TS/TSX: 27,212 lines (`+85`, 닉네임 UI와 명시적 hook/control 경계 포함)
- 최대 운영 파일: `useRoomRealtimeEvents.ts` 788 lines (`-223`)
- `RoomPlaybackScreen.tsx`: 1,011 → 451 lines
- `RoomProfilePanel.tsx`: 674 → 516 lines
- `RoomProfilePanel.test.tsx`: 1,030 → 756 lines

## 범위

- 설정 닉네임 입력에 최애곡과 같은 `현재 글자 수/19` 카운터를 표시한다.
- 닉네임 UI 최대 길이와 제출 검증을 19자로 일치시킨다.
- 반복되는 React Query 테스트 client/provider 구성을 공통 test helper로 만들고 대형 room 테스트부터 적용한다.
- `RoomPlaybackScreen`의 join 조율과 joined room UI를 파일 책임으로 분리한다.
- `RoomProfilePanel`의 음악력 query/mutation/feedback 책임을 hook·control로 추출하고 관련 테스트를 작은 경계로 옮긴다.

## 비범위

- 테스트를 수치만 줄이기 위해 삭제하지 않는다.
- room join, 음악력 API, cache 계약과 사용자 동작은 변경하지 않는다.
- 모든 테스트 파일을 한 번에 공통 helper로 마이그레이션하지 않는다.

## 선택한 스킬

- `queuing-feature-delivery`
- `queuing-orchestrator`
- `queuing-api-boundary`
- `queuing-ui-flow`
- `frontend-architecture-guardrails`
- `queuing-qa-reviewer`

## 수용 기준

- 닉네임 입력은 `maxlength=19`이고 현재 입력 길이를 `/19`와 함께 표시한다.
- 닉네임 count와 오류 설명은 접근성 설명에 연결된다.
- 공통 test QueryClient helper가 retry 기본값과 provider wrapper를 한 곳에서 소유한다.
- 기존 query-heavy room 테스트가 helper를 사용하고 기존 시나리오 수를 보존한다.
- `RoomPlaybackScreen.tsx`는 join/session/route 조율만 소유하고 joined UI는 별도 컴포넌트가 소유한다.
- Room profile의 음악력 요청/중복 방지/피드백은 별도 hook, 버튼 DOM은 별도 control이 소유한다.
- targeted tests, lint, 전체 test, build, diff-check, fresh read-only QA를 통과한다.

## 커밋 계획

1. `feat(settings): 닉네임 글자 수 표시`
2. `refactor(test): React Query 테스트 설정 공통화`
3. `refactor(room): 재생 입장과 joined UI 책임 분리`
4. `refactor(profile): 음악력 상태와 패널 책임 분리`
5. `test(refactor): 최적화 경계 검증 보강`
6. `docs(delivery): 설정·테스트 구조 최적화 검증 기록`

## 진행

- [x] worktree·브랜치·기준 수치 확인
- [x] 닉네임/API·UI 계약 확인
- [x] 테스트 인프라와 대형 파일 hotspot 확인
- [x] 구현
- [x] targeted verification
- [x] 전체 검증
- [x] fresh read-only QA
- [ ] 커밋·push·PR #51 갱신

## 잔여 위험

- 닉네임 backend 허용 범위는 기존 문서상 20자지만 최신 UI 요구에 따라 client 입력을 19자로 제한한다.
- 파일 분리는 동작 보존 리팩터링이며 실제 backend/STOMP 수동 검증은 별도다.
