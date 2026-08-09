# 채팅 invalid-input 하단 문구 숨김

## 상태

- 단계: ready
- 브랜치: `dev`
- 전달 대상: Draft PR #36

## 범위

- 채팅 전송 pending은 서버 `ERROR` 이벤트로 정상 종료한다.
- 서버 코드가 `invalid-input`이면 composer 하단 오류 문구는 표시하지 않는다.
- 네트워크 지연, 연결 실패 등 다른 전송 오류 안내는 유지한다.

## 수용 조건

- 금칙어 등 `invalid-input` 응답 뒤 하단에 "잘못된 입력값" 문구가 나오지 않는다.
- 해당 pending 타이머가 정리되어 지연 오류가 뒤늦게 나오지 않는다.
- 다른 서버 오류 메시지는 기존처럼 표시된다.
- 테스트, lint, build, fresh read-only QA와 원격 CI를 통과한다.

## 진행

- [x] 오류 이벤트 및 렌더링 경로 확인
- [x] 오류 표시 정책 구현 및 테스트
- [x] 로컬 QA
- [x] push 및 원격 CI
