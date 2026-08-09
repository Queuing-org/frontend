"use client";

import { useCallback, useRef, useState } from "react";
import {
  getDiscoveryModalPreloader,
  type DiscoveryModalKey,
} from "@/src/features/room/discovery/lib/discoveryModalResources";
import { runAfterComponentPreload } from "@/src/shared/lib/preloadableDynamicComponent";

const MODAL_LOAD_ERROR_MESSAGE =
  "화면을 불러오지 못했어요. 다시 시도해 주세요.";

export function useDiscoveryModalController() {
  const modalReservationRef = useRef<DiscoveryModalKey | null>(null);
  const [activeModal, setActiveModal] = useState<DiscoveryModalKey | null>(
    null,
  );
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null);

  const requestModal = useCallback((modalKey: DiscoveryModalKey) => {
    if (modalReservationRef.current) {
      return;
    }

    modalReservationRef.current = modalKey;
    setLoadErrorMessage(null);

    runAfterComponentPreload(
      getDiscoveryModalPreloader(modalKey),
      () => {
        if (modalReservationRef.current !== modalKey) {
          return;
        }

        setActiveModal(modalKey);
      },
      () => {
        if (modalReservationRef.current !== modalKey) {
          return;
        }

        modalReservationRef.current = null;
        setLoadErrorMessage(MODAL_LOAD_ERROR_MESSAGE);
      },
    );
  }, []);

  const closeModal = useCallback(() => {
    modalReservationRef.current = null;
    setActiveModal(null);
  }, []);

  return {
    activeModal,
    closeModal,
    loadErrorMessage,
    requestModal,
  };
}
