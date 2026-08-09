# QA Report

## Scope

- 프로필, 참가자 목록, 채팅의 방장 위임 피드백
- 공용 일시 오류 훅의 타이머, 재시도, 오래된 응답, unmount 처리

## Automated Verification

- targeted: 4 files, 38 tests passed
- full suite: 83 files, 255 tests passed
- lint: passed
- production build: passed

## Behavioral Coverage

- 성공 callback과 성공 문구 없음
- 실패 문구만 `alert`로 노출
- 실패 문구는 2초 후 자동 제거
- 재시도나 대상/방 전환 뒤 도착한 이전 오류 무시
- unmount 시 타이머 정리

## Manual QA

- 실제 API를 연결한 브라우저 수동 검증은 수행하지 않음

## Review

- fresh QA 1차: 세 진입점 중 참가자 목록과 채팅 누락, 대상 전환 stale 오류를 발견하여 수정
- fresh QA 재검토: `ship`
- 비차단 권장사항이던 프로필 `roomSlug` 전환 초기화도 반영
