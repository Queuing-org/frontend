import { Suspense } from "react";
import OnboardingWizard from "@/src/features/onboarding/ui/OnboardingWizard";

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <div>
        <OnboardingWizard />
      </div>
    </Suspense>
  );
}
