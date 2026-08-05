# QA Report

## 판정

- result: pass
- blocker: 없음

## 요청 대비 확인

- `/`가 리다이렉트 없이 기존 홈 화면과 metadata를 직접 소유한다.
- `/home`은 `308 Permanent Redirect`와 `Location: /`를 반환한다.
- 로고, 검색 뒤로가기, 데스크톱/모바일 방 나가기, 강퇴 후 이동이 모두 `/`를 사용한다.
- 제품 코드에는 주소 값으로 사용하는 `/home` 문자열이 남지 않았다.
- 루트 App Router 파일은 Server Component이며, client 홈 화면은 하위에서 조립된다.
- Open Graph URL은 루트 origin으로 출력된다.

## 검증

- `npm run lint`: pass
- `npm run test`: pass — 57 files, 153 tests
- `npm run build`: pass — `/`, `/home` 정적 라우트 생성
- `git diff --check`: pass
- dev HTTP `/`: 200
- dev HTTP `/home`: 308, `Location: /`
- redirect follow: 최종 `/` 200, redirect 1회

## Fresh Read-only Review

- result: pass
- 별도 canonical link는 기존에도 없으며, 이번 범위는 `og:url`과 영구 리다이렉트로 충족한다.

## 잔여 위험

- 외부의 기존 `/home` 링크는 호환 리다이렉트에 의존한다.
