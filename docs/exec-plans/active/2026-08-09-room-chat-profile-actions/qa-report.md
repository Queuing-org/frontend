# QA Report

## Result

- classification: pass
- browser reproduction: unavailable (`No browser is available`)
- residual visual risk: 흰 선 현상은 실제 화면 재현 없이 증상과 합성 조건을 바탕으로 수정했으므로 배포 환경에서 추가 확인이 필요하다.

## Boundary Review

- 회원 채팅은 팔로우/언팔로우·신고·차단을 제공한다.
- 방장 액션은 현재 사용자가 방장이고 `userSlug`로 현재 참가자를 정확히 찾은 경우에만 내보내기·방장 위임을 제공한다.
- 게스트 채팅은 `participantId`가 메시지에 없어 닉네임 추측을 하지 않고 신고만 제공한다.
- 방장 위임 payload는 `{ slug, userSlug }`이며 기존 `useTransferRoomOwner`의 room meta invalidation을 재사용한다.
- 프로필 `…` trigger는 hover뿐 아니라 `focus-within`, touch 환경에서도 접근 가능하다.
- dropdown은 trigger 재클릭, 바깥 pointer, Escape, 채팅 스크롤로 닫히며 Escape는 trigger로 포커스를 돌린다.
- 번쩍임 완화는 iframe·스크롤·동적 배경을 감싸던 `backdrop-filter`를 제거하고 채팅 list의 border-box 높이 계산을 명시했다.

## Verification

- targeted: 44 tests passed
- lint: passed
- build: passed
- full test single worker: 81 files, 245 tests passed
- initial parallel full test: 3 unrelated/target tests timed out at 5 seconds; all three passed in isolation before the stable single-worker full run
- `git diff --check`: passed
