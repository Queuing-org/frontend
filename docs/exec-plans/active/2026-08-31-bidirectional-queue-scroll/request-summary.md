# Request Summary

전체 큐 탭을 과거곡·현재곡·대기곡의 시간순 흐름으로 바꾸고 상·하단 경계에서 각각 history/queue를 자동 조회한다. 현재곡 전환 정렬, prepend/eviction 위치 보존, 방향별 오류 복구, history와 realtime/session cache lifecycle, 최대 40개 history DOM 상한을 포함한다. 내 신청곡은 하단 자동 조회만 적용하고 곡 전환 때 탭이나 위치를 강제로 바꾸지 않는다.

배포 범위는 공유 `dev` 브랜치 구현·검증·커밋·push와 remote 기본 브랜치 `main` 대상 Draft PR까지다.
