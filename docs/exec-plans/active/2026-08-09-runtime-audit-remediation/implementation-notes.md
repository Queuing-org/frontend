# 구현 메모

## 선택한 구조

- socket 생명주기는 reference count와 1초 idle handoff window로 관리한다. 같은 방 route 전환 중 이전 owner가 먼저 정리돼도 새 owner가 연결을 이어받을 수 있다.
- cache invalidation은 QueryClient·scope별 scheduler가 소유한다. mutation과 WebSocket handler가 서로 다른 timer를 만들지 않는다.
- 참가자 cursor는 commit된 infinite-query snapshot만 coordinator에 주입한다. render 중 mutable snapshot을 갱신하지 않고, 사용자 관리 액션의 추가 탐색은 single-flight로 직렬화한다.
- 큐 virtual window는 idle 렌더만 제한한다. drag가 활성화되면 기능 보존을 위해 sortable item을 임시로 전부 mount하고 cancel/end 뒤 즉시 window로 복귀한다.
- shared 계층에서 feature hook을 소유하던 파일은 실제 owner인 auth·room feature로 이동했다.
- ESLint boundary는 alias뿐 아니라 상대경로와 디렉터리 root import도 차단한다.
- 배지 카탈로그, 방 삭제, 예전 음악력 vote, 닉네임 prototype, 사용하지 않는 검색 UI와 CSS selector는 실제 import/export를 확인한 뒤 제거했다.

## 채택하지 않은 방식

- `cancelRefetch: false`: 진행 중인 오래된 GET이 최신 WebSocket·mutation 결과를 덮을 수 있어 제외했다.
- route effect의 AbortSignal 재사용: Strict Mode cleanup이 React Query 공유 요청까지 취소하므로 제외했다.
- socket 즉시 종료: route owner handoff 구간에 재연결과 join 중복을 만들 수 있어 짧은 idle window를 사용했다.
- 모든 방·검색 결과 10초 polling: 서버 부하가 커지고 사용자의 기존 요구와 충돌하므로 도입하지 않았다.
- 존재하지 않는 batch API 가정: 실제 backend 계약 밖의 필드를 만들지 않고 visible-only 요청으로 제한했다.
- 무제한 discovery cache: `maxPages=3` sliding window로 제한해 focus refetch와 검색·모바일 DOM의 상한을 같은 정책으로 고정했다.

## 빌드·의존성

- 패키지 관리자를 `npm@10.9.3`으로 고정하고 `pnpm-lock.yaml`과 미사용 `qrcode`를 제거했다.
- SUIT preload를 끄고 Bebas 폰트를 메인 로고 컴포넌트에만 scope했다.
- 큰 favicon은 64×64 PNG `app/icon.png` convention으로 교체했다.
- SUIT 자체 전송량과 일부 modal CSS의 초기 포함은 후속 최적화 대상으로 남아 있다.
