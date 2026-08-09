# QA Report

## 결과

- 판정: PASS
- `invalid-input`은 pending을 resolve하고 composer 표시 오류는 비운다.
- pending의 backfill 및 confirm 타이머가 해제되어 8초 후 지연 오류가 다시 나오지 않는다.
- 다른 서버 전송 오류는 기존 메시지를 유지한다.
- 모바일 inline과 데스크톱 floating composer가 같은 `sendErrorMessage`를 사용한다.

## 검증

- focused test: 2 passed
- `npm run test`: 81 files, 240 tests passed
- `npm run lint`: pass
- `npm run build`: pass
- `git diff --check`: pass
- fresh read-only QA: pass

## 제한 및 보존

- 실제 로그인 방에서 금칙어를 보내는 파괴적 수동 QA는 수행하지 않았다.
- 기존 `FollowModal.module.css` 및 관찰된 다른 동시 작업 변경은 수정·커밋 대상에서 제외한다.
