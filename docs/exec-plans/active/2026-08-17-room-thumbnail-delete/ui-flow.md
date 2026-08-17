# UI Flow

- `RoomThumbnailSettingField` owns the shared label, help tooltip, and two-card layout.
- `RoomThumbnailUploadField` renders upload/default choices and their selected, focus, disabled, preview, and status states; it does not own submit intent.
- create maps a selected temporary file to the upload card and no file to the default card.
- edit `useEditRoomForm` owns `upload | default` draft intent alongside the existing temporary upload and submit orchestration.
- edit opens with upload selected only when the server supplied a thumbnail URL; selecting default stages deletion, selecting a new file stages replacement.
- X controls are not rendered. Closing the modal discards the local draft.
