# Frontend Runtime Audit Report

## 결론

- P0는 확인되지 않았다.
- P1 3건, P2 15건, P3 정리 묶음 3건을 확인했다.
- 가장 먼저 고칠 항목은 참가자 칭호 N+1, 채팅 state/DOM 무한 증가, 이벤트·mutation 중복 재검증이다.
- 이번 변경에서는 실제 사용처가 없는 `FollowModal` 검색/친구 추가 CSS만 삭제했다. 아래 구조 변경은 서로 영향을 주므로 별도 최적화 작업에서 요청 수와 DOM 상한 테스트를 먼저 추가한 뒤 적용해야 한다.

## 즉시 반영한 정리

### FollowModal 미사용 CSS

- 위치: `src/features/follow/ui/FollowModal.module.css`
- 삭제: `searchForm`, `searchInput`, `searchDropdown`, `addAction`, `addButton`과 관련 pseudo/global selector
- 근거: production TS/TSX import graph와 전체 `styles.*`/동적 index 검색에서 참조가 0건이다. 현재 친구 추가 입력은 `AddFriendModal`의 별도 CSS를 사용한다.
- 회귀 확인: 삭제 selector 전체 검색 0건, lint/test/build 통과.

## P1 — 먼저 수정할 운영 부하

### 1. 참가자 패널의 사용자별 칭호 N+1과 전체 명단 eager load

- 근거: `RoomParticipantList.tsx:73-97`에서 참가자 slug마다 `useQueries(publicUserBadgesQueryOptions)`를 만들고, `fetchPublicUserBadges.ts:6-13`이 사용자마다 별도 GET을 보낸다. `fetchRoomParticipants.ts:31-50`도 참가자 cursor page를 전부 직렬 수집한다. 방 최대 인원은 `RoomFormModal.tsx:24` 기준 250명이다.
- 트리거: 참가자 패널 최초 오픈 또는 닫았다 재오픈. badge query는 `staleTime`이 0이고 AbortSignal도 전달하지 않아 닫은 뒤에도 시작된 요청이 계속된다.
- 영향: 최대 방에서 참가자 3 page와 칭호 최대 250 GET, 전체 카드 DOM 및 `unoptimized` avatar가 한 번에 생성된다. JOIN/LEFT 때 전체 participant query invalidation도 반복된다.
- confidence: high. room/social 두 감사와 교차 검토가 독립 확인했다.
- 권장 수정: participant DTO에 대표 칭호를 포함하거나 batch endpoint를 추가하고, participant cursor UI/virtualization과 AbortSignal 전달을 적용한다. 임시 완화로 badge `staleTime`을 명시한다.
- 검증: 250명 fixture에서 패널 오픈 요청 수가 O(page), 재오픈 추가 badge GET 0, 닫을 때 진행 요청 abort, JOIN/LEFT burst 요청 상한을 테스트한다.

### 2. 채팅 state·DOM 무한 증가와 메시지당 O(n) merge

- 근거: `useRoomChatHistory.ts:76-80`은 매 메시지마다 전체 배열을 복사해 `mergeUniqueChatMessages`, `chatMessages.ts:97-130`은 Map과 배열을 전체 재구축한다. 과거 page도 계속 prepend하고 cap이 없다. `ChatArea.tsx:201-217,420-470`은 전체 filter와 전체 row 렌더를 반복한다.
- 트리거/영향: 장시간 방 체류 또는 과거 기록 반복 로드. 누적 append 비용이 O(n²), 메모리와 DOM node가 무상한 증가한다. inbound 확인 실패 중 연속 전송하면 2초/8초 backfill timer가 전송 수만큼 생겨 최신 100건 REST 조회도 겹칠 수 있다.
- confidence: high. room/social/shared 세 감사가 독립 확인했다.
- 권장/검증: message identity index를 증분 유지하고 최근 window/cursor store와 virtualization을 적용한다. backfill은 room 단위 single-flight로 합친다. 단순 배열 잘라내기는 과거 기록과 scroll anchor를 깨므로 피한다. 10k event 뒤 state/DOM 상한과 20 pending send의 backfill 상한을 테스트한다.

### 3. mutation과 WebSocket 이벤트의 중복 invalidation 및 취소 불가능한 GET

- 근거: queue·playback 이벤트는 `useRoomRealtimeEvents.ts:247-283`에서 재검증한다. 동시에 add/skip/move/delete/kick mutation도 `useAddTrackAction.ts:107-115`, `useSkipTrackAction.ts:12-25`, `useMoveRoomQueueEntry.ts:58-64`, `useDeleteRoomQueueEntries.ts:49-55`, `useKickRoomParticipant.ts:17-23`에서 같은 query를 재검증한다. playback/participants/queue queryFn은 QueryFunctionContext의 AbortSignal을 API까지 전달하지 않는다.
- 트리거: add, skip, reorder, delete, kick 또는 JOIN/LEFT burst. 같은 서버 변화가 mutation success와 WS event 양쪽에서 도착한다.
- 영향: 기존 refetch를 취소했다고 판단해도 실제 HTTP와 cursor loop는 계속되고 새 refetch가 겹친다. participants는 요청 하나가 최대 3 page이고 loaded infinite queue는 여러 page가 재조회될 수 있다.
- confidence: high. cold query promise dedupe는 동작하므로 단순 mount 중복이 아니라 mutation/event와 warm-cache 조건으로 한정한다.
- 권장 수정: 서버 이벤트 또는 mutation response 중 한 경로를 authoritative cache update로 정하고 이벤트 burst를 coalesce한다. 모든 GET에 signal을 전달한다.
- 검증: 지연 API 상태에서 동일 이벤트 10회와 add/skip/reorder 1회당 실제 transport call budget 및 abort를 검증한다.

## P2 — 규모·장시간 사용에서 체감되는 항목

### 4. 방 이탈 뒤에도 room STOMP transport가 계속 활성 상태

- 근거: 최초 join은 `joinRoom.ts:95-98`에서 socket을 연결하지만 leave cleanup `useRoomRealtimeEvents.ts:175-186`은 구독 해제와 leave publish만 한다. `disconnectSocket`은 `stompConnection.ts:57-59`에만 정의되고 production 호출이 없다. heartbeat는 `createStompClient.ts:9-22` 기준 4초, reconnect delay는 5초다.
- 트리거/영향: 한 번 방에 들어간 SPA 세션은 홈·검색으로 나온 뒤에도 room socket heartbeat와 장애 재접속을 지속한다. 사용자 한 명의 비용은 작지만 전체 접속 규모에서는 불필요한 상시 연결이 된다.
- confidence: high. app-scoped socket을 의도했을 가능성은 있으나 팔로우 presence socket과 별개다.
- 권장/검증: room session ref-count 또는 짧은 idle timeout 후 deactivate. route unmount 뒤 active=false·heartbeat/reconnect 0, 재입장 activate를 테스트한다.

### 5. 동일 STOMP destination의 평시 2중·곡 추가 중 3중 구독

- 근거: `/topic/room/{slug}/events`를 `useRoomRealtimeEvents.ts:304-331`과 `useRoomChatRealtime.ts:292-319`가 각각 구독한다. `/user/playlist/events`도 `useRoomRealtimeEvents.ts:377-400`과 `useRoomChatRealtime.ts:322-361`가 각각 구독한다. 곡 추가 중 `useAddTrackAction.ts:153-194`가 두 destination을 임시로 하나씩 더 구독한다.
- 트리거/영향: 로그인 사용자가 방에 정상 입장하면 room/user event가 2중 구독되고, add 응답 대기 중에는 bounded one-shot 구독이 더 붙는다. broker frame 전송과 JSON parse·분기 비용이 중복된다.
- confidence: 구조 확인은 high, 현재 backend에서 legacy room-event chat fallback이 필요한지는 medium이다. `2026-05-31-chat-realtime-confirmation` incident에 과거 backend 호환 가설이 기록돼 있어 캡처 없이 fallback을 바로 삭제하면 안 된다.
- 권장/검증: 실제 운영 frame에서 `/events`의 `CHAT_MESSAGE`가 더는 없는지 확인한다. 필요하면 destination당 단일 dispatcher로 fallback을 공유하고, 불필요하면 제거한다. joined/reconnect/add-submit 상태의 active subscription 수와 chat 수신 회귀를 테스트한다.

### 6. queue 첫 page부터 최대 100 row·200 ResizeObserver와 누적 DnD

- 근거: `fetchRoomQueue.ts:12,34-56`의 page size는 100이다. `RoomQueueList.tsx:29-40`과 `RoomQueueSortableList.tsx:224-299`는 loaded entry 전체를 렌더한다. 카드마다 title/story에 `OverflowMarquee`를 최대 2개 만들고 각 인스턴스가 `OverflowMarquee.tsx:54-83`에서 2 node를 관찰한다. owner DnD는 전체 item을 `useSortable`로 등록한다.
- 트리거/영향: queue 패널 오픈과 더 보기 반복. DOM·observer·무한 CSS animation·DnD 등록이 page마다 계속 늘고 72px thumbnail도 `unoptimized`로 원본을 받는다.
- confidence: high.
- 권장/검증: visible-window virtualization, loaded page 상한, hover/focus 시 marquee 측정/animation, 최적화 thumbnail을 적용한다. 500 entry에서 DOM/observer 상한과 drag frame budget을 테스트한다.

### 7. room meta 입장 시 중복 GET과 warm-cache joined refetch

- 근거: `RoomPlaybackScreen.tsx:190-266`이 입장 전에 `fetchRoomMeta(slug)`를 직접 호출하고 joined content의 `useRoomMeta`가 다시 같은 GET을 한다. joined 상태에서 enabled query가 fetch하는 동시에 `RoomPlaybackScreen.tsx:282-293` effect가 playback/participants `refetch()`를 호출한다.
- 트리거/영향: 모든 첫 입장에서 meta 2회. cold query는 TanStack promise dedupe 가능하지만 같은 방 재입장·재연결처럼 cache data가 있으면 signal 미전달 요청이 겹칠 수 있다.
- confidence: meta 중복 high, joined refetch 중복은 warm-cache 조건부 medium.
- 권장/검증: 입장 전 meta를 `queryClient.fetchQuery/ensureQueryData`로 받아 같은 cache를 사용하고 joined refresh 경로를 하나로 만든다. cold/warm/reconnect별 exact call count를 테스트한다.

### 8. 방 탐색 infinite data와 보이지 않는 카드 DOM의 무상한 증가

- 근거: `useFetchRooms.ts:125-147`은 page size 30, `maxPages` 없음. desktop `HomeRoomStage.tsx:255-287`은 누적 room 전체를 mount하고 off-left/right는 CSS opacity만 0이다. search/mobile 목록도 loaded room 전체를 렌더한다. `roomDiscoveryCachePolicy.ts:1-6`은 staleTime 0, mount/reconnect always, focus refetch라 N page 로드 후 N page를 재검증한다.
- 트리거/영향: 사용자가 끝까지 탐색하거나 더 보기를 반복한 뒤 focus/reconnect. 카드 DOM/image와 page 재요청이 누적된다. 한 page만 본 일반 흐름은 낮은 위험이다.
- confidence: high, 조건부 P2.
- 권장/검증: stage는 selected index 주변만 mount하고 목록은 virtualize한다. `maxPages` 또는 focus 시 first-page reset 정책을 결정한다. 20 page 뒤 DOM/image/refocus GET 상한을 테스트한다.

### 9. 친구 추가 검색의 keypress별 GET과 요청 취소 부재

- 근거: `useAddFriendModalState.ts:11-17,29-33`가 raw query를 바로 `useSearchUsers`에 전달하고 `useSearchUsers.ts:7-12`는 글자별 query key를 만든다. `searchUsers.ts:6-13`까지 debounce와 signal 전달이 없다.
- 트리거/영향: 10글자를 빠르게 입력하면 최대 10 GET이 계속 실행되고 query cache도 글자별로 남는다. query key 분리로 오래된 결과 역전 표시는 막힌다.
- confidence: high, room/social 교차 확인.
- 권장/검증: trim·최소 2자·200~300ms debounce와 AbortSignal 전달. fake timer와 지연 응답으로 마지막 1회/이전 abort를 테스트한다.

### 10. 관계 확인 1건을 위해 내 팔로잉 전체 pagination

- 근거: `useFollowingRelationship.ts:9-15`가 `fetchAllFollowing`, `fetchAllFollowing.ts:5-42`가 size 100으로 끝까지 순차 조회한다. follower 카드 확장과 room participant 관리 메뉴에서 사용한다.
- 트리거/영향: 팔로잉 1,000명 계정에서 한 사람의 관계 버튼을 열어도 10 page 뒤에야 상태가 확정된다. global query key를 공유하므로 카드별 N+1은 아니라는 점은 확인했다. follow/unfollow broad invalidation 뒤 observer가 있으면 전체가 다시 조회된다.
- confidence: high.
- 권장/검증: 단일 relationship endpoint 또는 목록 DTO의 관계 필드와 slug membership cache를 사용한다. 1,000명 계정에서 메뉴 한 번이 전체 pagination을 일으키지 않는지 테스트한다.

### 11. 모바일 SSR과 첫 client render의 media query 결과 불일치

- 근거: `useMediaQuery.ts:6-12`는 서버에서 false, 모바일 client initializer에서 true를 반환할 수 있다. `HomeScreen.tsx:238-303`과 `RoomPlaybackScreen.tsx:468-643`은 그 값으로 desktop/mobile 큰 트리를 통째로 분기한다.
- 트리거/영향: 좁은 화면에서 hard reload/hydration. DOM 불일치 recoverable error, 전체 tree 교체, desktop flash와 CLS가 생길 수 있다.
- confidence: high, 교차 검토 confirm.
- 권장/검증: `useSyncExternalStore`의 결정적 server snapshot 또는 hydrate 전 공통 shell/CSS-first 반응형을 사용한다. `matchMedia=true` hydration에서 recoverable error와 desktop flash 0을 검증한다.

### 12. 모바일 홈 검색 keypress마다 누적 카드 전체 reconciliation

- 근거: `HomeScreen.tsx:44-45`의 raw input state가 상위에 있어 매 키마다 전체 screen이 render되고, `MobileHomeRoomFeed.tsx:247-263`은 memo 없이 loaded room 전체를 map한다. API는 300ms debounce되어 keypress별 요청은 아니다.
- 트리거/영향: 여러 page를 로드한 모바일 홈에서 검색 입력. O(loaded rooms) reconciliation으로 typing 지연이 커질 수 있다.
- confidence: high, 네트워크 폭증 주장은 교차 검토에서 기각했다.
- 권장/검증: 즉시 input state를 top bar로 내리고 debounced 값만 page에 전달하거나 feed/card memo와 안정 handler를 적용한다. 300 card React Profiler commit을 측정한다.

### 13. 프로덕션에서 STOMP frame/body와 heartbeat debug 출력

- 근거: `createStompClient.ts:15-22`가 모든 Client에 `debug: console.log`를 주입하고 `stompConnection.ts:19-46`도 connect/error/close를 무조건 출력한다. production chunk에 관련 문자열이 남아 있다. stompjs는 수신/송신 frame, body, PING/PONG도 debug로 넘긴다.
- 트리거/영향: 로그인 일반 화면은 follow socket, 방에서는 room socket까지 4초 heartbeat와 모든 frame을 console에 기록한다. main-thread 작업과 사용자/채팅 payload 노출 위험이 있다.
- confidence: high, production build artifact 확인.
- 권장/검증: production debug no-op, 오류 telemetry는 body를 제거한다. prod bundle string scan과 mock Client debug 호출 0을 테스트한다.

### 14. 닫힌 interaction modal이 home/search 초기 JS·CSS에 포함

- 근거: `HomeScreen.tsx:30-36,117-137`과 `SearchScreen.tsx:34-39,119-133,357-361`이 RoomForm/Join/Follow/Settings modal을 정적 import한다. production manifest에서 각 route에 RoomForm/Join 약 23KB gzip, Follow/Settings 약 15KB gzip chunk가 초기 포함된다.
- 트리거/영향: modal을 한 번도 열지 않는 홈/검색 첫 진입에도 다운로드·parse 비용을 지불한다.
- confidence: high.
- 권장/검증: modal body를 dynamic import하고 hover/focus/idle prefetch 여부를 측정한다. route manifest 초기 chunk 제거와 첫 open/a11y 회귀를 검증한다.

### 15. 전 route critical font preload 약 651KB

- 근거: `layout.tsx:9-21,55-63`이 SUIT WOFF2 624,536B와 Bebas TTF 57,676B를 전역 preload한다. Bebas 실제 사용은 `MainLogo.module.css:2`뿐인데 auth/onboarding/search 등 모든 HTML에 preload link가 있다.
- 트리거/영향: 모든 cold navigation에서 실제 사용 여부와 무관하게 큰 font transfer가 critical 대역폭을 차지한다.
- confidence: high, production HTML 확인.
- 권장/검증: Bebas를 로고 범위로 내리고 WOFF2/preload 정책을 조정한다. SUIT는 한글 subset·unicode-range를 검토한다. route별 font transfer, LCP, CLS를 비교한다.

### 16. 같은 1120px PNG를 favicon과 80px login logo로 각각 전송

- 근거: `src/app/favicon.ico`가 실제로는 305,707B PNG이고 `public/qlofile_white.png`와 SHA256이 같다. `LoginModal.tsx:71-80`은 같은 원본을 80px `unoptimized priority`로 사용한다. URL이 달라 cache도 공유하지 않는다.
- 트리거/영향: favicon과 로그인 modal에서 약 611KB를 전송하며 favicon 응답도 max-age=0/must-revalidate다.
- confidence: high.
- 권장/검증: proper 16/32/48 favicon과 80/160 logo 파생을 만들고 modal priority를 제거/측정한다. 응답 bytes·content type·시각 회귀를 확인한다.

### 17. shared→feature 역방향 의존과 home↔room 양방향 feature graph

- 근거: `shared/lib/useAuthenticatedAction.ts`, `useRoomNavigator.ts`, `useLoadMoreRoomsNearEnd.ts`가 feature를 import해 `ARCHITECTURE.md:31-33`의 shared 경계를 위반한다. `HomeScreen`은 room을, `SearchScreen`은 home을 import한다.
- 트리거/영향: 즉시 렉보다 ownership 붕괴와 초기 bundle 분리 실패, 변경 파급과 순환 의존 위험이 핵심이다. interaction modal eager chunk 문제와 같은 구조적 원인이다.
- confidence: high for dependency violation; 실제 ESM runtime SCC는 미확정이다.
- 권장/검증: auth/room-discovery owner로 hook을 이동하고 lint boundary rule 또는 dependency-cruiser를 추가한다. build와 import graph gate를 검증한다.

### 18. npm/pnpm 이중 lockfile과 실행 환경 불일치

- 근거: `package-lock.json`, `pnpm-lock.yaml`이 모두 추적되고 `packageManager`가 없다. CI는 `npm ci`, Vercel은 pnpm을 감지하며 동일 구조의 `ERR_PNPM_OUTDATED_LOCKFILE` incident 기록이 있다.
- 트리거/영향: dependency 변경 시 한 lock만 갱신하면 CI와 배포가 다른 dependency graph를 설치하거나 배포가 실패한다. 현재 두 lock은 동기라 이번 build는 통과했다.
- confidence: high, build reliability 항목.
- 권장/검증: package manager 하나로 단일화하고 Corepack/CI/deploy를 일치시킨다. 이중 유지가 필수면 두 frozen install을 gate로 둔다.

## P3 — 안전 확인 후 정리할 항목

### 19. production import graph에서 도달 불가한 legacy island

- 후보: `auth/logout/ui/logoutButton.tsx`, badge의 `fetchBadges/useBadgeCatalog`, room delete chain, `RoomTags`, `JoinRoomButton`, `RoomSearchBadge`, user nickname prototype, old music-power vote hook, user search prototype.
- 영향/confidence: production bundle에는 도달하지 않아 런타임 영향은 없고 lint/type/test/유지보수 표면만 늘린다. high confidence.
- 권장/검증: 제품에서 잠시 숨긴 기능인지 owner 확인 후 기능 단위로 삭제하고 전체 import graph·test·build를 검증한다.

### 20. 미사용 export·CSS selector·dependency

- export: `badgeDisplay.ts`의 `getBadgeCatalogItems/getCatalogBadgeHint`, `roomQueue.ts`의 `getQueueEntryStatus`, `stompConnection.ts`의 `disconnectSocket`, `viewportDensity.ts`의 `isLaptopCompactViewport`.
- CSS: FollowModal의 legacy user list 10개, Home/Search state panel, mobile/stage skeleton, form error/column/button, floating placeholder 등 25개 selector 후보.
- dependency: `package.json`의 devDependency `qrcode`는 repo 참조 0건이다.
- 영향/confidence: P3/high. dynamic CSS 접근은 발견되지 않았지만 selector는 컴포넌트별로 다시 확인한 뒤 묶음 삭제해야 한다.
- 권장/검증: knip 계열 import graph와 CSS module selector 검사를 CI에 추가하고 작은 기능 단위로 삭제한다.

### 21. 미참조 public asset과 fallback preload 후보

- 후보: follow/profile/owner/search 관련 SVG와 title asset 일부, search SSR fallback thumbnail `priority` preload.
- 영향/confidence: asset 참조는 backend가 문자열 URL을 내려주는지 미확인이라 삭제 보류. fallback은 실제 browser에서 응답 전송 여부를 측정해야 하므로 P3/medium이다.
- 권장/검증: 서버·문서의 asset URL 계약 확인, 브라우저 network에서 fallback과 실제 selected image 동시 전송 여부 확인 후 삭제/priority 조정한다.

## 기각하거나 낮춘 후보

- React Query Devtools: production chunks에서 module/string 0건으로 tree-shake된다. bundle finding에서 제외했다.
- root의 badge/follow provider가 각각 호출하는 `useMe`: 같은 query key의 in-flight 요청은 TanStack Query가 dedupe한다. 최초 중복 GET으로 보지 않는다.
- settings 탭 왕복의 `useMe` staleTime 0: 재요청 가능성은 있으나 인증 freshness 의도와 실제 call count 측정이 없어 P3 관찰 대상으로만 남겼다.
- event listener, modal timer, badge SSE, follow presence socket, YouTube iframe: 조사 범위에서 대응 cleanup을 확인해 leak finding을 기각했다.
- joined 직후 playback/participants refetch: cold/no-data에서는 진행 promise가 dedupe된다. warm-cache 재입장/재연결 조건만 finding 7에 남겼다.
- 홈/검색 API keypress 폭증: room 검색은 300ms debounce가 정상 동작한다. 단, AbortSignal 부재와 mobile render 비용은 별도 finding으로 유지했다.
- Axios 429와 React Query의 이중 retry: `shouldRetryQuery`가 4xx/429를 재시도하지 않아 multiplicative retry가 아니다.
- 방 discovery의 staleTime 0 자체: polling 제거 후 freshness를 위한 명시 정책이다. 한 page 일반 흐름은 낮게 보고 page 누적 조건만 P2로 남겼다.

## 권장 수정 순서

1. 참가자 대표 칭호 계약/batch와 participant pagination·virtualization
2. mutation/WS cache update 단일화 + 모든 GET AbortSignal 전파
3. chat/queue/room discovery windowing·virtualization과 상태 상한
4. destination 단일 dispatcher 검증 + STOMP production debug 제거
5. mobile hydration 및 검색 render/search request 개선
6. modal/font/image 초기 전송량 축소
7. dependency boundary와 package manager 단일화
8. owner 확인 후 legacy island·selector·asset 정리

## 감사 방법

- app route를 root로 한 production import graph와 identifier/CSS selector 참조 검색
- React Query key, observer mount, invalidation, cursor pagination, AbortSignal 전달 경로 추적
- STOMP destination/subscribe/unsubscribe/reconnect/heartbeat 소유권 추적
- production `next build` route chunk·HTML preload·asset size/string scan
- room runtime, social UI, shared/build 세 lane 독립 감사 후 room↔social 및 shared의 교차 검토
