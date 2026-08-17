# UI Flow

## 닉네임

- 닉네임 입력 오른쪽에 `현재 글자 수/19`를 표시한다.
- 최애곡 input과 같은 control/counter CSS를 재사용한다.
- 닉네임 count와 validation 오류를 `aria-describedby`에 연결한다.

## 구조 리팩터링

- `RoomPlaybackScreen`: route/join/session 상태와 joined content composition을 분리한다.
- `RoomProfilePanel`: 프로필/관리 composition과 음악력 query·mutation/button 상태를 분리한다.
- 사용자에게 보이는 room 동작과 CSS 상태는 유지한다.
