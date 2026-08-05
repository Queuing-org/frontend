# QA Report

- result: pass
- targeted: `RoomProfilePanel`, `FollowToggleButton`, `chatMessages` 3 files / 25 tests pass
- full: 57 files / 152 tests pass
- lint: pass
- build: pass (Next.js production build, dev 서버 중지 후 2.2초 compile)
- diff check: pass

## Boundary Review

- 프로필 위젯 설정은 기존 `300x380`이며 이번 변경 diff에 포함되지 않는다.
- 관리 UI는 프로필 패널 안에서 버튼 아래에 붙는 `role=menu` dropdown이고 portal, overlay, dialog를 사용하지 않는다.
- 일반 사용자는 신고/차단만 보고, 현재 사용자가 방장이면서 대상이 본인/방장이 아닐 때만 내보내기를 본다.
- 신고는 대상 `senderSlug`의 현재 로드된 최신 `messageKey`를 기존 `ReportChatMessageModal`에 전달한다.
- 기존 신고 API와 비공개 방 비밀번호 header 계약을 그대로 사용한다.
- 신고 가능한 채팅이 없으면 네트워크 요청 없이 안내한다.
- Escape, 관리 버튼 재클릭, 바깥 클릭 닫기와 Escape 포커스 복원을 테스트한다.
- fresh read-only QA에서 내보내기 pending 중 Escape가 막히는 조건을 발견해 제거하고 회귀 테스트를 추가했다.
- 사용자 소유 `CurrentRequesterCard.module.css` 사연 폭 변경은 staging 대상에서 제외한다.

## Manual QA

- 로컬 dev 재기동 후 `/home`, `/room/d9FZXzQV`가 200을 반환했다.
- in-app browser connector가 sandbox metadata 오류로 연결되지 않아 자동 시각 캡처는 수행하지 못했다.

## Residual Risk

- 프로필 신고는 현재 프론트가 로드한 채팅 범위 안에서만 최신 대상 메시지를 찾는다. 대상의 메시지가 아직 로드되지 않았으면 신고 가능한 메시지 없음 안내가 표시된다.
- 고정 `300x380` 패널에서 프로필 정보가 길면 기존 content 영역의 내부 스크롤이 생길 수 있다. dropdown 최대 3개 항목은 현재 배치에서 패널 안에 들어간다.

## Fresh Read-only QA

- initial verdict: fix (내보내기 pending 중 Escape가 막히는 조건 발견)
- resolution: pending 여부와 무관하게 Escape가 dropdown을 닫도록 수정하고 회귀 테스트 추가
- final boundary review: pass, blocking finding 없음
