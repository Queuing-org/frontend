# 큐잉 (Queuing)

방(ROOM) 기반 음악/신청곡 서비스 (MVP)

## Tech

Next.js(App Router) · TypeScript · CSS Modules · TanStack Query(React Query) · Jotai · Axios

## Run

```bash
npm install
npm run dev
```

https://local.queuing.patulus.com:3000

## Env

`.env.local`

```bash
NEXT_PUBLIC_API_BASE_URL=https://api.queuing.patulus.com
NEXT_PUBLIC_WS_URL=wss://api.queuing.patulus.com/ws
```

## Structure (요약)

원칙: `app`은 라우팅/조립, 로직은 `entities`/`features`로 분리

```txt
src/
  app/            # page.tsx (조립)
  entities/       # 도메인(데이터): types/api/queries/ui
  features/       # 기능 단위(auth, profile, room-create 등)
  shared/         # 공통 유틸/컴포넌트
```

## State Rules

- 서버 상태(API 데이터): React Query
- 클라이언트 상태(UI/세션 등): Jotai
- 변경(Mutation) 후 관련 Query는 invalidate로 최신화

## Collaboration

- 작업은 Issue 단위로 진행
- PR은 템플릿 기반으로 Summary/Checklist/Attachments/Test 작성
