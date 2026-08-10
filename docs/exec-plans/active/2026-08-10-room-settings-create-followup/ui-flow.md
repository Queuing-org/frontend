# UI Flow

## 프로필 설정

- `ProfileSettingsForm` 하나가 닉네임·메시지·칭호 행과 완료 버튼·고정 피드백 영역을 렌더링한다.
- `useProfileSettingsForm`이 draft, payload 조합, mutation 결과 대상 필드와 2초 timer cleanup을 소유한다.
- 입력 변경·재요청·언마운트 시 이전 field feedback timer를 해제한다.
- Enter는 form submit을 사용하되 조합 중 Enter는 input keydown에서 차단한다.

## 방 생성 세부 설정

- `CreateSettingsStep` 로컬 상태가 참여 제한 옵션 메뉴 열림만 소유한다.
- 화살표 버튼으로만 메뉴를 열고 document pointerdown과 Escape로 닫는다.
- parent modal은 participation mode/password/max participants 값을 계속 소유하므로 단계 이동에도 값이 유지된다.

## 생성 단계

- `visitStep(index)`가 현재 step 변경과 `furthestVisitedStep = max(previous, index)`를 함께 수행한다.
- 다음/이전/방문한 sidebar 클릭은 모두 이 경로를 사용한다.
