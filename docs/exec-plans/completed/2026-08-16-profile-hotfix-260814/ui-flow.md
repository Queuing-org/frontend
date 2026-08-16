# UI Flow

- `<=480px`: mobile home feed, mobile room tabs/header/modal/card settings.
- `>=481px`: desktop home stage/dock, room floating widgets/control bar; short height still uses compact density.
- profile presence: render an accessible colored avatar dot only when `online` is present; do not infer offline from omission.
- withdrawal/block reason: local textarea state, 500-character counter, reset on cancel/target change/success.
- music-power duplicate: existing `myVote` short-circuits before mutation and shows the same local notice as backend `music-power.already-evaluated`.
- music-power pending: keep the existing enabled button appearance, but ignore additional clicks without advancing the active request's notice sequence.
