# QA Report

## Result

- classification: pass
- blocking findings: none

## Boundary Review

- 설정 칭호 목록과 대표 선택값은 `GET /api/v1/users/me/badges` 응답만 사용한다.
- 프로필 수정은 필수 nickname과 선택 statusMessage를 전송하고 boolean 결과를 반환한다.
- 한 줄 메시지만 저장할 때 현재 서버 nickname을 포함하며 미저장 nickname draft는 보존한다.
- 닉네임과 한 줄 메시지는 독립 form과 오른쪽 수정 버튼을 가진다.
- 프로필 수정 성공 시 내 정보와 공개 프로필 캐시를 함께 재검증한다.
- 로그아웃 성공 시 내 칭호 캐시를 제거해 계정 전환 시 이전 칭호 노출을 막는다.

## Verification

- targeted Vitest: 6 files / 14 tests pass
- `npm run lint`: pass
- `npm run test`: 46 files / 108 tests pass
- `npm run build`: pass
- `git diff --check`: pass
- fresh read-only QA: pass

## Residual Risk

- 실제 로그인 브라우저에서 획득 칭호 조회, 대표 칭호 변경, 닉네임/한 줄 메시지 독립 저장은 수동 확인하지 않았다.
