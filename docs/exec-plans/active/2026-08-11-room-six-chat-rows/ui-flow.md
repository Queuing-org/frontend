# UI Flow

## Desktop/landscape joined room

1. viewport height determines the room chat density continuously.
2. density determines one-line message height, five inter-row gaps, list padding, and requester-card height.
3. the central chat section reserves the resulting six-row minimum height.
4. the remaining vertical space determines the 16:9 player width.
5. requester presence subtracts the scaled requester-card height before player width is calculated.
6. the control bar remains absolutely docked in its existing reserved space.

## Non-target surfaces

- mobile room layout keeps its existing tabbed playback/chat flow.
- floating widget geometry keeps its existing normal/compact density and drag storage.
- home, search, create, settings, and follow surfaces do not inherit the room page variables.
