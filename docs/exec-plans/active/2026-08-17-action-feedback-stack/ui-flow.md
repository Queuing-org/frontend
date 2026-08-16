# UI Flow

- The app provider owns a top-center stack and survives route child replacement.
- New notifications appear first; matching keys refresh in place; the oldest item is removed above five.
- Each item starts expiry after 1.5 seconds, then performs a short exit before removal.
- Default items use `role=status`; errors use `role=alert`.
- Forms retain local invalid state and screen-reader descriptions while visual inline errors are replaced by an error notification where requested.
- Confirmation modals remain open after failed destructive actions and close only after success.
