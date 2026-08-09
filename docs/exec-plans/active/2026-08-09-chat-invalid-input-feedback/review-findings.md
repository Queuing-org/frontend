# Review Findings

## Actionable

### 서버 invalid-input 메시지의 composer 하단 노출

- 현재 사용자 방 이벤트의 모든 `ERROR.data.message`가 `sendErrorMessage`로 전달된다.
- 금칙어 검증의 `invalid-input`도 일반 전송 장애와 같은 하단 빨간 오류로 노출된다.
- pending 해제는 유지하고, `invalid-input`의 사용자 표시 메시지만 제거한다.

## PR 상태

- 시작 시 GitHub Actions 및 Vercel: pass
