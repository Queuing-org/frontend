# QA Report

## 자동 검증

- 설정 targeted: 2 files / 22 tests passed
- room join/realtime targeted: 2 files / 17 tests passed
- room profile/music-power targeted: 2 files / 31 tests passed
- fresh QA fix verification: 3 files / 19 tests passed
- full suite: 140 files / 537 tests passed
- `npm run lint`: passed
- `npm run build`: passed
- `git diff --check`: passed

## 경계 확인

- nickname count, maxlength, submit validation은 동일한 19자 상수를 사용한다.
- 공통 QueryClient helper는 기본 retry를 false로 두되 호출자 config가 우선한다.
- joined content 분리 전후 join/session/query enable 흐름과 UI props는 동일하다.
- 음악력은 같은 room/entry/target pending만 선택 표시하고, already-voted/pending은 disabled 사유가 아니다.
- 패널 테스트에서 제거한 음악력 API 분기는 새 hook 테스트가 success, error, already-evaluated, login, pending scope, duplicate guard로 보존한다.

## Fresh read-only QA

- initial: `fix`
  - nickname 19자 성공/20자 차단 제출 경계 추가
  - QueryClient custom option merge/client cache 격리 추가
  - entry 변경 뒤 새 payload 음악력 mutation 허용 추가
- final: `pass`, blocker 없음

## 잔여 위험

- nickname backend는 기존 문서상 20자를 허용하지만 최신 UI 요구에 따라 client는 19자로 제한한다.
- 실제 backend/STOMP와 브라우저 setting layout 수동 확인은 수행하지 않았다.
