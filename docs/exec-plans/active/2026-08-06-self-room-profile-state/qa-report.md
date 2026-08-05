# QA Report

## 결과

- 최종 판정: `pass`
- fresh read-only QA 1차: `fix`
  - 인증 로딩 중 실제 본인 곡에도 비활성 음악력 버튼이 잠깐 렌더될 수 있는 flicker 확인
- 음악력 액션을 인증 확인 완료 후에만 렌더하고 로딩 → 본인 전환 테스트를 추가한 뒤 재검토: `pass`

## 확인 항목

- 본인은 공개 slug 일치로 판별한다.
- 본인 프로필에는 `내 노래가 나오고 있어요!` 배너만 액션 자리에 표시한다.
- 본인과 인증 로딩 중에는 음악력 위/아래 버튼이 DOM에 존재하지 않는다.
- 음악력 숫자와 나머지 프로필 정보는 유지한다.
- 타인, 비로그인, 게스트 프로필의 기존 음악력/관계 동작을 유지한다.
- 배너는 기존 액션 행과 동일한 28px 높이와 데스크톱 14px/모바일 1rem 위 여백을 사용한다.
- 장식 pulse는 `prefers-reduced-motion`에서 비활성화한다.

## 자동 검증

- `git diff --check`: pass
- 대상 테스트: 1 file / 21 tests pass
- `npm run lint`: pass
- 전체 테스트: 62 files / 170 tests pass
- `npm run build`: pass

## 참고

- 전체 테스트 직후 연속 실행한 첫 build가 이전 Next build 잠금/정지 상태로 완료되지 않아 해당 검증 프로세스를 종료했다. 잠금 제거 후 단독 `npm run build`는 정상 통과했다.
