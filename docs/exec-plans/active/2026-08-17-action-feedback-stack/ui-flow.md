# UI Flow

- The app provider owns a top-center stack and survives route child replacement.
- New notifications appear first; matching keys refresh in place; the oldest item is removed above five.
- Each item starts expiry after 1.5 seconds, then performs a short exit before removal.
- Default items use `role=status`; errors use `role=alert`.
- Forms retain local invalid state and screen-reader descriptions while visual inline errors are replaced by an error notification where requested.
- Confirmation modals remain open after failed destructive actions and close only after success.
- Edit-room track-limit and participant-limit controls are equal-width peers on the first settings row; participation spans the full row below them.
- Edit-room participation matches create-room behavior: clicking anywhere in the control toggles its downward menu, outside click closes it, and Escape closes it while restoring focus.
- Edit-room delete and submit actions share the footer row and each own half of the available width.
