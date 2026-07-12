# Korean IME Enter Sent Partial Chat Messages

## Problem

Room chat sent broken duplicate-looking Korean messages when a user typed Korean and pressed Enter. Reported examples:

- typing `하이` could send/display fragments like `이` and `하이`
- typing `가나다라` could send/display fragments like `가나다라` and `라`

## Previous Behavior

`RoomChatComposer` submitted chat on every Enter keydown unless Shift was held. It did not distinguish a real submit Enter from an IME composition Enter used to confirm Korean text.

## Previous Code

```tsx
onKeyDown={(event) => {
  if (event.key !== "Enter" || event.shiftKey) {
    return;
  }

  event.preventDefault();
  submitMessage();
}}
```

## Updated Code

```tsx
onCompositionStart={() => {
  isComposingRef.current = true;
}}
onCompositionEnd={() => {
  isComposingRef.current = false;
}}
onKeyDown={(event) => {
  if (event.key !== "Enter" || event.shiftKey) {
    return;
  }

  if (
    event.nativeEvent.isComposing ||
    event.keyCode === 229 ||
    isComposingRef.current
  ) {
    return;
  }

  event.preventDefault();
  submitMessage();
}}
```

## Problem in the Previous Code

Korean input uses IME composition. During composition, Enter often means "confirm the current composed syllable/text", not "submit the form". The previous keydown handler treated that IME Enter as a submit command, so it could publish the partially composed value before the browser finished committing the full text. After composition ended, the textarea state could contain the completed value, allowing another Enter or submit path to send the full or trailing value. That made messages look duplicated or split.

## Evidence

- confirmed reproduction steps: user reported typing Korean text in chat and pressing Enter produced split/duplicate messages.
- previous code path: `RoomChatComposer` Enter keydown immediately called `submitMessage()`.
- after-change checks: `npm run lint` and `npm run build` passed.
- manual browser verification: not run in this session.

## Cause or Remaining Hypotheses

Confirmed cause from code path and symptom match: the Enter submit handler did not guard IME composition state. No evidence points to STOMP duplicate delivery because fragments matched Korean composition boundaries, and the publish path was triggered directly from keydown.

## Solution Options

- Only use the send button for chat submit: avoids IME Enter issues but removes expected Enter-to-send behavior.
- Delay Enter submit with a timeout: brittle and browser/IME dependent.
- Guard Enter submit with composition state: preserves Enter-to-send and blocks composition-confirm Enter.

## Chosen Solution and Rationale

Use composition guards. The fix checks `event.nativeEvent.isComposing`, `event.keyCode === 229`, and a local `compositionstart/compositionend` ref before submitting. The extra ref covers browser/React timing differences around composition events. This keeps Enter-to-send for completed text while preventing partial IME text from being published.

## Result

Korean composition Enter no longer submits chat. A completed Korean message is sent only after composition has ended and the user presses Enter or the send button.

## Reusable Rule

Any text input or textarea that submits on Enter must ignore Enter while IME composition is active: check `nativeEvent.isComposing`, `keyCode === 229`, or an explicit composition ref before calling submit.

## Skill or Team Spec Updates

- skill updated: `.agents/skills/queuing-ui-flow/SKILL.md`
- team spec updated: no

## Verification

- `npm run lint`: passed, with pre-existing `OnboardingWizard.tsx` unused `setStep` warning.
- `npm run build`: passed.
- residual risk: Korean IME behavior should still be manually checked in browser because composition event timing differs by OS/browser.
