# Request Summary

Replace scattered action-result banners and result modals with an app-scoped stack notification system. Preserve confirmations, read/empty/retry failures, loading states, and badge-acquisition celebrations. Notifications expose only `notify({ dedupeKey, message, tone })`, persist across route-child replacement, deduplicate repeated actions, cap at five, and distinguish default/status from error/alert. Migrate the explicitly listed follow, profile, music-power, room management, room lifecycle, queue, playback, chat, and account actions without changing backend contracts.
