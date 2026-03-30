"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { OnboardingPayload } from "@/src/entities/user/model/types";
import { useCompleteOnboarding } from "@/src/entities/user/hooks/useCompleteOnboarding";
import { isSafeInternalPath } from "@/src/shared/lib/isSafeInternalPath";
import NicknameStep from "./steps/NicknameStep";

type Step = "nickname"; //"avatar" | "genre" | "favoriteSong"

export default function OnboardingWizard() {
  const router = useRouter();
  const sp = useSearchParams();
  const nextParam = sp.get("next");
  const next = nextParam && isSafeInternalPath(nextParam) ? nextParam : "/";

  const [step, setStep] = useState<Step>("nickname");

  const [draft, setDraft] = useState<Partial<OnboardingPayload>>({});

  const { mutate, isPending } = useCompleteOnboarding();

  const defaultNickname = useMemo(() => draft.nickname ?? "", [draft.nickname]);

  const onNicknameNext = (nickname: string) => {
    const updatedDraft = { ...draft, nickname };
    setDraft(updatedDraft);
    submitAll(updatedDraft);
    // 스텝이 늘면 여기서 setStep("avatar") 이런 식으로 이동
  };

  const submitAll = (payload: Partial<OnboardingPayload>) => {
    if (!payload.nickname) return;

    mutate(payload as OnboardingPayload, {
      onSuccess: () => {
        router.replace(next);
      },
    });
  };

  if (step === "nickname") {
    return (
      <NicknameStep
        defaultValue={defaultNickname}
        submitting={isPending}
        onNext={onNicknameNext}
      />
    );
  }

  return null;
}
