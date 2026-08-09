# QA Report

## 자동 검증

- `npm run test`: 76 files, 227 tests passed
- `npm run lint`: passed
- `npm run build`: passed
- `git diff --check`: passed

## 실제 연결 검증

- `local.queuing.cc` DNS: `127.0.0.1`
- 새 mkcert SAN: `local.queuing.cc`, `localhost`, `127.0.0.1`, `::1`
- 격리한 새 도메인 개발 서버 `https://local.queuing.cc:3001/`: HTTP 200
- `https://api.queuing.cc/api/v1/rooms?size=1`: HTTP 200
- 실제 태그 `anime` 요청: HTTP 200, 반환된 방의 태그 조건 일치

## Fresh read-only QA

- 결과: PASS
- 이용 시간 포매터와 두 프로필 화면 연결 확인
- 홈·검색 태그 선택 제한, ALL 제거, 쿼리 키 분리, 커서 페이지 조건 유지 확인
- REST·WS·로컬 HTTPS 활성 설정에서 구 도메인 제거 확인
- 기존 `FollowModal.module.css` 사용자 변경 미포함 확인

## 제한

- 인앱 브라우저 인스턴스가 없어 브라우저 자동화는 수행하지 못했다.
- 대신 별도 작업 복제본에서 새 HTTPS dev 서버를 기동해 컴파일과 HTTP 응답을 검증했다.

## 원격 검증

- GitHub Actions `Lint, test, and build`: passed
- Vercel: passed
- CodeRabbit: passed (Draft PR review skipped)
