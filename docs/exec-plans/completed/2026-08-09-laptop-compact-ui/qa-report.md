# QA Report

## 자동 검증

- `npm run lint`: pass
- `npm run test`: pass, 72 files / 209 tests
- `npm run build`: pass
- viewport boundary tests: 1366×768, 1440×900, 1536×864, 1600×900 compact; 760×900 mobile boundary 및 1601×901 이상 normal
- floating widget tests: compact geometry 80%, normal geometry 보존, offset storage namespace 분리, resize mode 전환 복원, bounds clamp
- hydration test: SSR snapshot에서 저장된 floating widget open 상태를 노출하지 않음
- `git diff --check`: pass

## 런타임 확인

- `https://local.queuing.patulus.com:3000/`: HTTP 200
- 현재 실행 환경에 연결 가능한 브라우저가 없어 자동 viewport screenshot QA는 수행하지 못했다.

## 보존 변경

- 사용자 소유 `src/features/follow/ui/FollowModal.module.css` `.searchInput`의 `max-width: 750px`, `margin-left: 100px`는 이번 변경에서 제외한다.

## Fresh read-only QA

- 최초 verdict `fix`: 홈·검색 재시도 버튼 및 로딩 스피너 compact 누락, floating widget hydration 위험
- 수정 후 verdict `pass`

## 잔여 확인

- Draft PR #36 CI pass
- 실제 노트북 viewport 시각 확인은 PR preview에서 진행
