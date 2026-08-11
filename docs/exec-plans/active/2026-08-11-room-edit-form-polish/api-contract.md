# API Contract

## Temporary Thumbnail Upload

- `POST /api/v2/rooms/thumbnail`
- `multipart/form-data` field: `file`
- consume `result.uploadToken` and preview `result.thumbnailUrl(s)`

## Replace Existing Room Thumbnail

- `PUT /api/v2/rooms/{normalizedSlug}/thumbnail`
- request body: `{ "thumbnailUploadToken": string }`
- response: `ApiResponse<boolean>`; false is treated as failure
- authentication/CSRF use the shared axios client
- success must invalidate the current room meta and discovery/list thumbnail consumers

## General Room Update

- existing room PATCH remains responsible for title, tags, password intent, and max participants.
- thumbnail token is never added to the general PATCH payload.
