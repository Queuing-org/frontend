# UI Flow

## Edit Room

1. Open with current title, tags, visibility/password state, maximum participants, and thumbnail preview.
2. Selecting a thumbnail immediately starts the existing temporary upload and shows pending/error state.
3. Submit saves changed general fields and/or consumes the uploaded thumbnail token.
4. Close only after every requested mutation succeeds; keep actionable errors visible otherwise.

## Participant Menu

1. `…` remains the trigger and opens the shared compact management menu.
2. The menu renders outside the participant scroll clipping context while keeping trigger-relative placement.
3. Outside click and Escape close it; scrolling only repositions it and does not silently close it.

## Create / Display / Chat

- Genre next action is disabled until at least one tag is selected.
- FREE is a real selected tag for presentation, not an empty-tag sentinel.
- Follow-room control keeps its hit target but renders a 16×16 visual.
- Chat messages render over a transparent surface with a non-interactive blurred fade at the top.
