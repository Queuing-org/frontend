# Change Summary

- Feature-owned data/UI code moved out of `src/entities` and `src/widgets`.
- API envelope, boolean result, password header, STOMP subscription header, and query key helpers added.
- Add track, queue, chat composer/scroll, YouTube player, room realtime/playback, follow modal, edit room, and profile settings responsibilities split into hooks and view components.
- Search and room route bodies moved into feature screens.
- Dev/test UI route and entity demo components removed.

Verification:

- `npm run lint` passed with one existing onboarding warning.
- `npm run build` passed.
- Grep checks found no remaining `src/entities`/`src/widgets` imports.
