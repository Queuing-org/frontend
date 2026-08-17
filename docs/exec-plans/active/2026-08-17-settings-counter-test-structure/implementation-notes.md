# Implementation Notes

## 닉네임 카운터

- nickname limit 상수를 mock 대상 hook 밖의 `model/profileSettingsLimits.ts`로 옮겨 UI와 제출 검증이 같은 값을 사용한다.
- nickname input은 최애곡과 동일한 `textInputControl`, `textInputWithCounter`, `characterCount` CSS를 재사용한다.
- `maxlength`, validation, 안내 문구를 19자로 일치시키고 count/hint/error를 `aria-describedby`에 연결했다.

## 테스트 인프라

- `createTestQueryClient`가 query/mutation retry 기본값을 한 곳에서 설정하고 개별 config override를 보존한다.
- `createTestQueryClientWrapper`가 provider wrapper 생성을 소유한다.
- query 설정 중복이 가장 많던 `useRoomRealtimeEvents.test.tsx`와 `RoomPlaybackScreen.test.tsx`부터 마이그레이션했다.

## RoomPlaybackScreen

- route params, join/session, password/conflict, query enable 조율은 `RoomPlaybackScreen`에 유지했다.
- joined mobile/desktop room composition, leave dialog, chat/queue/participant UI는 `RoomPlaybackJoinedContent`로 이동했다.
- 기존 CSS module과 props/data flow를 유지했다.

## RoomProfilePanel

- `useRoomMusicPowerVote`가 entry-scoped query, pending selection, duplicate guard, mutation feedback을 소유한다.
- `RoomMusicPowerActions`가 양방향 button DOM과 접근성/선택 상태를 소유한다.
- `RoomProfilePanel`은 프로필 데이터·관리 액션·하위 UI composition만 담당한다.
- 음악력 API 분기 테스트는 큰 패널 통합 렌더에서 hook 경계 테스트로 이동하고, 패널에는 wiring/visibility 검증만 남겼다.
