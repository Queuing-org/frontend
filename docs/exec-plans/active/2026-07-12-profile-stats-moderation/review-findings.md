# Review Findings

## CodeRabbit inline threads

1. `BlockUserModal.test.tsx` pending promise 정리 누락 — `actionable`, `act`로 완료까지 flush.
2. `BlockUserModal.tsx` 실패 후 재시도 버튼 포커스 미복원 — `actionable`.
3. `chatMessages.ts` 비로그인 사용자에게 관리 액션 노출 — `actionable`.
4. `ChatArea.module.css` 하단 메뉴 clipping 가능 — `actionable`, 남은 공간에 따라 위/아래 배치.
5. `ChatArea.tsx` 동일 발신자 메뉴 accessible name 중복 — `actionable`, 메시지 내용 일부 포함.
6. `ReportChatMessageModal.module.css` deprecated `clip` — `actionable`, `clip-path`로 교체.
7. `RoomProfilePanel.tsx` slug 없음 안내 부정확 — `actionable`.
8. `ProfileSettingsTab.module.css` grid 모바일 규칙 불일치 — 사용자 요청으로 기존 3항목 flex UI를 복구해 `resolved` 처리.
9. `musicPower.test.ts` 추천 API 반환값 검증 누락 — `actionable`.

## CodeRabbit summary nitpicks

- 음악력 DTO/domain 분리 — `conflict`, 이번 요청이 `targetUserSlug` 필수 응답 계약을 명시하며 현재 mutation cache 갱신에 직접 사용하므로 유지.
- 중복 `formatStat` — `actionable`, shared pure utility로 추출.
- 테스트의 `as unknown as` — `actionable`, partial mock helper로 축소.
- `BlockUserModal`의 `isComplete` 파생 상태 — `actionable`, mutation `isSuccess`로 단일화.
- docstring coverage 경고 — `question/non-blocking`, TypeScript 함수 docstring 80% 규칙이 저장소 lint/CI 계약에 없으므로 일괄 주석 추가하지 않음.
- 방/설정 프로필의 이용 시간 placeholder 문구 불일치 — `actionable`, `개발중입니다.`로 통일.

## 사용자 후속 요청

- 차단 성공 즉시 해당 sender slug의 기존/신규 채팅을 현재 방에서 숨김.
- 새로고침 후 서버가 반환하는 `차단된 사용자의 채팅입니다` 안내 메시지도 숨김.
- 설정/방 프로필에 `이용 시간` 하드코딩 UI 복구.
- 음악력 추천/비추천 컨트롤을 프로필 패널 우측 하단으로 이동.
- Vercel의 `ERR_PNPM_OUTDATED_LOCKFILE` 실패 해결.

## 반영 결과

- Inline 1~7, 9와 유효한 summary nitpick을 코드/테스트에 반영했다.
- Inline 8은 이용 시간 포함 기존 3항목 flex UI 복구로 원인이 제거됐다.
- 차단 성공 콜백이 현재 방의 차단 slug 집합을 갱신하고 기존/실시간 메시지에 동일 필터를 적용한다.
- 서버의 차단 안내 센티널은 `shouldDisplayChatMessage`에서 제거한다.
- 테스트 의존성 5개와 전이 의존성을 `pnpm-lock.yaml`에 동기화하고 frozen install을 검증했다.
- `npm run lint`, `npm run test`(12 files/36 tests), `npm run build`가 통과했다.
- `pnpm install --frozen-lockfile`, `pnpm run lint`, `pnpm run test`(12 files/36 tests)가 통과했다.
- QA 판정: `pass`. 로컬 브라우저 시각 검증은 브라우저 연결 권한 문제로 실행하지 못했다.
