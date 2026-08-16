# Change Summary

Frontend clients now target the hotfix REST/error contract without deprecated fallbacks. Onboarding was removed; room and profile resource paths, 204 mutations, optional patch fields and cursor queries were updated. Realtime room metadata is REST-authoritative, terminal room events perform complete cleanup with a one-shot home notice, and deleted chat messages use persistent tombstones. Profile relationship drives follow actions and user lists page automatically with de-duplication and retry UI.
