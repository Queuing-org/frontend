# 백엔드·배포 워크플로 전달: 점검 모드

- Backend issue: https://github.com/Queuing-org/backend/issues/8

## 목적

프론트는 Vercel Edge Config의 `maintenance` 값을 요청 시점에 읽는다. 백엔드 배포 워크플로는 점검 시작 전에 같은 값을 활성화하고, 배포·마이그레이션·헬스체크가 모두 끝난 뒤 비활성화한다. 프론트 재배포는 필요하지 않다.

## Edge Config 계약

Key: `maintenance`

```json
{
  "enabled": true,
  "startsAt": "2026-08-22T22:00:00+09:00",
  "endsAt": "2026-08-22T23:00:00+09:00",
  "message": "안정적인 서비스 제공을 위해 서버를 점검하고 있습니다."
}
```

- `enabled`: boolean, 필수. `true`일 때만 프론트 요청을 점검 페이지로 전환한다.
- `startsAt`: ISO 8601 timestamp, 선택. UTC offset을 반드시 포함한다.
- `endsAt`: ISO 8601 timestamp, 선택. UTC offset을 반드시 포함한다.
- `message`: 1~200자 string, 선택. 비어 있거나 범위를 벗어나면 프론트 기본 문구를 사용한다.
- 점검 시간은 표시용 메타데이터다. 예약 시간이 되었다고 자동으로 점검 모드를 켜거나 끄지 않으며 `enabled`가 유일한 차단 스위치다.
- 시작·종료 시각이 유효하지 않거나 종료가 시작보다 빠르면 프론트는 시간 구간만 숨기고 점검 차단은 유지한다.

점검 해제 값:

```json
{
  "enabled": false,
  "startsAt": "2026-08-22T22:00:00+09:00",
  "endsAt": "2026-08-22T23:00:00+09:00"
}
```

## Vercel 쓰기 API

배포 워크플로는 Vercel REST API의 Edge Config batch update를 사용한다.

```text
PATCH https://api.vercel.com/v1/edge-config/{EDGE_CONFIG_ID}/items?teamId={VERCEL_TEAM_ID}
Authorization: Bearer {VERCEL_TOKEN}
Content-Type: application/json
```

Request body:

```json
{
  "items": [
    {
      "operation": "upsert",
      "key": "maintenance",
      "value": {
        "enabled": true,
        "startsAt": "2026-08-22T22:00:00+09:00",
        "endsAt": "2026-08-22T23:00:00+09:00",
        "message": "안정적인 서비스 제공을 위해 서버를 점검하고 있습니다."
      }
    }
  ]
}
```

`VERCEL_TOKEN`, `EDGE_CONFIG_ID`, `VERCEL_TEAM_ID`는 GitHub Actions 또는 배포 시스템 secret으로만 관리한다. 브라우저, `NEXT_PUBLIC_*`, 저장소 파일, 로그에 쓰기 토큰을 노출하지 않는다.

## 권장 배포 순서

1. Edge Config `maintenance.enabled=true`
2. 백엔드 maintenance guard 활성화
3. 신규 REST·STOMP 요청 차단 및 진행 중 요청 drain
4. 백엔드 배포와 DB migration
5. health check와 운영자 smoke test
6. 백엔드 maintenance guard 비활성화
7. 실제 API·STOMP 정상 응답 확인
8. Edge Config `maintenance.enabled=false`

종료 순서는 반드시 백엔드 정상화가 먼저고 프론트 개방이 마지막이다.

헬스체크는 프론트 공개 URL이 아니라 maintenance guard에서 제외한 백엔드 전용
health endpoint를 호출해야 한다. 프론트 공개 URL은 점검 중에도 `307`로
`/maintenance`에 연결되고 최종 `200`을 반환하므로 백엔드 정상화 판정에 사용할
수 없다.

## 백엔드 후속 계약

- 점검 중 REST 요청은 `503 Service Unavailable`과 `Retry-After`를 반환한다.
- 오류 응답에 안정적인 코드 `system.maintenance`를 포함한다.
- health check와 승인된 운영자 smoke 경로는 maintenance guard에서 제외한다.
- 신규 STOMP 연결 또는 방 입장은 거절한다.
- 기존 접속자에게 `/user/...` 또는 app-wide topic으로 `SYSTEM_MAINTENANCE` 이벤트를 전송한 뒤 연결을 종료한다.
- 프론트 후속 구현은 `system.maintenance` 또는 `SYSTEM_MAINTENANCE`를 받으면 `/maintenance`로 이동한다.

Proxy만으로는 이미 열린 탭과 `api.queuing.cc` 직접 요청을 차단할 수 없으므로 백엔드 guard는 필수다.
