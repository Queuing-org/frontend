# QA Evidence

## Scope checks

- 홈·검색 화면에서 CREATE, FOLLOW, SETTING을 정적 import한다.
- 각 화면은 단일 `activeModal` union state로 한 모달만 렌더한다.
- 로그인 gate와 비밀번호 방 모달의 dynamic import는 유지한다.
- preload/idle/intent/controller 전용 참조와 파일은 남기지 않는다.
- 랜덤 입장 오류 피드백은 기존 모바일·데스크톱 UI에 유지한다.

## Automated verification

- `npx vitest run src/features/home/ui/MobileHomeRoomFeed.test.tsx src/features/room/list/ui/HomeRoomStage.test.tsx src/features/room/search/ui/SearchEmptyState.test.tsx src/features/room/discovery/ui/HomeControlPanelShell.interaction.test.tsx src/features/room/create/ui/RoomFormModal.test.tsx src/features/follow/ui/FollowModal.test.tsx`
  - pass: 6 files, 18 tests
- `npm run lint`
  - pass
- `npm run test`
  - pass: 105 files, 323 tests
- `npm run build`
  - pass: Next.js production build and TypeScript
- `git diff --check`
  - pass
- Draft PR #40 GitHub Actions `Lint, test, and build`
  - pass
- Draft PR #40 Vercel deployment
  - pass

## Runtime checks

- `https://local.queuing.cc:3000/`: HTTP 200
- `https://local.queuing.cc:3000/search`: HTTP 200
- 연결된 브라우저 제어 인스턴스가 없어 로그인 상태의 실제 클릭 smoke test는 실행하지 못했다.

## Fresh read-only QA

- result: pass
- blocker: none
- confirmed:
  - 정적 import와 단일 modal state
  - 로그인 gate 유지
  - 비밀번호 모달의 dynamic fallback 유지
  - 랜덤 입장 오류 UI 유지
  - preload 관련 dead source·prop·export 없음
  - 정적 import 시 top-level browser API 실행 위험 없음
- residual risk:
  - HomeScreen/SearchScreen 화면 단위 open/close 통합 테스트는 없으며, 하위 메뉴·버튼 callback 테스트와 production build로 현재 변경을 검증했다.
