# QA Report

## Automated

- `npm run lint`: pass
- `npm run test`: pass — 59 files, 158 tests
- `npm run build`: pass — Next.js production build and TypeScript
- `git diff --check`: pass
- hardcoded visible loading text audit: pass — common `LoadingSpinner` 외 직접 로딩 문구 없음
- `img.youtube.com` Next Image optimizer smoke check: 200

## Read-only review

- selected-room owner source: existing `useRoomMetaQuery`, no room-list response guessing
- selected-only rendering: home `isSelected`, search current navigator selection
- owner bar contract: 56px / rgba(245,245,247,.8) / avatar 32px / text 16px bold #3c3c3c
- empty-state actions: existing authenticated room-create flow reused
- follow empty-state positioning: shared full-height centered state
- result: pass

## Local runtime

- `GET /`: 200
- `GET /search`: 200
- `GET /_next/image?url=https://img.youtube.com/vi/NMLKoKQOlp0/maxresdefault.jpg...`: 200
- automated visual capture was unavailable because the in-app browser connection rejected the sandbox metadata; this was a QA-tool issue, not an application runtime failure.
