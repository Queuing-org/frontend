# 팔로우 presence·프로필·queue UI 정리

## Scope

- 공유 `dev` 브랜치에서 팔로워/팔로잉 presence 표현을 통합한다.
- 음악력의 선택/취소 UI를 단발 PUT 평가로 단순화한다.
- 설정의 최애 곡을 제거하고 대표 칭호 해제를 연결한다.
- queue의 지난 곡 기능을 제거하고 전체 트랙에 현재 재생 곡을 표시한다.
- 긴 신청 사연은 실제 overflow가 있을 때만 연속 가로 스크롤로 전체 내용을 보여준다.
- 칭호 획득 모달을 축하 UI와 접근성 설정을 존중하는 confetti 효과로 개선한다.
- 방 프로필의 최애곡 카드를 한 줄 소개로 교체하고 음악력 1시간 안내 문구를 제거한다.
- 차단 목록 조회/해제를 연결하고 팔로워·팔로잉 카드 클릭 시 관계/차단 액션을 연다.
- 현재 재생 카드와 queue 카드의 긴 곡 제목도 실제 overflow가 있을 때 연속 가로 스크롤로 표시한다.
- 현재 재생 곡 썸네일의 `PLAY` 문구를 reduced motion을 존중하는 equalizer 애니메이션으로 교체한다.

## Selected Skills

- `queuing-feature-delivery`
- `queuing-orchestrator`
- `queuing-api-boundary`
- `queuing-ui-flow`
- `frontend-architecture-guardrails`
- `queuing-qa-reviewer`

## Ownership

- follow presence 서버 상태와 버전 병합: 기존 TanStack Query cache 및 전역 presence 구독
- follower/following 카드 표현과 방 이동: follow feature 공용 leaf component
- 음악력 mutation/cache: profile API hook, 유효 대상 및 오류 표현: room profile panel
- 대표 칭호 설정/해제 mutation: badge feature, 선택 UI: settings feature
- 현재 재생 곡: 상위 room playback query, queue 표현/정렬: room queue feature
- 사연 overflow 측정/애니메이션: room feature의 공용 leaf component와 로컬 DOM 상태
- 칭호 축하 효과: badge modal의 client-only side effect
- 차단 목록/해제: follow blocked API와 TanStack Query infinite cache
- 팔로우 카드 확장 상태: follower/following 목록 컴포넌트의 로컬 상태
- 곡 제목 overflow 측정/애니메이션: 기존 room feature 공용 marquee leaf component
- 현재 재생 표시: room queue card의 표현 전용 CSS animation

## Commit Slices

1. `feat(follow): 팔로우 접속 상태 카드 통합`
2. `feat(profile): 음악력 평가와 대표 칭호 해제 단순화`
3. `refactor(queue): 지난 곡 제거와 현재 곡 표시`
4. `docs(delivery): UI 정리 검증 결과 기록`
5. `fix(room): 긴 사연 순환 표시와 프로필 소개 정리`
6. `feat(badge): 칭호 획득 축하 모달 개선`
7. `feat(follow): 차단 목록과 카드 액션 연결`
8. `docs(delivery): 후속 UI와 차단 기능 검증 기록`
9. `feat(room): 긴 곡 제목 순환과 재생 애니메이션 추가`
10. `style(queue): 현재 재생 썸네일 오버레이 조정`
11. `fix(review): 봇 리뷰의 상태·접근성 결함 수정`

## Acceptance Criteria

- 온라인/오프라인 점과 상태 문구가 팔로워·팔로잉에 동일하게 표시된다.
- 방 제목은 비대화형 텍스트이며 우측 화살표만 방으로 이동한다.
- 팔로잉 카드에서 언팔로우 기능이 제거된다.
- 음악력은 UP/DOWN PUT만 제공하고 선택/취소/로컬 쿨다운 상태가 없다.
- 대표 칭호가 있는 상태에서 `칭호 없음`을 선택하면 DELETE 해제 요청과 캐시 무효화가 실행된다.
- 설정의 최애 곡과 queue의 지난 곡 관련 기능이 제거된다.
- 전체 트랙 첫 항목에 현재 재생 곡이 중복 없이 equalizer로 표시되며 pending count에는 포함되지 않는다.
- 현재 재생 카드와 queue 카드의 긴 사연은 overflow일 때만 끊김 없이 순환 표시되고 reduced motion에서는 움직이지 않는다.
- 현재 재생 카드와 queue 카드의 긴 곡 제목은 overflow일 때만 끊김 없이 순환 표시되고 reduced motion에서는 움직이지 않는다.
- 현재 재생 곡의 equalizer는 세 막대가 서로 다른 위상으로 움직이고 reduced motion에서는 정적인 막대로 표시된다.
- 현재 재생 곡 썸네일 전체에 `#ffffff` 60% 오버레이가 표시되고 막대는 `#3c3c3c`를 사용한다.
- 칭호 획득 모달은 badge별 축하 효과를 한 번 실행하고 기존 확인/Escape/배경 닫기를 유지한다.
- 방 프로필은 최애곡 대신 한 줄 소개를 표시하며 1시간 음악력 안내 문구가 없다.
- 차단 탭은 커서 페이지를 합쳐 표시하고 차단 해제 성공 시 목록/팔로우/검색 cache를 재검증한다.
- 팔로워·팔로잉 카드 클릭은 관계 버튼과 차단 버튼을 열고 방 이동 화살표는 확장과 독립적으로 동작한다.
- 팔로워 관계 확인은 `hasNext/nextCursor`를 끝까지 따라가 200명을 넘는 팔로잉도 정확히 판별한다.
- 동시 차단 해제는 모든 요청별 pending 상태를 유지하고 cache invalidation 완료까지 mutation을 pending으로 유지한다.
- 칭호 모달은 짧은 viewport에서 세로 스크롤 가능하고 설명 대비를 충족하며, 닫힐 때 실행 중 confetti를 즉시 정리한다.
- marquee 테스트는 `ResizeObserver` 전역 stub을 테스트마다 복원한다.
- `npm run lint`, `npm run test`, `npm run build`, fresh QA가 통과한다.

## Progress

- [x] dev/main 동기화
- [x] 실행 계획 생성
- [x] follow UI 통합
- [x] 음악력/칭호 설정 변경
- [x] queue history 제거 및 현재 곡 병합
- [x] targeted/full QA
- [x] 기능 단위 commit
- [x] push/Draft PR
- [x] 후속 room/badge/follow 구현
- [x] 후속 targeted/full QA
- [x] 기능 단위 commit/push와 Draft PR 갱신
- [x] Vercel stale pnpm lock 실패 수정 및 frozen install 검증
- [x] 긴 곡 제목 순환/equalizer 구현
- [x] 후속 targeted/full QA와 fresh QA
- [x] 기능 commit/push와 Draft PR 갱신
- [x] 현재 재생 썸네일 오버레이 스타일 조정
- [x] 스타일 QA
- [x] 스타일 commit/push와 Draft PR 갱신
- [x] 봇 리뷰 분류와 타당한 지적 수정
- [x] review targeted/full QA
- [ ] review fix commit/push와 checks 재확인

## Residual Risk

- 실제 1시간 음악력 제한 문구는 backend 오류 응답에 의존하며 프론트는 별도 타이머를 두지 않는다.
- presence의 `room`은 공개 방만 제공된다는 기존 API 계약을 유지한다.
- 브라우저 자동화 연결이 실행 환경 메타데이터 오류로 시작되지 않아 픽셀 단위 QA는 남아 있다.
