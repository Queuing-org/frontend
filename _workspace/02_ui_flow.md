# UI Flow Notes

## Thumbnail Selection State

- `useRoomThumbnailSelection` owns file validation, object URL preview creation, preview failure state, and URL revocation.
- The reusable `RoomThumbnailUploadField` is presentational; it receives selected file state and emits file-change, clear, and preview-error events.
- Allowed extensions are `jpg`, `jpeg`, `png`, `heic`, `heif`, and `webp`.
- Maximum file size is 6MB.
- HEIC/HEIF preview failures show the selected file name instead of a broken preview.

## Create Room Flow

- `useCreateRoom` only creates the room and invalidates the room list.
- `RoomFormModal` owns post-create orchestration:
  - create room
  - if a thumbnail was selected, upload it
  - navigate to `/room/{slug}` after upload success or when no thumbnail is selected
- If create succeeds but thumbnail upload fails, the client immediately attempts to delete the created room.
- The user stays in the create form and receives a red frontend error; no room navigation is offered for thumbnail-upload failure.
- The final create action is blocked while local thumbnail validation has an error, including files over 6MB.

## Edit Room Flow

- `useEditRoomForm` owns PATCH payload calculation and optional thumbnail upload.
- It sends room PATCH only when title/tags/password changed.
- It sends thumbnail PUT only when a new file is selected.
- The clear action removes only the local file selection; it does not delete the server thumbnail.
- Existing thumbnail preview comes from `roomMeta.thumbnailUrl`.

## Image Fallback

- `getRoomImageSrc(thumbnailUrl, seed)` is the shared choice point.
- Home stage, mobile home cards, search selected thumbnail, and room background use `thumbnailUrl` first and the default room image second.
