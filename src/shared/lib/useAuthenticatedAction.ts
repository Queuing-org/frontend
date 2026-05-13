"use client";

import { useCallback, useState } from "react";
import { useMe } from "@/src/entities/user/hooks/useMe";

type AuthenticatedActionOptions = {
  description: string;
  onAuthenticated: () => void;
};

export function useAuthenticatedAction(defaultDescription: string) {
  const [isAuthRequiredModalOpen, setIsAuthRequiredModalOpen] = useState(false);
  const [authRequiredDescription, setAuthRequiredDescription] =
    useState(defaultDescription);
  const { data: me, refetch: refetchMe } = useMe();

  const requestAuthenticatedAction = useCallback(
    async ({ description, onAuthenticated }: AuthenticatedActionOptions) => {
      if (me) {
        onAuthenticated();
        return;
      }

      const result = await refetchMe();

      if (result.data) {
        onAuthenticated();
        return;
      }

      setAuthRequiredDescription(description);
      setIsAuthRequiredModalOpen(true);
    },
    [me, refetchMe],
  );

  const closeAuthRequiredModal = useCallback(() => {
    setIsAuthRequiredModalOpen(false);
  }, []);

  return {
    authRequiredDescription,
    closeAuthRequiredModal,
    isAuthRequiredModalOpen,
    requestAuthenticatedAction,
  };
}
