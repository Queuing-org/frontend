# API Contract

## Delete Existing Room Thumbnail

- method: `DELETE`
- path: `/api/v2/rooms/{normalizedSlug}/thumbnail`
- response: `ApiResponse<boolean>`
- `false` result is an error with the fallback message `방 썸네일을 삭제하지 못했습니다.`
- success invalidates room discovery/list queries and the normalized room meta query.

## Submit precedence

- selected temporary upload token: call existing thumbnail PUT only
- default image selected from an initially uploaded room: call thumbnail DELETE only
- unchanged thumbnail: call neither thumbnail mutation
- general room PATCH remains limited to explicitly changed room fields
