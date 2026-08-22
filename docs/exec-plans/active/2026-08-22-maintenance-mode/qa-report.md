# QA Report

## 결과

- verdict: pass
- fresh read-only review: pass after Edge Config stale fallback, production log isolation, test isolation, and color contrast fixes
- backend follow-up: https://github.com/Queuing-org/backend/issues/8

## 자동 검증

- targeted: 4 files, 20 tests passed
- `npm run test`: 149 files, 583 tests passed
- `npm run lint`: passed
- `npm run build`: passed; `/maintenance` dynamic route and Proxy generated
- `git diff --check`: passed

## 수동·접근성 검증

- 로컬 개발 서버에서 `/maintenance` 직접 요청이 `200`과 기대 문구를 반환하는 것을 확인했다.
- 점검 페이지의 사과 문구는 `이용에 불편을 드려 죄송합니다.`까지만 표시하고 감사 문구가 없음을 컴포넌트 테스트로 고정했다.
- 텍스트 대비: eyebrow `6.17:1`, 사과 문구 `6.05:1`, 기본 버튼 `6.17:1`, hover 버튼 `7.95:1`로 WCAG AA를 충족한다.
- 연결 가능한 브라우저 인스턴스가 없어 모바일 실제 viewport 시각 QA는 수행하지 못했다.

## Fresh review 수정

- Edge Config SDK의 기본 1주 stale fallback을 `staleIfError: false`로 꺼서 조회 실패 시 이전 점검 상태 대신 fail-open하도록 했다.
- Production 연결 누락과 조회 실패 로그에서 연결 문자열·토큰·예외 상세를 배제하고 실행 인스턴스당 한 번만 기록한다.
- Vercel Preview는 `EDGE_CONFIG`가 없어도 누락 로그 없이 정상 서비스로 통과한다.
- Production/Preview 환경 분기 테스트는 fresh module state로 격리해 전역 로그 플래그에 의한 false positive를 막았다.
- 작은 글자와 버튼 색상을 진하게 조정해 AA 대비를 확보했다.

## 잔여 위험

- 실제 Vercel Production Edge Config 전파와 배포 워크플로 batch update는 환경 의존 통합 QA가 남아 있다.
- Proxy는 새 페이지 요청만 전환한다. 이미 열린 탭, 직접 API 요청, STOMP 세션 차단은 backend issue #8 구현이 필요하다.
- 점검 중 프론트 공개 URL은 최종 `200`이므로 backend 전용 health endpoint로 정상화를 확인해야 한다.
