import { Suspense } from "react";
import AuthCallbackContent from "./AuthCallbackContent";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <AuthCallbackContent />
    </Suspense>
  );
}
