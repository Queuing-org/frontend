# 방·재생목록·프로필 UI 개선

## Scope

- 방 내부 프로필 텍스트, 채팅 간격, 현재 곡 스킵 정렬, queue 탭/카드 문구와 강조를 조정한다.
- 곡 신청 사연 제한, 프로필 수정 완료 버튼, 랜덤 입장 오류 타이머를 UI 소유 상태에서 정리한다.
- 방 생성 최대 인원 기본값과 참여 제한 컨트롤의 클릭·포커스 동작을 보정한다.
- 사이트 전체의 reduced-motion 예외를 제거하고 방 따라가기 툴팁을 추가한다.
- 서버 API, 요청 스키마, 내부 변수명은 변경하지 않는다.

## Acceptance Criteria

- 방 프로필의 닉네임과 소개만 2줄 말줄임 처리된다.
- 사용자 노출 `내 신청곡` 문구가 `내 노래`로 바뀐다.
- 채팅 닉네임과 메시지 간격은 20px이고 스킵 버튼은 제목·사연 영역 세로 중앙이다.
- 사연 입력은 30자, 전체 트랙 탭의 내 노래 카드만 지정 그라데이션 배경이다.
- 프로필 완료 버튼은 변경 시에만 보이고 invalid면 disabled, 성공 후 숨는다.
- 랜덤 입장 오류는 텍스트만 보이며 3초 뒤 사라지고 재요청·성공·언마운트에서 타이머가 정리된다.
- 방 생성 최대 인원은 빈 옵션 없이 10명이 기본이며 참여 제한 컨트롤 전체 클릭과 비밀번호 포커스가 동작한다.
- 방 따라가기 버튼은 hover와 keyboard focus에서 `따라가기` 툴팁을 제공한다.
- reduced-motion media query가 남지 않는다.

## Selected Skills

- `queuing-feature-delivery`
- `queuing-orchestrator`
- `queuing-api-boundary`
- `queuing-ui-flow`
- `frontend-architecture-guardrails`
- `queuing-qa-reviewer`

## Ownership Decisions

- transient menu, form, tooltip, timer state는 각 feature component/hook이 소유한다.
- queue의 내 노래 판별은 기존 slug 기반 파생 로직을 재사용하고 전체 탭 렌더 경로에만 시각 prop을 전달한다.
- API 함수와 payload 타입은 유지하며 create form 초기 상태만 `10`으로 바꾼다.

## Planned Commit

1. `feat(ui): 방과 재생목록 프로필 상호작용 개선`

## Progress

- [x] 요구사항과 저장소 규칙 확인
- [x] 관련 코드와 테스트 매핑
- [x] 구현 및 타깃 테스트
- [x] lint, 전체 test, build
- [x] QA review
- [x] 단일 커밋

## Verification

- 관련 Vitest 파일
- `npm run lint` — 통과
- `npm run test` — 122 files, 433 tests 통과
- `npm run build` — 통과
- `git diff --check` — 통과

## Residual Risk

- 인앱 브라우저 인스턴스가 없어 데스크톱·축소·모바일 실제 viewport 시각 확인은 수행하지 못했다. CSS와 상호작용 테스트 및 production build로 대체 검증했다.
