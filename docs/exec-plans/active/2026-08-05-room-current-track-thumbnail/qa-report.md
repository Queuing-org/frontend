# QA Report

## 결과

- 판정: `pass`
- 기존 기본 방 썸네일 10개 삭제 및 단일 빈 방 fallback JPEG 교체 확인
- 서버 `thumbnailUrls`/`thumbnailUrl` 우선, 값이 없을 때만 fallback 사용 확인
- `TRACK_STARTED`와 `TRACK_ENDED`에서 해당 방 메타 캐시 무효화 확인
- 시간 기반 polling이 추가되지 않았음을 확인

## 자동 검증

- `git diff --check`: pass
- 대상 테스트: 2 files / 8 tests pass
- `npm run lint`: pass
- 전체 테스트: 62 files / 167 tests pass
- `npm run build`: pass

## 이미지 증거

- 파일: `public/room-defaults/queuing-empty-room-thumbnail.jpg`
- 형식/크기: JPEG, 2240×2240, 약 711KB
- 원본과 복사본 SHA-256 일치: `830ee16e8c7f3b16008d3cefc86bc97ad442f57ef8a71b49cafb52453068e256`

## 잔여 확인 사항

- 실제 배포 환경에서 STOMP 곡 전환 사건 발행 시점보다 방 메타 썸네일 갱신이 먼저 완료되는지 네트워크 QA 1회 권장
- 일반 곡 전환에서는 `TRACK_ENDED`와 `TRACK_STARTED`가 연속 발생해 메타 요청이 최대 2회 발생할 수 있으나, 시간 기반 반복 요청은 아니며 곡 전환에만 비례함
