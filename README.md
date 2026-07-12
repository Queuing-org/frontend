# 큐잉 (Queuing)

방(ROOM) 기반 음악/신청곡 서비스.

방을 만들고 참여한 뒤, 실시간으로 곡을 신청하고 재생 상태와 참가자, 채팅을 함께 확인할 수 있습니다.

## Tech

Next.js(App Router) · TypeScript · CSS Modules · TanStack Query(React Query) · STOMP WebSocket · Axios

## Run

```bash
npm install
npm run dev
```

https://local.queuing.patulus.com:3000

```bash
npm run lint
npm run build
```

## Env

`.env.local`

```bash
NEXT_PUBLIC_API_BASE_URL=https://api.queuing.patulus.com
NEXT_PUBLIC_WS_URL=wss://api.queuing.patulus.com/ws
```

## Features

- 홈/검색 방 목록과 모바일 대응 UI
- 방 생성, 수정, 비밀번호 입장
- 방 내부 재생 화면, 현재 신청자, 참가자 목록
- 곡 신청, 큐 조회, 내 신청곡/방장 큐 관리
- STOMP WebSocket 기반 방 입장, 재생/큐 이벤트, 실시간 채팅
- REST 기반 채팅 기록 조회와 이전 채팅 로딩
- 프로필, 큐, 채팅, 참가자 플로팅 위젯

## Assets

정적 에셋은 `public/` 아래에서 관리합니다.

칭호 SVG는 참가자 목록 등 사용자 정보 옆에 붙이는 작은 명패 에셋입니다.

```txt
public/icons/title_music_god.svg   # /icons/title_music_god.svg
public/icons/title_hipjjiri.svg    # /icons/title_hipjjiri.svg
```

## Structure (요약)

원칙: `app`은 라우팅과 조립, `features`는 도메인별 API/model/UI, `shared`는 교차 기능 공통 코드에 사용합니다. 자세한 의존 규칙은 [`ARCHITECTURE.md`](./ARCHITECTURE.md)를 기준으로 합니다.

```txt
src/
  app/            # page.tsx (조립)
  features/       # 기능/도메인 단위 API, model, hook, UI
  shared/         # 공통 유틸/컴포넌트
public/
  icons/          # SVG 아이콘, 칭호 명패
  room-defaults/  # 기본 방 이미지
```

## State Rules

- 서버 상태(API 데이터): React Query
- 실시간 이벤트: STOMP WebSocket
- 클라이언트 상태(UI/모달/위젯 위치 등): local component state 또는 localStorage
- 변경(Mutation) 후 관련 Query는 invalidate로 최신화
- 방 비밀번호처럼 요청에 필요한 임시 값은 필요한 화면 경계 안에서만 전달

## Collaboration

- 작업은 Issue 단위로 진행
- PR은 템플릿 기반으로 Summary/Checklist/Attachments/Test 작성
